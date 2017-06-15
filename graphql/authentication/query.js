const graphql = require('graphql');

// const GraphQLObjectType = graphql.GraphQLObjectType;
// const GraphQLInt = graphql.GraphQLInt;
// const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;

const AuthType = require ('./schema').auth;
// let tokens = require ('./store');

module.exports = {
  login: {
    type: new GraphQLList(AuthType),
    description:'Return a JWT for the user',
    args:{
      email: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'Email'
      },
      password: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'Password'
      }
    },
    resolve: (root, args) => {
      root.user.mustBeVerified(false);
      args.password;
      args.email

      let user = userStore.checkPassowrd(args.email, args.password);
      if (user) {
        user.buildJWT();
      }
      //Look up email - do we have this user?
      //Compare pw hashes
      //IF OK build jwt
      //if not throw error
      return {user_token:'fake-jwt'};
    }
  },
  logout: {
    type: new GraphQLList(AuthType),
    description:'Invalidate JWT',
    args:{},
    resolve: (root) => {
      root.user.mustBeVerified(true);
      //add token to blacklist

      return ;
    }
  }
};
