var yn = require('yn');
require('dotenv-safe').load();
var useGraphiql = yn(process.env.GRAPHIQL)

var express = require('express');
var logger = require('morgan');
var graphqlHTTP = require('express-graphql');
var app = express();

var schema = require ('./graphql/testSchema');

app.use(logger('dev'));

app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: useGraphiql
}));

app.listen(process.env.PORT);
console.log('Running a GraphQL API server at localhost:' + process.env.PORT+ '/graphql');
