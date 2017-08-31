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

  const db = require ('./lib/dbSetup')(config.database);

  config.routes.push(
    {
      routes:['user', 'login', 'permissions'],
      rootDirectory:__dirname + '/graphql/'
    }
  );

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
  }

  loadRoles(config.routes);
  require('./lib/dbLoader')(config.routes, db);
  const schema = require ('./lib/rootSchemaBuilder')(config.routes, db, errorHandler, permissionsHandler);
  let app = express();

  if (config.node.env != 'pro') {
    app.use(logger('dev'));
  }

  app.use ((req, res, next) => {
    req.db = db;
    req.permissionsHandler = permissionsHandler;
    req.errorHandler = errorHandler;
    req.user = userHandler();
    req.tokenHandler = tokenHandler(db, config.authentication.local || {});
    req.loginHandler = loginHandler(db, errorHandler, permissionsHandler);
    next();
  });


  if (config.node.env != 'pro') {
    app.use('/graphiql', require('express-graphql')({
      schema: schema,
      graphiql: true,
    }));

  }

  app.use(jwt(config.authentication));

  app.use(bodyParser.text(
    { type: 'application/graphql' }
  ));

  if (config.node.env != 'pro' ) {
    app.use((req, res, next) => {
      console.log('--------------------------------------------------------------------');
      // console.log(req.headers);
      console.log('user perms:', req.user);
      console.log(req.body);
      next()
    })

  }

  app.post('/graphql', (req, res) => {

    graphql(schema, req.body,  req).then(result => {
      req.result = result;
      if (config.node.env != 'pro' ) {
        console.log(result);
      }
      console.log(result);

      if (req.result.errors){
        let err = errorHandler.errorHandler(req.result.errors);
        req.result.errors = err.errors;
        res.status(err.status || 400).json(req.result);
      } else {
        res.send(req.result);
      }
    });
  });

  app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    res.status(err.status).send('Not Found')
    next(err);
  });

  if (config.https) {
    const https = require('https');
    https.createServer({cert: config.https.cert, key: config.https.key}, app).listen(config.https.port);
  } else {
    const http = require('http');
    http.createServer(app).listen(config.http.port);
  }

  //API to allow direct access to the database instances from the consuming
  //application - intented to allow use of redis as a messenger, and data import/export
  //
  if (config.dataService) {
    config.dataService(db);
  }

}
