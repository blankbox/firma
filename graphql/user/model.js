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
      models.loadSchema('User', {
        fields:{
          user_uid: {"type": "uuid"},
          first_name    : "text",
          last_name : "text",
          email     : "text",
          password_hash: "text",
          blocked: {"type":"boolean", "default":false}
        },
        key:["user_uid"],
        materialized_views: {
          user_by_email: {
            select: ["*"],
            key : ["email", "user_uid"],
          }
        },
        table_name: "user",
      });
    callback(null, models)
    }
  ],
  (err, models) => {
    return models;
});
}
