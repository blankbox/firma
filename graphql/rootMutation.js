const graphql = require('graphql');
const GraphQLObjectType = graphql.GraphQLObjectType;
const test = require('./test/mutation');
const userMutation = require('./user/mutation');

const rootFields = Object.assign({},
  test,
  userMutation
);

module.exports =  new GraphQLObjectType({
  name: 'RootMutation',
  fields: () => rootFields
});
