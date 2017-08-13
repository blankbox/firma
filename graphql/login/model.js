const async = require('async');

 module.exports = (models) => {
  async.series([
    (callback) => {
      models.loadSchema('Login', {
        fields:{
          user_uid: {"type": "uuid"},
          audience: "text",
          login_uid: "uuid",
          blacklist: {"type":"boolean", "default":false},
          permissions: "text"
        },
        key:["audience", "login_uid"],
        materialized_views: {
          login_by_user: {
            select: ["*"],
            key : ["user_uid", "login_uid"],
          }
        },
        table_name: "login_table",
        indexes: ["blacklist"]
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
