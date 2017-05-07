require('dotenv-safe').load();

var express = require('express');
var logger = require('morgan');
var {graphql} = require('graphql')
var bodyParser = require('body-parser');

var schema = require ('./graphql/testSchema');

var app = express();

app.use(logger('dev'));

// Get the body for the application/graphql mime-tyepe
app.use(bodyParser.text(
  { type: 'application/graphql' }
));

app.post('/graphql', function (req, res, next){
  graphql(schema, req.body).then(function(result){
    req.result = result;
    res.send(req.result);
  });
});

// TODO:Basic error handling - needs work
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// TODO:Basic error handling - needs work
app.use(function(err, req, res, next) {
  // send the  page
  res.status(err.status || 500);
  res.send(err.message || 'err');
});

app.listen(process.env.PORT);
console.log('Running a GraphQL API server at localhost:' + process.env.PORT+ '/graphql');
