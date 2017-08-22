const graphql = require('graphql');

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;

const LoginType = require ('./schema');

module.exports = {
  queryUserLogins: {
    type: new GraphQLList(LoginType),
    description:'Get users logins',
    args:{
      user_uid: {
        type: GraphQLString,
        description: 'Uuid For the Login'
      }
    },
    resolve: (root, args) => {
      const PubErr = root.errorHandler.PublicError;
      const PriErr = root.errorHandler.PrivateError;
      return new Promise ((resolve, reject) =>{
        root.user.mustBeUser(true);
        let userid;
        if (args.user_uid) {
          if (!root.user.loginPermissions.includes('UserAdmin') && args.user_uid != root.userHandler.userUid){
            reject(new PubErr('User error', 'You can\'t manage other users that', 403))
          }
          userid = args.user_uid
        } else {
          userid = root.userHandler.userUid;
        }
        root.loginHandler.getLoginByUser(userid, (err, logins) => {
          if (err) {
            reject( new PriErr('CassandraError', 'error getting  logins by user', 500));
          }
          let outArray = [];
          for (let l of logins){
            outArray.push({
              login_uid: l.login_uid,
              blocked:l.blocked,
              user_uid:l.user_uid,
              permissions:l.permissions
            });
          }
          resolve(outArray);
        });
      });
    }
  }
  // queryLogin: {
  //   type: new GraphQLList(LoginType),
  //   description:'Get login',
  //   args:{
  //     login_uid: {
  //       type: GraphQLString,
  //       description: 'Uuid For the Login'
  //     }
  //   },
  //   resolve: (root, args) => {
  //     const PubErr = root.errorHandler.PublicError;
  //     const PriErr = root.errorHandler.PrivateError;
  //     return new Promise ((resolve, reject) =>{
  //       root.user.mustBeUser(true);
  //
  //
  //       root.loginHandler.getLogin(audience, userid, (err, login) => {
  //         if (err) {
  //           reject( new PriErr('CassandraError', 'error getting  logins by user', 500));
  //         }
  //
  //         if (!login){resolve ([])};
  //
  //         if (!root.user.loginPermissions.includes('UserAdmin') && login.user_uid != root.userHandler.userUid){
  //           reject(new PubErr('User error', 'You can\'t manage other users that', 403))
  //         }
  //         let outArray = [];
  //         let l = login;
  //
  //         outArray.push({
  //           login_uid: l.login_uid,
  //           blocked:l.blocked,
  //           user_uid:l.user_uid,
  //           permissions:l.permissions
  //         });
  //
  //         resolve(outArray);
  //       });
  //     });
  //   }
  // },
};
