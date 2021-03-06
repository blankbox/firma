const Uuid = require('cassandra-driver').types.Uuid;

module.exports = (graphql, db, errorHandler, permissionsHandler) => {

  const PublicError = errorHandler.PublicError;
  const PrivateError = errorHandler.PrivateError;
  const checkPermissions = permissionsHandler.checkPermissions;

  const GraphQLString = graphql.GraphQLString;
  const GraphQLList = graphql.GraphQLList;
  const GraphQLNonNull = graphql.GraphQLNonNull;

  const UserType = graphql.schema.user;

  const dbQuery = require('../../lib/dbQuery')({ db });
  return {
    queryUserByEmail: {
      type: new GraphQLList(UserType),
      description:'Get user data',
      args:{
        email: {
          type: new GraphQLNonNull(GraphQLString),
        }
      },
      resolve: (root, args) => {

        return new Promise ((resolve, reject) => {
          root.user.getPermissionsAndUser(() => {

            const permissions = root.user.permissions['findUser'];
            let possible = ['ALL', String(root.user.user_uid)];

            let perms = checkPermissions(permissions, possible);

            if (!perms) {
              return reject (new PublicError('Error', 'You can\'t search for users', 403));
            }
            dbQuery.findOne(
              'UserProfile',
              {email:args.email},
              {materialized_view: 'user_by_email'},
              (err, user) => {
              if (err) {
                reject( new PrivateError('CassandraError', String(err), 500));
              } else {
                const priPerms = root.user.permissions['findHiddenUser'];
                if (
                  (user && (user.private || user.blocked || user.deleted)) && //User is hidden
                  (!checkPermissions(priPerms, possible)) //Doesn't have permmsion to see this hidden
                )
                {
                  return resolve ([]);
                }
                return resolve([user]);
              }
            });
          });
        });
      }
    },
    queryUserByUid: {
      type: new GraphQLList(UserType),
      description:'Get user data',
      args:{
        user_uid: {
          type: GraphQLString,
        }
      },
      resolve: (root, args) => {

        return new Promise ((resolve, reject) =>{

          root.user.getPermissionsAndUser(() => {

            let err = root.user.mustBeUser(true);
            if (err) {
              return reject (new PublicError (err.name, err.message, err.status));
            }

            const permissions = root.user.permissions['findUser'];
            let possible = ['ALL', (args.user_uid || String(root.user.userUid))];
            let perms = checkPermissions(permissions, possible);

            if (!perms) {
              return reject (new PublicError('Error', 'You can\'t search for users', 403));
            }


            db.cassandra.instance.UserProfile.findOne(
              {user_uid:Uuid.fromString(args.user_uid || root.user.userUid)},
              (err, user) => {
              if (err) {
                reject( new PrivateError('CassandraError', String(err), 500));
              } else {
                const priPerms = root.user.permissions['findHiddenUser'];
                if (
                  (user && (user.private || user.blocked || user.deleted)) && //User is hidden
                  (!checkPermissions(priPerms, possible)) //Doesn't have permmsion to see this hidden              )
                )
                {
                  return resolve ([]);
                }
                return resolve([user]);
              }
            });
          });
        });
      }
    }
  };
};
