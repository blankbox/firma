module.exports = [
  {
    name:'Permissions',
    config:{
      fields:{
        audience: 'text',
        login_uid: 'uuid',
        entity_uid: 'text', //Ugly hack to allow us to make this the clustering key without having to create dummy uuids for roles
        permissions: {
          type: 'list',
          typeDef: '<text>'
        },
        roles:{
          type: 'list',
          typeDef: '<text>'
        }
      },
      key:['login_uid', 'audience', 'entity_uid'],
      materialized_views: {
        permission_by_entity: {
          select: ['*'],
          key : ['entity_uid', 'login_uid', 'audience'],
        }
      },
      table_name: 'permissions_table',
    }
  },
  {
    name:'Roles',
    config:{
      fields:{
        role: 'text',
        permissions: {
          type: 'list',
          typeDef: '<text>'
        }
      },
      key:['role'],
      table_name: 'roles',
    }
  }
];
