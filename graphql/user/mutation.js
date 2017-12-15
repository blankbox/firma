const _ = require ('underscore');

module.exports = (graphql, db, errorHandler, permissionsHandler, config) => {

  const PublicError = errorHandler.PublicError;
  const PrivateError = errorHandler.PrivateError;
  const checkPermissions = permissionsHandler.checkPermissions;
  const resolvers = config.search.resolvers;

  const GraphQLBoolean = graphql.GraphQLBoolean;
  const GraphQLString = graphql.GraphQLString;
  const GraphQLList = graphql.GraphQLList;
  const GraphQLNonNull = graphql.GraphQLNonNull;


  const checkUserName = (root, args, cb) => {
    db.cassandra.instance.UserProfile.findOne(
      {user_name:args.user_name},
      {materialized_view:'user_by_user_name'}, (err, user) => {
      if (err) {
        cb(new errorHandler.PrivateError('CassandraError', 'error select from user by user_name', 500));
      } else {
        cb(null, user);
      }
    });
  };

  const UserType = graphql.schema.user;

  return {
    createUser:{
      type: new GraphQLList(UserType),
      description: 'Add a user',
      args: {
        email: {
          name: 'Email',
          type: new GraphQLNonNull(GraphQLString),
        },
        user_name: {
          name: 'User name',
          type: new GraphQLNonNull(GraphQLString),
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

        return new Promise ((resolve, reject) => {
          let err = root.user.mustBeLoggedIn(true);
          if (err) {
            return reject (new PublicError (err.name, err.message, err.status));
          }
          root.user.getPermissionsAndUser(() => {
            let err = root.user.mustBeUser(false);
            if (err) {
              return reject (new PublicError (err.name, err.message, err.status));
            }

            const permissions = root.user.permissions[info.fieldName];
            let possible = [String(root.user.loginUid), 'ALL'];

            if (!checkPermissions(permissions, possible)) {
              return reject( new PublicError('LoginError', 'You cannot create a user', 403));
            }

            checkUserName (root, args, (err, user) => {
              if (err || user) {
                return reject(err || new PublicError('UserError', 'Email address in use', 403));
              } else {
                let userUid = db.cassandra.uuid();

                let login = {};

                login[root.user.loginUid] = root.user.audience;

                let user = new db.cassandra.instance.UserProfile({
                  first_name:args.first_name,
                  last_name:args.last_name,
                  email:args.email,
                  user_name: args.user_name,
                  user_uid: userUid,
                  login_uid: login,
                  client_data: {}
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
                ];

                db.cassandra.doBatch(batch, (err) => {
                  if (err) {
                    return reject( new PrivateError('CassandraError', err, 500));
                  } else {

                    root.loginHandler.clearLoginFromCache(root.user.audience, root.user.loginUid);

                    resolve([user]);

                    let resolver = _.find(resolvers, (s) => {
                      return s.schema == 'user';
                    });

                    resolver.addMembers(db, [userUid]);
                  }
                });
              }
            });
          });
        });
      }
    },

    updateUser:{
      type: new GraphQLList(UserType),
      description: 'Update user',
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
        },
        private: {
          type: GraphQLBoolean,
        }
      },
      resolve: (root, args, discard, info) => {

        return new Promise ((resolve, reject) => {
          root.user.getPermissionsAndUser(() => {

            root.user.mustBeLoggedIn(true, reject);
            root.user.mustBeUser(true, reject);

            //SELF or Admin can update email/firsl/last_name
            //Admin only can update blocked
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
              let allowed = ['email', 'first_name', 'last_name', 'private'];
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
              {user_uid: db.cassandra.uuidFromString(uid)},
              update,
              {return_query: true}
            );

            db.cassandra.doBatch(
              [updateUser],
              (err) => {
                if (err) {
                 return reject( new PrivateError('CassandraError', 'error update user', 500));
                } else {
                  db.cassandra.instance.UserProfile.findOne({user_uid:db.cassandra.uuidFromString(uid)}, (err, user) => {
                    if (err || !user) {
                     return reject( new PrivateError('CassandraError', 'error reading user', 500));
                    } else {
                      let resolver = _.find(resolvers, (s) => {
                        return s.schema == 'user';
                      });

                      resolve([user]);
                      resolver.addMembers(db, [args.user_uid]);
                    }
                  });
                }
             });
          });
        });
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

        return new Promise ((resolve, reject) => {
          root.user.getPermissionsAndUser(() => {

            const permissions = root.user.permissions[info.fieldName];
            let possible = [String(args.user_uid), 'ALL'];
            let perms = checkPermissions(permissions, possible);

            if (!perms) {
              return reject( new PublicError('UserError', '', 403));
            }

            db.cassandra.instance.UserProfile.update(
              {user_uid: db.cassandra.uuidFromString(args.user_uid)},
              {deleted: true},
              (err) => {
              if (err) {
                reject(new PrivateError('CassandraError', err, 500));
              } else {
                db.cassandra.instance.UserProfile.findOne({user_uid: db.cassandra.uuidFromString(args.user_uid)}, (err, user) => {
                  if (err || !user) {
                   return reject( new PrivateError('CassandraError', 'error reading user', 500));
                  } else {
                    resolve([user]);
                  }
                });
              }
            });
          });
        });
      }
    }
  };
};
