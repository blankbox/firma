const graphql = require('graphql');
const GraphQLObjectType = graphql.GraphQLObjectType;
const test = require('./test/query');
const user = require('./user/query');

const rootFields = Object.assign({},
  test,
  user
);

module.exports = new GraphQLObjectType({
  name: 'RootQuery',
  fields: () => rootFields
});
