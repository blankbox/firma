module.exports = [
  {
    name:'UserProfile',
    config:{
      fields:{
        user_uid: {'type': 'uuid'},
        login_uid: {
          type: 'map',
          typeDef: '<text, text>' //login_uid: audience
        },
        first_name    : 'text',
        last_name : 'text',
        email     : 'text',
        user_name     : 'text',
        blocked: {'type':'boolean', 'default':false},
        deleted: {'type':'boolean', 'default':false},
        private: {'type':'boolean', 'default':false},
        client_data: {
          type: 'map',
          typeDef: '<text, text>'
        }
      },
      table_name:'user_profile',
      key:['user_uid'],
      materialized_views: {
        user_by_email: {
          select: ['*'],
          key : ['email', 'user_uid'],
        },
        user_by_user_name: {
          select: ['*'],
          key : ['user_name', 'user_uid'],
        }
      }
    }
  }
];
