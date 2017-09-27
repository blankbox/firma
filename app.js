const express = require('express');
const logger = require('morgan');

const {graphql} = require('graphql');
const bodyParser = require('body-parser');

const jwt = require ('./lib/jwt');
const userHandler = require('./lib/userHandler');
const tokenHandler = require('./lib/tokenHandler');
const errorHandler = require ('./lib/error');
const loginHandler = require('./lib/loginHandler');
const fs = require('fs');


module.exports = (config) => {

  const debug = config.debug;

  const db = require ('./lib/dbSetup')(debug, config.database );

  config.routes.push(
    {
      routes:['user', 'login', 'permissions'],
      rootDirectory:__dirname + '/graphql/'
    }
  );

  if (config.search){
    config.routes.push(
      {
        routes:['search'],
        rootDirectory:__dirname + '/graphql/'
      }
    );
  }

  if (config.authentication.local){
    //TODO load local login
  }
  const permissionsHandler = require('./lib/permissionsHandler')(db);

  const loadRoles = (routes) => {
    for (let dir of routes) {
      for (let r of dir.routes) {
        let file = dir.rootDirectory + r;
        if (fs.existsSync(file + '/permissions.js')) {
          permissionsHandler.addPermissionsToRole(require(file + '/permissions.js'), ()=>{});
        }
      }
    }
  };

  loadRoles(config.routes);
  require('./lib/dbLoader')(config.routes, db);
  const schema = require ('./lib/rootSchemaBuilder')(config, db, errorHandler, permissionsHandler);

  let app = express();
  app.use(logger('short'));


  app.use ((req, res, next) => {
    req.db = db;
    req.permissionsHandler = permissionsHandler;
    req.errorHandler = errorHandler;
    req.loginHandler = loginHandler(db, errorHandler, permissionsHandler);
    req.user = userHandler(req.loginHandler, req.permissionsHandler);
    req.tokenHandler = tokenHandler(db, config.authentication.local || {});
    next();
  });

  app.use(jwt(config.authentication));

  app.use(bodyParser.text(
    { type: 'application/graphql' }
  ));


  app.use((req, res, next) => {
    debug.debug('---------------------------------------------------------');
    debug.debug('user perms:', req.user);
    debug.debug(req.body);
    next();
  });

  app.post('/graphql', (req, res) => {
    graphql(schema, req.body,  req).then(result => {
      req.result = result;
      let status = 200;

      if (result.errors){
        let err = errorHandler.errorHandler(result.errors);
        result.errors = err.errors;
        status = err.status;
      }

      res.status(status).json(result);
    });
  });

  app.get('/graphiql', (req, res) => {
    res.status(200).sendFile(__dirname + '/graphiql/index.html');
  });

  app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    res.status(err.status).send('Not Found');
    next(err);
  });

  let server;

  if (config.https) {
    const https = require('https');
    server = https.createServer({cert: config.https.cert, key: config.https.key}, app);
    server.listen(config.https.port);
  } else {
    const http = require('http');
    server = http.createServer(app);
    server.listen(config.http.port);
  }

  const socketClusterServer = require('socketcluster-server');

  const scServer = socketClusterServer.attach(server);

  scServer.on('connection', (socket) => {
    socket.db = db;
    socket.permissionsHandler = permissionsHandler;
    socket.errorHandler = errorHandler;
    socket.loginHandler = loginHandler(db, errorHandler, permissionsHandler);
    socket.user = userHandler(socket.loginHandler, socket.permissionsHandler);
    socket.tokenHandler = tokenHandler(db, config.authentication.local || {});

    socket

    .on('login', (req,  res) => {
      socket.headers = req.headers;
      jwt(config.authentication)(socket, null, () => {
        if (socket.user.loginUid) {
          socket.setAuthToken({loginUid: socket.user.loginUid, aud: socket.user.audience});
          return res();
        } else {
          return res(socket.user.error);
        }
      });
    })

    .on('graphql', (req, res) => {

      graphql(schema, req.body,  socket).then(result => {
        req.result = result;
        let err = null;
        if (result.errors){
          let err = errorHandler.errorHandler(result.errors);
          result.errors = err.errors;
        }
        res(err, result);
      });
    });



  }).on('error', (err) => {
    debug.error(err);
  });
  //API to allow direct access to the database instances from the consuming
  //application - intented to allow use of redis as a messenger, and data import/export

  if (config.dataService) {
    config.dataService(db);
  }


  if (config.returnSchema) {
    const {
      introspectionQuery,
      printSchema,
    } = require('graphql/utilities');
    graphql(schema, introspectionQuery).then((result) => {
      config.returnSchema(
        {
          json:JSON.stringify(result, null, 2),
          human:printSchema(schema),
          schema
        }
      );
    });

  }
};
