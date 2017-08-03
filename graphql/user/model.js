const async = require('async');
//TODO add second schema for user->token table_name


 module.exports = (models) => {
  async.series([

    (callback) => {
      models.loadSchema('Tokens', {
        fields:{
          login_uid: {"type": "uuid"},
          user_uid: {"type": "uuid"},
          token: "text",
          blacklist: {"type":"boolean", "default":false}
        },
        key:["token"],
        materialized_views: {
          token_by_user_uid: {
            select: ["*"],
            key : ["user_uid", "token"],
          }
        },
       table_name: "token_table",
       indexes: ["blacklist"]
      });
      callback(null, models)
    },

    (callback) => {
      models.loadSchema('UserProfile', {
        fields:{
          user_uid: {"type": "uuid"},
          login_uids: {"type": "text"},
          first_name    : "text",
          last_name : "text",
          email     : "text",
          blocked: {"type":"boolean", "default":false}
        },
        key:["user_uid"],
        materialized_views: {
          user_by_email: {
            select: ["*"],
            key : ["email", "user_uid"],
          }
        },
        table_name: "UserProfile",
      });
      callback(null, models)
    },

    (callback) => {
      models.loadSchema('UserLocalLogin', {
        fields:{
          login_uid: {"type": "uuid"},
          first_name    : "text",
          last_name : "text",
          username     : "text",
          password_hash: "text",
          blocked: {"type":"boolean", "default":false}
        },
        key:["login_uid"],
        materialized_views: {
          user_by_username: {
            select: ["*"],
            key : ["username", "login_uid"],
          }
        },
        table_name: "UserLocalLogin",
      });
      callback(null, models)
    },

    (callback) => {
      models.loadSchema('UserCognitoLogin', {
        fields:{
          login_uid: {"type": "uuid"},
          blocked: {"type":"boolean", "default":false}
        },
        key:["login_uid"],
        table_name: "UserLocalLogin",
      });
    callback(null, models)
    }

  ],
  (err, models) => {
    return models;
  });
}
