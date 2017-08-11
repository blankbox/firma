const graphql = require('graphql');
const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLSchema = graphql.GraphQLSchema;
const fs = require('fs');

module.exports = (config) => {

  let routes = buildFQRouteArray(config);

  let queryObject  = {};
  let mutationObject = {};

  for (let r of routes.q) {
    Object.assign(queryObject, require(r + '/query'));
  }

  for (let r of routes.m) {
    Object.assign(mutationObject, require(r + '/mutation'));
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


const buildFQRouteArray = (config) => {
  let queryArray = [];
  let mutationArray = [];

  for (let dir of config) {
    for (let r of dir.routes) {
      let file = dir.rootDirectory + r;
      if (fs.existsSync(file + '/query.js')) {
        queryArray.push(file);
      }
      if (fs.existsSync(file + '/mutation.js')) {
        mutationArray.push(file);
      }
    }
  }

  return {
    q:queryArray,
    m:mutationArray
  };
}
