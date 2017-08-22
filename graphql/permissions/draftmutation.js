const graphql = require('graphql');
const async = require('async');

const Uuid = require('cassandra-driver').types.Uuid;

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;
const jwt = require('jsonwebtoken');


const PermissionsType = require ('./schema');

module.exports = {
  updatePermissions:{
    type: new GraphQLList(PermissionsType),
    description: 'Add a login',
    resolve: (root) => {
      return new Promise ((resolve, reject) => {
        root.loginHandler.registerLogin(root.user.audience, root.user.loginUid, (err, login) => {
          if (err) {
            reject(err)
          }
          resolve([login])
        });
      });
    }
  }

}
