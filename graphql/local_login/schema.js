const graphql = require('graphql');

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;

const LocalLoginType = new GraphQLObjectType({
  name: 'login',
  fields: () => ({
    login_uid: {
      type: GraphQLString,
      description: 'Login UUID'
    },
    username: {
      type: GraphQLString,
      description: 'User name'
    },
    password: {
      type: GraphQLString,
      description: 'Password'
    },
    new_password: {
      type: GraphQLString,
      description: 'new password - used for password change'
    },
    blocked: {
      type: GraphQLBoolean,
      description: 'Flag to mark if the user is blocked'
    },
    user_token: {
      type: GraphQLString,
      description: 'JWT'
    },
    user_uid: {
      type: GraphQLString,
      description: 'Login UUID'
    },
  })
});

module.exports = LocalLoginType;
