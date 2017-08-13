const async = require('async');

 module.exports = (models) => {
  async.series([
  
    (callback) => {
      models.loadSchema('Permissions', {
        fields:{
          login_uid: "uuid",
          clust_uid: "uuid",
          resource: "text", //user/renewal
          actions:"text"
        },
        key:["token"],
       table_name: "permissions_table",
       indexes: ["resource"]
      });
      callback(null, models)
    }
  ],
  (err, models) => {
    return models;
  });
}
