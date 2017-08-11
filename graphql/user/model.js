const async = require('async');
//TODO add second schema for user->token table_name


 module.exports = (models) => {
  async.series([

    (callback) => {
      models.loadSchema('Tokens', {
        fields:{
          user_uid: {"type": "uuid"},
          token: "text",
          blacklist: {"type":"boolean", "default":false}
        },
        key:["user_uid","token"],
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
        table_name: "user_profile",
      });
      callback(null, models)
    },

    (callback) => {
      models.loadSchema('UserLocal', {
        fields:{
          user_uid: {"type": "uuid"},
          username     : "text",
          password_hash: "text",
          blocked: {"type":"boolean", "default":false}
        },
        key:["username"],
        materialized_views: {
          local_by_user_uid: {
            select: ["*"],
            key : ["user_uid"],
          }
        },
        table_name: "user_local_login",
      });
      callback(null, models)
    },

    (callback) => {
      models.loadSchema('UserCognito', {
        fields:{
          user_uid: {"type": "uuid"},
          login_uid: {"type": "uuid"},
          blocked: {"type":"boolean", "default":false}
        },
        key:["login_uid"],
        materialized_views: {
          cognito_by_user_uid: {
            select: ["*"],
            key : ["user_uid"],
          }
        },
        table_name: "user_cognito_login",
      });
    callback(null, models)
    }

  ],
  (err, models) => {
    return models;
  });
}
