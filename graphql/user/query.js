const graphql = require('graphql');

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;

const UserType = require ('./schema');

module.exports = {
  queryUser: {
    type: new GraphQLList(UserType),
    description:'Get user data',
    args:{
      email: {
        type: GraphQLString,
        description: 'Email'
      }
    },
    resolve: (root, args) => {
      const db = root.db;
      const PublicError = root.errorHandler.PublicError;
      const PrivateError = root.errorHandler.PrivateError;
      return new Promise ((resolve, reject) =>{
        root.user.mustBeVerified(true);

        if (args.email) {
          db.cassandra.instance.User.findOne({email:args.email}, {materialized_view: 'user_by_email'},(err, user) => {
            if (err) {
              //handle error
            } else {
              if (user){
                resolve([user]);
              } else {
                reject(new Error('test'));
              }
            }
          });
        } else {
          db.cassandra.instance.User.find({}, (err, users) => {
            if (err) {
              //handle error
            } else {
              let u = users[0];
              console.log(u.email);
              resolve([ {
                user_uid: u.user_uid,
                email: u.email
              }])
            }
          });
        }
      })

    }
  }
};
