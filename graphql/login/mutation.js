module.exports = (graphql, db, errorHandler, permissionsHandler) => {
  const checkPermissions = permissionsHandler.checkPermissions;
  const PubErr = errorHandler.PublicError;

  const GraphQLList = graphql.GraphQLList;

  const LoginType = graphql.schema.login;
  return {
    registerLogin:{
      type: new GraphQLList(LoginType),
      description: 'Add a login',
      resolve: (root, args, ast , info) => {


        return new Promise ((resolve, reject) => {

          root.user.getPermissionsAndUser(() => {

            root.user.mustBeLoggedIn(true, reject);

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
        });
      }
    }
  };
};
