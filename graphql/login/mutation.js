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
      resolve: (root, args, ast , info) => {
        const PubErr = root.errorHandler.PublicError;
        return new Promise ((resolve, reject) => {
          if (root.user.login) {
            return reject( new PubErr('LoginError', 'login already exsists', 400));
          }
          root.loginHandler.registerLogin(root.user.audience, root.user.loginUid, (err, login) => {
            if (err) {
              return reject(err)
            }
            resolve([login])
          });
        });
      }
    }

  }
}
