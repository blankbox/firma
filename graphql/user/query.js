const Uuid = require('cassandra-driver').types.Uuid;

module.exports = (graphql) => {

  const GraphQLObjectType = graphql.GraphQLObjectType;
  const GraphQLInt = graphql.GraphQLInt;
  const GraphQLBoolean = graphql.GraphQLBoolean;
  const GraphQLString = graphql.GraphQLString;
  const GraphQLList = graphql.GraphQLList;
  const GraphQLNonNull = graphql.GraphQLNonNull;

  const UserType = graphql.schema.user;

  return {
    queryUserByEmail: {
      type: new GraphQLList(UserType),
      description:'Get user data',
      args:{
        email: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'Email'
        }
      },
      resolve: (root, args, ast , info) => {
        const db = root.db;
        const PublicError = root.errorHandler.PublicError;
        const PrivateError = root.errorHandler.PrivateError;
        const checkPermissions = root.permissionsHandler.checkPermissions;

        return new Promise ((resolve, reject) =>{

          const permissions = root.user.permissions['findUser'];
          let possible = ['ALL', String(root.user.user_uid)];

          let perms = checkPermissions(permissions, possible);

          if (!perms) {
            return reject (new PublicError('Error', 'You can\'t search for users', 403))
          }

          db.cassandra.instance.UserProfile.findOne(
            {email:args.email},
            {materialized_view: 'user_by_email'},
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
      }
    },
    queryUserByUid: {
      type: new GraphQLList(UserType),
      description:'Get user data',
      args:{
        user_uid: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'User id'
        }
      },
      resolve: (root, args, ast , info) => {
        const db = root.db;
        const PublicError = root.errorHandler.PublicError;
        const PrivateError = root.errorHandler.PrivateError;
        const checkPermissions = root.permissionsHandler.checkPermissions;

        return new Promise ((resolve, reject) =>{

          const permissions = root.user.permissions['findUser'];
          let possible = ['ALL', String(root.user.userUid)];
          let perms = checkPermissions(permissions, possible);

          if (!perms) {
            return reject (new PublicError('Error', 'You can\'t search for users', 403))
          }

          db.cassandra.instance.UserProfile.findOne(
            {user_uid:Uuid.fromString(args.user_uid)},
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
      }
    }
  };
}
