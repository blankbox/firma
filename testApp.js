const express = require('express');
const graphqlHTTP = require('express-graphql');
const schema = require ('./graphql/rootSchema');

const app = express();

app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true
}));

app.listen(4000);
