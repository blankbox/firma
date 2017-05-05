require('dotenv-safe').load();

var express = require('express');
var logger = require('morgan');
var {graphql} = require('graphql')
var bodyParser = require('body-parser');


var schema = require ('./graphql/testSchema');

var app = express();

app.use(logger('dev'));

app.use(bodyParser.raw(
  { type: 'application/graphql' }
));

app.use(function (req, res, next) {
  req.graphql = {};
  req.graphql.query = req.body.toString('utf8');
  next();
})

app.post('/graphql', function (req, res, next){
  graphql(schema, req.graphql.query).then(function(result){
    req.graphql.result = result;
    next();
  });
});


app.use( function (req, res, next) {
  res.send(req.graphql.result);
})

app.listen(process.env.PORT);
console.log('Running a GraphQL API server at localhost:' + process.env.PORT+ '/graphql');
