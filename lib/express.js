

const express = require('express');
const logger = require('morgan');

const bodyParser = require('body-parser');

const jwt = require ('./jwt');
const userHandler = require('./userHandler');


module.exports = ({
  config,
  db,
  LoginHandler,
  errorHandler,
  permissionsHandler,
  graphqlHandler
}) => {

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

  return app;
};
