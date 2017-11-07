const graphql = require('graphql');
const fs = require('fs');
const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLSchema = graphql.GraphQLSchema;
module.exports = (config, db, errorHandler, permissionsHandler) => {
  graphql.schema = {};
  graphql.GraphQLJSON = require('graphql-type-json');
  graphql.GraphQLDate = require('graphql-iso-date').GraphQLDate;
  graphql.GraphQLTime = require('graphql-iso-date').GraphQLTime;
  graphql.GraphQLDateTime = require('graphql-iso-date').GraphQLDateTime;
  graphql.GraphQLUuid = require('graphql-custom-types').GraphQLUUID;

  let queryObject  = {};
  let mutationObject = {};
  let subscriptionObject = {};

  for (let dir of config.routes) {
    for (let r of dir.routes) {
      let file = dir.rootDirectory + r;
      if (fs.existsSync(file + '/schema.js')) {
        let schema = require(file + '/schema')(graphql, config.search.resolvers);
        for (let s of schema) {
          graphql.schema[s.name] = s;
        }
      }
      if (fs.existsSync(file + '/query.js')) {
        Object.assign(queryObject, require(file + '/query')(graphql, db, errorHandler, permissionsHandler, config));
      }
      if (fs.existsSync(file + '/mutation.js')) {
        Object.assign(mutationObject, require(file + '/mutation')(graphql, db, errorHandler, permissionsHandler, config));
      }
      if (fs.existsSync(file + '/subscription.js')) {
        Object.assign(subscriptionObject, require(file + '/subscription')(graphql, db, errorHandler, permissionsHandler, config));
      }
    }
  }

  let schemaObject = {
    query:  new GraphQLObjectType({
      name: 'Query',
      fields: () => queryObject
    })
  };

  if (Object.keys(mutationObject).length > 0) {
    schemaObject.mutation =  new GraphQLObjectType({
      name: 'Mutation',
      fields: () => mutationObject
    });
  }

  if (Object.keys(subscriptionObject).length > 0) {
    schemaObject.subscription =  new GraphQLObjectType({
      name: 'Subscription',
      fields: () => subscriptionObject
    });
  }

  return new GraphQLSchema(schemaObject);
};
