const graphql = require('graphql');
const bcrypt = require('bcrypt');
const async = require('async');

const Uuid = require('cassandra-driver').types.Uuid;

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;
const jwt = require('jsonwebtoken');

const UserType = require ('./schema');

const checkPassword = (root, args, user, cb) => {
  bcrypt.compare(args.password, user.password_hash, (err, res) => {
    if (!res) {
      cb(new root.errorHandler.PublicError('UserError', 'User or password error', 403));
    } else {
      cb();
    }
  });
};

const hashPassword = (root, args, user, cb) => {
  bcrypt.genSalt(1, (err, salt) => {
    if (err) {
      cb( new root.errorHandler.PrivateError('BcryptError', 'error generating salt', 500));
    } else {
      bcrypt.hash(args.password, salt, (err, hash) => {

        if (err) {
          reject( new root.errorHandler.PrivateError('BcryptError', 'error hashing password', 500));
        } else {
          user.password_hash = hash;
          cb(null, user);
        }
      });
    }
  });
};

const checkEmail = (root, args, cb) => {
  root.db.cassandra.instance.User.findOne(
    {email:args.email},
    {materialized_view:'user_by_email'}, (err, user) => {
    if (err) {
      cb(new root.errorHandler.PrivateError('CassandraError', 'error select from user by email', 500));
    } else {
      cb(null, user);
    }
  });
}

module.exports = {
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
        },
        password: {
          name: 'Password',
          type: new GraphQLNonNull(GraphQLString)
        }
      },
      resolve: (root, args) => {
        const db = root.db;
        const PublicError = root.errorHandler.PublicError;
        const PrivateError = root.errorHandler.PrivateError;
        return new Promise ((resolve, reject) => {
          checkEmail (root, args, (err, user) => {
            if (err || user) {
              reject(err || new PublicError('UserError', 'Email address in use', 403));
            } else {
              let user = new db.cassandra.instance.User({
                first_name:args.first_name,
                last_name:args.last_name,
                email:args.email,
                user_uid: Uuid.random()
              });
              hashPassword (root, args, user, (err, user)=> {
                if (err) {
                  reject(err)
                } else {
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
          });
        });
      }
    },

    login:{
      type: new GraphQLList(UserType),
      description: 'Login',
      args: {
        email: {
          name: 'Email',
          type: new GraphQLNonNull(GraphQLString)
        },
        password: {
          name: 'Password',
          type: new GraphQLNonNull(GraphQLString)
        }
      },
      resolve: (root, args) => {
        const db = root.db;
        const PublicError = root.errorHandler.PublicError;
        const PrivateError = root.errorHandler.PrivateError;
        root.user.mustBeVerified(false);
        return new Promise ((resolve, reject) => {
          db.cassandra.instance.User.findOne(
            {email: args.email},
            {materialized_view: 'user_by_email'},
            (err, user) => {
            if (err) {
              reject(new PrivateError('CassandraError', err, 500));
            } else {
              if (user) {
                if (user.blocked) {
                  reject(new PublicError('Blocked', 'User is blocked', 401))
                } else {
                  checkPassword(root, args, user, (err) => {
                    if (err) {
                      reject(err);
                    } else {
                      //TODO MOVE THIS TO A HELPER, and DON'T HARDCODE SETTINGS
                      //TODO save token to token_table
                      jwt.sign({ u: user.user_uid }, 'boo' ,{ expiresIn: '90d' }, function(err, token) {
                        user.user_token = token;
                        resolve([user]);
                      });

                    }
                  });
                }
              } else {
                reject(new PublicError('UserError', 'User or password error', 403));
              }
            }
          });
        });
      }
    },
    logout:{
      type: new GraphQLList(UserType),
      description: 'Logout',
      args:{},
      resolve: (root, args) => {
        const db = root.db;
        const PublicError = root.errorHandler.PublicError;
        const PrivateError = root.errorHandler.PrivateError;
        root.user.mustBeVerified(true);
        return new Promise ((resolve, reject) => {
          let uid = root.user.payload.u;
          //TODO select token by user ID & add to blacklist & update blacklist table
          resolve([]);
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
        password: {
          name: 'Password',
          type: GraphQLString
        },
        new_password: {
          name: 'Old password',
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
          root.user.mustBeVerified(true);
          db.cassandra.instance.User.findOne(
            {user_uid: Uuid.fromString(args.user_uid)}, (err, user) => {
            if (err) {
              reject(new PrivateError('CassandraError', err, 500));
            } else {
              if (user) {
                user.delete()
                resolve([user]);
              } else {
                reject(new PublicError('UserError', 'User not found', 404));
              }
            }
          });
        });
      }
    },
    recoverUserPassword:{
      type: new GraphQLList(UserType),
      description: 'Delete a user',
      args: {
        email: {
          name: 'Email',
          type: GraphQLString
        }
      },
      resolve: (root, args) => {
        const db = root.db;
        const PublicError = root.errorHandler.PublicError;
        const PrivateError = root.errorHandler.PrivateError;

        return new Promise ((resolve, reject) => {
          root.user.mustBeVerified(true);
          //TODO send password reset email
          resolve([]);
        });
      }
    }


}
