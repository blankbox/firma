const async = require('async');

 module.exports = (models) => {
  async.series([

    (callback) => {
      models.loadSchema('UserProfile', {
        fields:{
          user_uid: {'type': 'uuid'},
          login_uid: {
            type: 'map',
            typeDef: '<text, text>' //login_uid: audience
          },
          first_name    : 'text',
          last_name : 'text',
          email     : 'text',
          blocked: {'type':'boolean', 'default':false},
          deleted: {'type':'boolean', 'default':false},
          private: {'type':'boolean', 'default':false},

          client_data: {
            type: 'map',
            typeDef: '<text, text>'
          }
        },
        key:['user_uid'],
        materialized_views: {
          user_by_email: {
            select: ['*'],
            key : ['email', 'user_uid'],
          }
        },
        table_name: 'user_profile',
        indexes:['blocked', 'private', 'deleted']
      });
      callback(null, models);
    }
  ],
  (err, models) => {
    return models;
  });
};
