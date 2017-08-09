const express = require('express');
const logger = require('morgan');
const {graphql} = require('graphql');
const bodyParser = require('body-parser');
const cognito = require ('./lib/cognito');
const errorHandler = require ('./lib/error');

module.exports = (config) => {

  const db = require ('./lib/dbSetup')(config.database);

  config.routes.push(
    {
      routes:['user'],
      rootDirectory:__dirname + '/graphql/'
    }
  );

  require('./lib/loader')(config.routes, db);

  const schema = require ('./lib/rootSchemaBuilder')(config.routes);

  const cognitoConf = config.authentication.cognito;

  let authConfig = {
    jwtCert:cognitoConf.publicKey,
    identityPoolId: cognitoConf.awsRegion + ':' +  cognitoConf.identityPoolUuid,
    error: errorHandler,
    cassandra: db.cassandra,
    userBlacklist: require ('./lib/blacklist')(db)
  };

  const authenticate = cognito(authConfig);

  let app = express();

  app.use(logger('dev'));

  app.use ((req, res, next) => {
    req.db = db;
    req.errorHandler = errorHandler;
    //TODO check DBs are connected - if not connect
    next();
  })

  app.use(authenticate);

  // Get the body for the application/graphql mime-type
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

  // app.listen(config.server.port);
  console.log('Running a GraphQL API server at localhost:' + config.server.port + '/graphql');

  const http = require('http');
  http.createServer(app).listen(config.server.port);


  return;
}
