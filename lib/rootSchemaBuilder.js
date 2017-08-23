const graphql = require('graphql');
const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLSchema = graphql.GraphQLSchema;
const fs = require('fs');

module.exports = (config) => {
  graphql.schema = {};
  graphql.GraphQLJSON = require('graphql-type-json');

  let queryObject  = {};
  let mutationObject = {};

  for (let dir of config) {
    for (let r of dir.routes) {
      let file = dir.rootDirectory + r;
      if (fs.existsSync(file + '/schema.js')) {
        let schema = require(file + '/schema')(graphql)
        for (let s of schema) {
          graphql.schema[s.name] = s;        
        }
      }
      if (fs.existsSync(file + '/query.js')) {
        Object.assign(queryObject, require(file + '/query')(graphql));
      }
      if (fs.existsSync(file + '/mutation.js')) {
        Object.assign(mutationObject, require(file + '/mutation')(graphql));
      }
    }
  }

  const query = new GraphQLObjectType({
    name: 'Query',
    fields: () => queryObject
  });

  const mutation =  new GraphQLObjectType({
    name: 'Mutation',
    fields: () => mutationObject
  });

  return new GraphQLSchema({query, mutation});
}
