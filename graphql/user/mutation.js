const async = require('async');

const Uuid = require('cassandra-driver').types.Uuid;


const lib = require('./mutation/lib');
const checkPassword = lib.checkPassword;
const hashPassword = lib.hashPassword;
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
      resolve: (root, args) => {
        const db = root.db;
        const PublicError = root.errorHandler.PublicError;
        const PrivateError = root.errorHandler.PrivateError;
        return new Promise ((resolve, reject) => {
          root.user.mustBeLoggedIn(true);
          root.user.mustBeUser(false);
          checkEmail (root, args, (err, user) => {
            if (err || user) {
              reject(err || new PublicError('UserError', 'Email address in use', 403));
            } else {
              let user = new db.cassandra.instance.UserProfile({
                first_name:args.first_name,
                last_name:args.last_name,
                email:args.email,
                user_uid: Uuid.random()
              });

              user.save((err) => {
                if (err) {
                  reject( new PrivateError('CassandraError', 'error saving user', 500));
                } else {
                  resolve([user]);
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
        }
      },
      resolve: (root, args) => {
        const db = root.db;
        const PublicError = root.errorHandler.PublicError;
        const PrivateError = root.errorHandler.PrivateError;
        root.user.mustBeVerified(true);
        return new Promise ((resolve, reject) => {
          //SELF or Admin can update email/firsl/last_name
          //Admin only can update blocked


          let uid;

          if (!args.user_uid || args.user_uid == root.user.payload.u) {
            uid = root.user.payload.u;
          } else {
            uid = args.user_uid;
          }

          db.cassandra.instance.User.findOne(
            {user_uid: Uuid.fromString(uid)},
            (err, user) => {
            if (err) {
              reject(new PrivateError('CassandraError', err, 500));
            } else {
              if (!user) {
                reject(new PublicError('UserError', 'User not found', 403));
              } else {
                async.series([
                  (cb) => {
                    //TODO 'blocked should also black list users tokens'
                    const updateFields = ['first_name', 'last_name', 'blocked'];
                    for (let k of updateFields) {
                      if (typeof(args[k]) != 'undefined') {
                        user[k] = args[k];
                      }
                    }
                    cb(null, user)
                  },
                  (cb) => {
                    if (args.email) {
                      checkEmail (root, args, (err, email_user) => {
                        if (err || email_user) {
                          cb(err || new PublicError('UserError', 'Email address in use', 403));
                        } else {
                          user.email = args.email;
                          cb(null, user);
                        }
                      })
                    } else {
                      cb(null, user)
                    }
                  },
                  (cb) => {
                    if (args.new_password) {
                      checkPassword(root, args, user, (err) => {
                        if (err) {
                          cb(err, user);
                        } else {
                          args.password = args.new_password;
                          hashPassword(root, args, user, (err, user) => {
                            cb(err, user);
                          })
                        }

                      })
                    } else {
                      cb(null, user)
                    }
                  }
                ], (err, user) => {
                  if (err) {
                    reject(err)
                  } else {
                    user = user[0];
                    user.save((err) => {
                      if (err) {
                        reject( new PrivateError('CassandraError', 'error saving user', 500));
                      } else {
                        resolve([user]);
                      }
                    });
                  }
                });
              }
            }
          });
        })
      }
    },
    deleteUser:{
      type: new GraphQLList(UserType),
      description: 'Delete a user',
      args: {
        user_uid: {
          name: 'Uid',
          type: new GraphQLNonNull(GraphQLString)
        }
      },
      resolve: (root, args) => {
        const db = root.db;
        const PublicError = root.errorHandler.PublicError;
        const PrivateError = root.errorHandler.PrivateError;

        return new Promise ((resolve, reject) => {
          root.user.mustBeUser(true);
          if (args.user_uid == root.user.userUid) {
            reject( new PublicError('DeleteUserError', 'You cannot delete yourself', 403))
          }
          db.cassandra.instance.User.delete(
            {user_uid: Uuid.fromString(args.user_uid)}, (err) => {
            if (err) {
              reject(new PrivateError('CassandraError', err, 500));
            }
            resolve([])
          });
        });
      }
    }
  }
}
