require('dotenv-safe').load();

const express = require('express');
const logger = require('morgan');
const {graphql} = require('graphql')
const bodyParser = require('body-parser');
const autho = require ('./helpers/jwt');
const errorHandler = require ('./helpers/error');

const dbConf = {
  cassPoints: ['172.17.0.2'],
  cassUser: 'cassandra',
  cassPass:'cassandra',
  cassPort:9042,
  cassKeyspace:'firma',
  redisHost:'172.17.0.3',
  redisPort:6379,
  redisPass:'thisIsAReallySillyPassword'
};

const db = require ('./helpers/dbSetup')(dbConf);

const routes = ['user'];

let app = express();
const schema = require ('./graphql/rootSchema')(routes, db, errorHandler);

app.use(logger('dev'));

let authConfig = {
  jwtSecret:'boo',
  error: errorHandler,
  cassandra: db.cassandra,
  //TODO move blacklist handlers to more sensible place
  userBlacklist: () => {
    return {
      addTokens: (tokens) => {
        for (let token of tokens) {
          //TODO set EX on JWT expire
          db.redis.set(token, null, 'EX', 20);

        }
      },
      containsToken: (token) => {
        if (db.redis.exists(token)){
          return true;
        } else {
          return false;
        }
      }
    }
  }
};

const authoConf = autho(authConfig);

app.use(authoConf);

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

// TODO:Basic http error handling - needs work
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.listen(process.env.PORT);
console.log('Running a GraphQL API server at localhost:' + process.env.PORT+ '/graphql');
