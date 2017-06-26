
const graphql = require('graphql');

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLSchema = graphql.GraphQLSchema;

module.exports = (routes) => {

  let queryObject  = {};
  let mutationObject = {};

  for (let r of routes) {
    Object.assign(queryObject, require('./' + r + '/query'));
    Object.assign(mutationObject, require('./' + r + '/mutation'));
  }

  const query = new GraphQLObjectType({
    name: 'RootQuery',
    fields: () => queryObject
  });

  const mutation =  new GraphQLObjectType({
    name: 'RootMutation',
    fields: () => mutationObject
  });

  return new GraphQLSchema({query, mutation});
}
