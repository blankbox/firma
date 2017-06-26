const express = require('express');
const graphqlHTTP = require('express-graphql');



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
const schema = require ('./graphql/rootSchema')([], db);

const app = express();

app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true
}));

app.listen(4000);
