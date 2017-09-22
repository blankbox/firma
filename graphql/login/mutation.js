module.exports = (graphql, db, errorHandler, permissionsHandler, config) => {

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

          config.debug.log(root.user);
          root.user.mustBeLoggedIn(true);

          const permissions = root.user.permissions[info.fieldName];
          let possible = [String(root.user.loginUid), 'ALL'];

          if (!checkPermissions(permissions, possible)) {
            return reject( new PubErr('LoginError', 'This login cannot be registered, or is already registered.', 403));
          }

          root.loginHandler.registerLogin(root.user.audience, root.user.loginUid, (err, login) => {
            if (err) {
              return reject(err);
            }
            resolve([login]);
          });
        });
      }
    }

  };
};
