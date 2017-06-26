require('dotenv-safe').load();

const express = require('express');
const logger = require('morgan');
const {graphql} = require('graphql')
const bodyParser = require('body-parser');
const autho = require ('./helpers/jwt');
const errorHandler = require ('./helpers/error');

const dbConf = {
  cassPoints: [process.env.CASSPOINTS],
  cassUser: process.env.CASSUSER,
  cassPass:process.env.CASSPASS,
  cassPort:process.env.CASSPORT,
  cassKeyspace:'firma',
  redisHost:process.env.REDISPOINTS,
  redisPort:process.env.REDISPORT,
  redisPass:process.env.REDISPASS
};

const db = require ('./helpers/dbSetup')(dbConf);

const routes = ['user'];

const loadModels = (routes, db) => {
  for (let r of routes) {
    require('./graphql/' + r + '/model')(db.cassandra);
  }
}

loadModels(routes, db);

const schema = require ('./graphql/rootSchema')(routes);

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
        db.redis.exists(token, (err, res) => {
          return res;
        });

      }
    }
  }
};

const authoConf = autho(authConfig);

let app = express();

app.use(logger('dev'));

app.use ((req, res, next) => {
  req.db = db;
  req.errorHandler = errorHandler;
  //TODO check DBs are connected - if not connect
  next();
})

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
