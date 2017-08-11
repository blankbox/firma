const express = require('express');
const logger = require('morgan');
const {graphql} = require('graphql');
const bodyParser = require('body-parser');


const jwt = require ('./lib/jwt');
const userHandler = require('./lib/userHandler');
const tokenHandler = require('./lib/tokenHandler');
const errorHandler = require ('./lib/error');

module.exports = (config) => {

  const db = require ('./lib/dbSetup')(config.database);

  config.routes.push(
    {
      routes:['user'],
      rootDirectory:__dirname + '/graphql/'
    }
  );

  require('./lib/dbLoader')(config.routes, db);
  const schema = require ('./lib/rootSchemaBuilder')(config.routes);

  let authConfig = {
    authentication:config.authentication,
    tokenHandler:userHandler(db),
    userHandler:tokenHandler(db)
  };

  let app = express();

  app.use(logger('dev'));

  app.use ((req, res, next) => {
    req.db = db;
    req.errorHandler = errorHandler;
    next();
  });

  app.use(jwt(authConfig));

  app.use(bodyParser.text(
    { type: 'application/graphql' }
  ));

  app.post('/graphql', (req, res) => {
    graphql(schema, req.body,  req).then(result => {
      req.result = result;
      if (req.result.errors){
        let err = errorHandler.errorHandler(req.result.errors);
        //TODO workout how to deal with multiple errors cleanly
        res.status(err.status || 400).json({error:err.message});
      } else {
        res.send(req.result);
      }
    });
  });

  app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  if (config.https) {
    const https = require('https');
    https.createServer({cert: config.https.cert, key: config.https.key}, app).listen(config.https.port);
  } else {
    const http = require('http');
    http.createServer(app).listen(config.http.port);
  }
}
