const graphql = require('graphql');

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;

const LocalLoginType = require ('./schema');
//REDO
module.exports = {
  queryUserLogins: {
    type: new GraphQLList(LocalLoginType),
    description:'Get users logins',
    args:{
      user_uid: {
        type: GraphQLString,
        description: 'Uuid For the Login'
      }
    },
    resolve: (root, args) => {
      const db = root.db;
      const PubErr = root.errorHandler.PublicError;
      const PriErr = root.errorHandler.PrivateError;
      return new Promise ((resolve, reject) =>{
        root.user.mustBeUser(true);
        let userid;
        if (args.user_uid) {
          //TODO check other permissions
          userid = args.user_uid
        } else {
          userid = root.userHandler.userUid;
        }
        root.userHandler.getLoginByUser(userid, (err, logins) => {
          if (err) {
            reject( new PriErr('CassandraError', 'error getting  logins by user', 500));
          }

          let outArray = [];
          for (let l of logins){
            outArray.push({
              login_uid: l.login_uid,
              username: l.username,
              password: 'really...?',
              new_password: null,
              blocked:l.blocked,
              user_uid:l.user_uid
            });
          }
          resolve(outArray);
        });
      });
    }
  }
};
