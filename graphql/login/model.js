const async = require('async');

 module.exports = (models) => {
  async.series([
    (callback) => {
      models.loadSchema('Login', {
        fields:{
          user_uid: {"type": "uuid"},
          audience: "text",
          login_uid: "uuid",
          blacklist: {"type":"boolean", "default":false}
        },
        key:["login_uid", "audience"],
        materialized_views: {
          login_by_user: {
            select: ["*"],
            key : ["user_uid", "login_uid", "audience"],
          }
        },
        table_name: "login_table",
        indexes: ["blacklist"]
      });
      callback(null, models)
    },

  ],
  (err, models) => {
    return models;
  });
}
