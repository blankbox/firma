const async = require('async');
//TODO add second schema for user->token table_name


 module.exports = (models) => {
  async.series([
    (callback) => {
      models.loadSchema('LocalLogin', {
        fields:{
          user_uid: {"type": "uuid"},
          login_uid: "uuid",
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
      models.loadSchema('Token', {
        fields:{
          token: "text",
          login_uid: "uuid",
          type: "text", //user/renewal
          blacklist: {"type":"boolean", "default":false}
        },
        key:["token"],
       table_name: "token_table",
       indexes: ["blacklist"]
      });
      callback(null, models)
    },
  ],
  (err, models) => {
    return models;
  });
}
