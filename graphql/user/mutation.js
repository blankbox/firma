const _ = require ('underscore');

const Uuid = require('cassandra-driver').types.Uuid;


const lib = require('./mutation/lib');
const checkEmail = lib.checkEmail;


module.exports = (graphql) => {

  const GraphQLObjectType = graphql.GraphQLObjectType;
  const GraphQLInt = graphql.GraphQLInt;
  const GraphQLBoolean = graphql.GraphQLBoolean;
  const GraphQLString = graphql.GraphQLString;
  const GraphQLList = graphql.GraphQLList;
  const GraphQLNonNull = graphql.GraphQLNonNull;

  const UserType = graphql.schema.user//require ('./schema')(graphql);

  return {
    createUser:{
      type: new GraphQLList(UserType),
      description: 'Add a user',
      args: {
        email: {
          name: 'Email',
          type: new GraphQLNonNull(GraphQLString)
        },
        first_name: {
          name: 'First name',
          type: GraphQLString
        },
        last_name: {
          name: 'Last name',
          type: GraphQLString
        }
      },
      resolve: (root, args, ast, info) => {
        const db = root.db;
        const PublicError = root.errorHandler.PublicError;
        const PrivateError = root.errorHandler.PrivateError;
        const checkPermissions = root.permissionsHandler.checkPermissions;

        return new Promise ((resolve, reject) => {
          root.user.mustBeLoggedIn(true);
          root.user.mustBeUser(false);

          const permissions = root.user.permissions[info.fieldName];
          let possible = [String(root.user.loginUid), 'ALL'];

          if (!checkPermissions(permissions, possible)) {
            return reject( new PublicError('LoginError', '', 403));
          }

          checkEmail (root, args, (err, user) => {
            if (err || user) {
              return reject(err || new PublicError('UserError', 'Email address in use', 403));
            } else {
              let userUid = Uuid.random();

              let user = new db.cassandra.instance.UserProfile({
                first_name:args.first_name,
                last_name:args.last_name,
                email:args.email,
                user_uid: userUid,
                login_uid: [root.user.loginUid]
              });

              let updateLogin = db.cassandra.instance.Login.update(
                {audience:root.user.audience, login_uid:root.user.loginUid},
                {user_uid:userUid},
                {return_query: true}
              );

              let updateUserPermissions = db.cassandra.instance.Permissions.update(
                {
                  login_uid: root.user.loginUid,
                  audience: root.user.audience,
                  entity_uid: String(userUid)
                },
                {
                  roles:{
                    '$add': ['this_user']
                  }
                },
                {return_query: true}
              );

              let updateAllPermissions = db.cassandra.instance.Permissions.update(
                {
                  login_uid: root.user.loginUid,
                  audience: root.user.audience,
                  entity_uid: 'ALL'
                },
                {
                  roles:{
                    '$add': ['loggedInUser']
                  }
                },
                {return_query: true}
              );

              let removeLoginPermissions = db.cassandra.instance.Permissions.update(
                {
                  login_uid: root.user.loginUid,
                  audience: root.user.audience,
                  entity_uid: String(root.user.loginUid)
                },
                {
                  roles:{
                    '$remove': ['newLogin']
                  }
                },
                {return_query: true}
              );

              let addLoginPermissions = db.cassandra.instance.Permissions.update(
                {
                  login_uid: root.user.loginUid,
                  audience: root.user.audience,
                  entity_uid: String(root.user.loginUid)
                },
                {
                  roles:{
                    '$add': ['this_user']
                  }
                },
                {return_query: true}
              );

              let batch = [
                user.save(
                  {return_query: true}
                ),
                updateLogin,
                updateUserPermissions,
                addLoginPermissions,
                removeLoginPermissions,
                updateAllPermissions
              ]
              db.cassandra.doBatch(batch, (err) => {
                if (err) {
                  return reject( new PrivateError('CassandraError', 'error saving user', 500));
                } else {
                  resolve([user]);
                  root.loginHandler.clearLoginFromCache(root.user.audience, root.user.loginUid);
                }
              });
            }
          });
        });
      }
    },

    updateUser:{
      type: new GraphQLList(UserType),
      description: 'Login',
      args: {
        email: {
          name: 'Email',
          type: GraphQLString
        },
        first_name: {
          name: 'First Name',
          type: GraphQLString
        },
        last_name: {
          name: 'Last Name',
          type: GraphQLString
        },
        blocked: {
          type: GraphQLBoolean,
          description: 'Flag to mark if the user is blocked'
        },
        private: {
          type: GraphQLBoolean,
          description: 'Flag to mark if the user is blocked'
        }
      },
      resolve: (root, args, discard, info) => {
        const db = root.db;
        const PublicError = root.errorHandler.PublicError;
        const PrivateError = root.errorHandler.PrivateError;
        const checkPermissions = root.permissionsHandler.checkPermissions;

        return new Promise ((resolve, reject) => {
          root.user.mustBeLoggedIn(true);
          root.user.mustBeUser(true);

          //SELF or Admin can update email/firsl/last_name
          //Admin only can update blocked
          // console.log(root);
          const permissions = root.user.permissions[info.fieldName];
          let uid;
          let self;

          if (!args.user_uid || args.user_uid == root.user.userUid) {
            uid = root.user.userUid;
            self = true;
          } else {
            uid = args.user_uid;
          }

          let possible = [String(uid), 'ALL'];
          let perms = checkPermissions(permissions, possible);

          if (!perms) {
            return reject( new PublicError('UserError', '', 403));
          }

          if (self) {
            let allowed = ['email', 'first_name', 'last_name', 'private']
            if (_.difference(Object.keys(args), allowed).length > 0){
              return reject( new PublicError('UserError', '', 403));
            }
          }

          let update = {};

          const updateFields = ['first_name', 'last_name', 'blocked', 'email', 'private'];
          for (let k of updateFields) {
            if (typeof(args[k]) != 'undefined') {
              update[k] = args[k];
            }
          }

          let updateUser = db.cassandra.instance.UserProfile.update(
            {user_uid: Uuid.fromString(uid)},
            update,
            {return_query: true}
          )

          db.cassandra.doBatch(
            [updateUser],
            (err) => {
              if (err) {
               return reject( new PrivateError('CassandraError', 'error update user', 500));
              } else {
                db.cassandra.instance.UserProfile.findOne({user_uid: Uuid.fromString(uid)}, (err, user) => {
                  if (err || !user) {
                   return reject( new PrivateError('CassandraError', 'error reading user', 500));
                  } else {
                    resolve([user]);
                  }
                });
              }
           });
        })
      }
    },

    deleteUser:{
      //TODO update to remove (archive?) permissions from login
      //Should make user *difficult* to recover 
      type: new GraphQLList(UserType),
      description: 'Delete a user',
      args: {
        user_uid: {
          name: 'Uid',
          type: new GraphQLNonNull(GraphQLString)
        }
      },
      resolve: (root, args, ast, info) => {
        const db = root.db;
        const PublicError = root.errorHandler.PublicError;
        const PrivateError = root.errorHandler.PrivateError;
        const checkPermissions = root.permissionsHandler.checkPermissions;

        return new Promise ((resolve, reject) => {

          const permissions = root.user.permissions[info.fieldName];
          let possible = [String(args.user_uid), 'ALL'];
          let perms = checkPermissions(permissions, possible);

          if (!perms) {
            return reject( new PublicError('UserError', '', 403));
          }

          db.cassandra.instance.UserProfile.update(
            {user_uid: Uuid.fromString(args.user_uid)},
            {deleted: true},
            (err) => {
            if (err) {
              reject(new PrivateError('CassandraError', err, 500));
            } else {
              db.cassandra.instance.UserProfile.findOne({user_uid: Uuid.fromString(args.user_uid)}, (err, user) => {
                if (err || !user) {
                 return reject( new PrivateError('CassandraError', 'error reading user', 500));
                } else {
                  resolve([user]);
                }
              });
            }
          });
        });
      }
    }
  }
}
