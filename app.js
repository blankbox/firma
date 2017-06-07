require('dotenv-safe').load();

const express = require('express');
const logger = require('morgan');
const {graphql} = require('graphql')
const bodyParser = require('body-parser');
const schema = require ('./graphql/rootSchema');
const autho = require ('./helpers/jwt');
const userStore = require ('./graphql/user/store');
const errorHandler = require ('./helpers/error')
let app = express();

app.use(logger('dev'));

let authConfig = {
  jwtSecret:'boo',
  userStore: userStore,
  error: errorHandler,
  //TODO move blacklist handlers to more sensible place
  userBlacklist: () => {
    return {
      addTokens: (tokens) => {
        //add an array of tokens to black list
        // tokens = []
      },
      checkToken: (token) => {
        //return true if blacklisted
        return false;
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
