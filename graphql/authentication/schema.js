const graphql = require('graphql');

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;

const AuthType = new GraphQLObjectType({
  name: 'user',
  fields: () => ({
    email: {
      type: GraphQLString,
      description: 'Email'
    },
    password: {
      type: GraphQLString,
      description: 'Password'
    }
  })
});

const UserType = new GraphQLObjectType({
  name: 'user',
  fields: () => ({
    user_uid: {
      type: GraphQLInt,
      description: 'User UUID'
    },
    email: {
      type: GraphQLString,
      description: 'Email'
    },
    password: {
      type: GraphQLString,
      description: 'Password'
    },
    first_name: {
      type: GraphQLString,
      description: 'First name'
    },
    last_name: {
      type: GraphQLString,
      description: 'Last name'
    },
    blocked: {
      type: GraphQLBoolean,
      description: 'Flag to mark if the user is blocked'
    }
  })
});

module.exports = {auth:AuthType, user: UserType};
