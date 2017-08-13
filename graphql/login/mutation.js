module.exports = (graphql) => {

  const GraphQLObjectType = graphql.GraphQLObjectType;
  const GraphQLInt = graphql.GraphQLInt;
  const GraphQLBoolean = graphql.GraphQLBoolean;
  const GraphQLString = graphql.GraphQLString;
  const GraphQLList = graphql.GraphQLList;
  const GraphQLNonNull = graphql.GraphQLNonNull;

  const LoginType = graphql.schema.login;
  return {
    registerLogin:{
      type: new GraphQLList(LoginType),
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
}
