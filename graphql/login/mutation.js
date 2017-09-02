module.exports = (graphql) => {

  const GraphQLList = graphql.GraphQLList;

  const LoginType = graphql.schema.login;
  return {
    registerLogin:{
      type: new GraphQLList(LoginType),
      description: 'Add a login',
      resolve: (root, args, ast , info) => {
        const checkPermissions = root.permissionsHandler.checkPermissions;
        const PubErr = root.errorHandler.PublicError;

        return new Promise ((resolve, reject) => {

          root.user.mustBeLoggedIn(true);

          const permissions = root.user.permissions[info.fieldName];
          let possible = [String(root.user.loginUid), 'ALL'];
          if (!checkPermissions(permissions, possible)) {
            return reject( new PubErr('LoginError', 'Foo', 403));
          }

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
