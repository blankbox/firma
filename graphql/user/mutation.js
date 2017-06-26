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
        return new Promise ((resolve, reject) => {
          db.cassandra.instance.User.findOne(
            {email: args.email},
            {materialized_view: 'user_by_email'},
            (err, user) => {
            if (err) {
              reject(new PrivateError('CassandraError', err, 500));
            } else {
              if (user) {
                bcrypt.compare(args.password, user.password_hash, (err, res) => {
                  if (!res) {
                    reject(new PublicError('UserError', 'User or password error', 403));
                  } else {
                    //TODO Make JWT
                    jwt.sign({ foo: 'bar' }, 'boo' ,{ expiresIn: '90d' }, function(err, token) {
                      user.user_token = token;
                      resolve([user]);
                    });
                  }
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
    // updateUser:{},
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
