const express = require('express');
const logger = require('morgan');

const bodyParser = require('body-parser');

const jwt = require ('./lib/jwt');
const userHandler = require('./lib/userHandler');
const errorHandler = require ('./lib/error');
const LoginHandler = require('./lib/loginHandler');


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

  const permissionsHandler = require('./lib/permissionsHandler')(db);

  permissionsHandler.loadRoles(config.routes);
  require('./lib/dbLoader')(config, db, () => {});
  const schema = require ('./lib/rootSchemaBuilder')(config, db, errorHandler, permissionsHandler);
  const graphqlHandler = require('./lib/graphQLHandler')(debug, errorHandler, schema);

  let app = express();

  app.use(logger('short'));

  app.use ((req, res, next) => {
    req.loginHandler = LoginHandler(db, errorHandler, permissionsHandler);
    req.user = userHandler(req.loginHandler, permissionsHandler, config);
    next();
  });

  app.use(jwt(config.authentication));

  app.use(bodyParser.text(
    { type: 'application/json' }
  ));

  app.use(graphqlHandler.requestParser);

  app.post('/graphql', (req, res, next)=>{
    graphqlHandler.graphqlExecute(req, req, res, next);
  });

  app.use((req, res, next) => {
    if (req.result) {
      res.status(req.status).json(req.result);
    } else (
      next()
    );
  });

  app.get('/graphiql', (req, res) => {
    res.status(200).sendFile(__dirname + '/graphiql/index.html');
  });

  app.use((req, res) => {
    let err = new Error('Not Found');
    err.status = 404;
    res.status(err.status).send('Not Found');
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

    socket.loginHandler = LoginHandler(db, errorHandler, permissionsHandler);
    socket.user = userHandler(socket.loginHandler, permissionsHandler, config);

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
      graphqlHandler.requestParser(req, res, () => {
        graphqlHandler.graphqlExecute(socket, req, res, () => {
          res(req.result.errors, req.result);
        });
      }

      );
    });

  }).on('error', (err) => {
    debug.error(err);
  });


  //API to allow direct access to the database instances from the consuming
  //application - intented to allow use of redis as a messenger, and data import/export

  if (config.dataService) {
    config.dataService(db);
  }

  const {graphql} = require('graphql');


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
