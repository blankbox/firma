const express = require('express');
const logger = require('morgan');
const {graphql} = require('graphql');
const bodyParser = require('body-parser');

const jwt = require ('./lib/jwt');
const userHandler = require('./lib/userHandler');
const tokenHandler = require('./lib/tokenHandler');
const errorHandler = require ('./lib/error');
const loginHandler = require('./lib/loginHandler');

module.exports = (config) => {


  const db = require ('./lib/dbSetup')(config.database);

//, 'timeline'
//,
  config.routes.push(
    {
      routes:['user', 'login'],
      rootDirectory:__dirname + '/graphql/'
    }
  );

  if (config.authentication.local){
    //TODO load local login
  }

  require('./lib/dbLoader')(config.routes, db);
  const schema = require ('./lib/rootSchemaBuilder')(config.routes);
  let app = express();

  app.use(logger('dev'));

  app.use ((req, res, next) => {
    req.db = db;
    req.errorHandler = errorHandler;
    req.user = userHandler();
    req.tokenHandler = tokenHandler(db, config.authentication.local || {});
    req.loginHandler = loginHandler(db, errorHandler);
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
}
