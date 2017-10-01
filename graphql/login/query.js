
module.exports = (graphql, db, errorHandler) => {
  const PubErr = errorHandler.PublicError;
  const PriErr = errorHandler.PrivateError;
  const GraphQLString = graphql.GraphQLString;
  const GraphQLList = graphql.GraphQLList;

  const LoginType = graphql.schema.login;
  return {
    queryUserLogins: {
      type: new GraphQLList(LoginType),
      description:'Get users logins',
      args:{
        user_uid: {
          type: GraphQLString,
        }
      },
      resolve: (root, args) => {

        return new Promise ((resolve, reject) =>{
          root.user.getPermissionsAndUser(() => {

            root.user.mustBeUser(true);
            let userid;
            if (args.user_uid) {
              if (!root.user.loginPermissions.includes('UserAdmin') && args.user_uid != root.userHandler.userUid){
                reject(new PubErr('User error', 'You can\'t manage other users that', 403));
              }
              userid = args.user_uid;
            } else {
              userid = root.userHandler.userUid;
            }
            root.loginHandler.getLoginByUser(userid, (err, logins) => {
              if (err) {
                reject( new PriErr('CassandraError', 'error getting  logins by user', 500));
              }
              let outArray = [];
              for (let l of logins){
                outArray.push({
                  login_uid: l.login_uid,
                  blocked:l.blocked,
                  user_uid:l.user_uid,
                  permissions:l.permissions
                });
              }
              resolve(outArray);
            });
          });
        });
      }
    }
  };
};
