const express = require('express');
const logger = require('morgan');
const {graphql} = require('graphql');
const bodyParser = require('body-parser');
const cognito = require ('./lib/cognito');
const errorHandler = require ('./lib/error');

module.exports = (config) => {

  const db = require ('./lib/dbSetup')(config.database);

  const routes = config.routes.routes;

  const loadModels = (routes, db) => {
    for (let r of routes) {
      require(config.routes.rootDirectory + r + '/model')(db.cassandra);
    }
  }

  loadModels(routes, db);
  const schema = require ('./graphql/rootSchema')(config.routes.rootDirectory, routes);

  let authConfig = {
    jwtCert:config.cognito.publicKey,
    identityPoolId: config.cognito.awsRegion + ':' +  config.cognito.identityPoolUuid,
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

  app.listen(config.server.port);
  console.log('Running a GraphQL API server at localhost:' + process.env.PORT+ '/graphql');


  return app
}
