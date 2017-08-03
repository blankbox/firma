
const graphql = require('graphql');

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLSchema = graphql.GraphQLSchema;

module.exports = (modelRoute, routes) => {

  let queryObject  = {};
  let mutationObject = {};

//TODO add error handling for routes that are query only (i.e. can't add mutation)
  for (let r of routes) {
    Object.assign(queryObject, require(modelRoute + r + '/query'));
    Object.assign(mutationObject, require(modelRoute + r + '/mutation'));
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
