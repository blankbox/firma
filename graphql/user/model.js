const async = require('async');

 module.exports = (models) => {
  async.series([

    (callback) => {
      models.loadSchema('UserProfile', {
        fields:{
          user_uid: {"type": "uuid"},
          login_uid: {"type": "uuid"},
          first_name    : "text",
          last_name : "text",
          email     : "text",
          blocked: {"type":"boolean", "default":false},
          client_data: "text"
        },
        key:["user_uid", "login_uid"],
        materialized_views: {
          user_by_email: {
            select: ["*"],
            key : ["email", "user_uid", "login_uid"],
          }
        },
        table_name: "user_profile",
      });
      callback(null, models)
    }
  ],
  (err, models) => {
    return models;
  });
}
