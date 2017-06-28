const graphql = require('graphql');
const bcrypt = require('bcrypt');

const Uuid = require('cassandra-driver').types.Uuid;

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;
const jwt = require('jsonwebtoken');

const UserType = require ('./schema');

const checkPassword = (args, user, cb) => {
  bcrypt.compare(args.password, user.password_hash, (err, res) => {
    if (!res) {
      reject(new PublicError('UserError', 'User or password error', 403));
    } else {
      //TODO Make JWT
      cb();
      // jwt.sign({ u: user.user_uid }, 'boo' ,{ expiresIn: '90d' }, function(err, token) {
      //   user.user_token = token;
      //   resolve([user]);
      // });
    }
  });
};

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
        //Check we don't have this email already
          db.cassandra.instance.User.findOne(
            {email:args.email},
            {materialized_view:'user_by_email'}, (err, user) => {
            if (err) {
              reject(new PrivateError('CassandraError', 'error select from user by email', 500));
            } else {
              if (user) {
                reject(new PublicError('UserError', 'Email address in use', 403));
              } else {

                let user = new db.cassandra.instance.User({
                  first_name:args.first_name,
                  last_name:args.last_name,
                  email:args.email,
                  user_uid: Uuid.random()
                });

                bcrypt.genSalt(1, (err, salt) => {
                  if (err) {
                    reject( new PrivateError('BcryptError', 'error generating salt', 500));
                  } else {
                    bcrypt.hash(args.password, salt, (err, hash) => {

                      if (err) {
                        reject( new PrivateError('BcryptError', 'error hashing password', 500));
                      } else {

                        user.password_hash = hash;
                        user.save((err) => {
                          if (err) {
                            //handle error
                            reject( new PrivateError('CassandraError', 'error saving user', 500));
                          } else {
                            resolve([user]);
                          }
                        });

                      }
                    });
                  }
                });

              }
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
                  checkPassword(args, user, () => {
                    jwt.sign({ u: user.user_uid }, 'boo' ,{ expiresIn: '90d' }, function(err, token) {
                      user.user_token = token;
                      resolve([user]);
                    });
                  });
              } else {
                reject(new PublicError('UserError', 'User or password error', 403));
              }
            }
          });
        });
      }
    },
    // logout:{},
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

          //TODO move this out
          let uid;
          let checkPermissions;
          let isSelf = false;

          if (!args.user_uid) {
            uid = root.user.payload.u;
            isSelf = true;
            err = 0;
            checkPermissions = (cb) => { cb(err, true)}
          } else {
            uid = args.user_uid;
            if (root.user.payload.u === args.user_uid) {
              isSelf = true;
            }
            //TODO this needs to actually check permissions
            err = 0;
            checkPermissions = (cb) => { cb(err, true)}
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
                checkPermissions( (err, hasPerms) => {
                  if (err) {
                    reject(new PrivateError('PermsError', err, 500));
                  } else if (!hasPerms) {
                    //TODO better error
                    reject(new PublicError('UserError', 'You can\'t do that', 403));
                  } else {

                    //Update name & email - self or admin
                    //update other fields - only admin can block
                    //TODO EMAIL MUST BE UNIQ - THIS ALLOWS DUPLICATES

                    const updateFields = ['first_name', 'last_name', 'email', 'blocked'];

                    for (let k of updateFields) {
                      if (typeof(args[k]) != undefined) {
                        user[k] = args[k];
                      }
                    }


                    //Update password - require current password
                    if (args.new_password){
                      checkPassword(args, user, ()=> {
                        args.password = args.new_password;
                        bcrypt.genSalt(1, (err, salt) => {
                          if (err) {
                            reject( new PrivateError('BcryptError', 'error generating salt', 500));
                          } else {
                            bcrypt.hash(args.password, salt, (err, hash) => {

                              if (err) {
                                reject( new PrivateError('BcryptError', 'error hashing password', 500));
                              } else {

                                user.password_hash = hash;
                                user.save((err) => {
                                  if (err) {
                                    //handle error
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
                    } else {
                      user.save((err) => {
                        if (err) {
                          //handle error
                          reject( new PrivateError('CassandraError', 'error saving user', 500));
                        } else {
                          resolve([user]);
                        }
                      });
                    }
                  }
                });

              }
            }
          });
        });
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
    // newPasswordUser:{},
    // recoverUserPassword:{}


}
