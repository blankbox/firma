const graphql = require('graphql');

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;

const UserType = require ('./schema');

let users = require ('./store');
module.exports = {
  user: {
    type: new GraphQLList(UserType),
    description:'Get user data',
    args:{
      user_uid: {
        type: GraphQLInt,
        description: 'User UUID'
      }
    },
    resolve: (root, args) => {
      root.user.mustBeVerified(true);
      if (!isNaN(args.user_uid)) {
        return [users[args.user_uid]]
      } else {
        return users;
      }
    }
  }
};
