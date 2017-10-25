const _ = require ('underscore');
const fs = require('fs');

module.exports = (db) => {
  //TODO This should probably be a class?

  let rolePermissions = {};

  return {

    getRolePermissions: (cb) => {
      cb(null, rolePermissions) ;
    },

    clearFromCache:(audience, loginUuid) => {
      //TODO move these to config
      const redisLoginUid = 'loguid';

      const delim = ':';

      let redisKey = redisLoginUid + delim + audience + delim + loginUuid;
      db.redis.del(redisKey);
    },


    checkPermissions: (permissions, possible) => {

      let perms = false;
      let check =  _.intersection(possible, permissions);

      if (check.length > 0){
        perms = check;
      }
      return perms;
    },

    updatePermissionsForUsers: (userPermissionsArray) => {

      return userPermissionsArray.map((u)=>{
        return db.cassandra.instance.Permissions.update(
          {
            login_uid: u.login_uid,
            audience: u.audience,
            entity_uid: u.entity_uid
          },
          u.update,
          {return_query: true}
        );
      });


    },

    builder: (roleAndPermissions, cb) => {
      let err;
      if (! _.isArray(roleAndPermissions)) {roleAndPermissions = [roleAndPermissions];}
      // roleAndPermissions = [
      //   {
      //     enitity_uid: thing
      //     roles: []
      //     permissions:[]
      //   }
      // ]
      let permissions = {};

      for (let p of roleAndPermissions) {

        let fullPerms = [];

        if (p.roles){
          for (let r of p.roles) {
            if(rolePermissions[r]){
              fullPerms.push(rolePermissions[r]);
            }
          }
        }

        if (p.permissions){
          fullPerms.push(p.permissions);
        }
        permissions[p.entity_uid] =  _.uniq(_.flatten(fullPerms));
      }

      let resourcePermissions = {};
      for (let entity of Object.keys(permissions)) {
        for (let resource of permissions[entity]){
          if (!resourcePermissions[resource]){
            resourcePermissions[resource] = [];
          }
          resourcePermissions[resource].push(entity);
        }
      }

      return cb(err, resourcePermissions);

    },

    addPermissionsToRole: (perms, cb) => {
      if (! _.isArray(perms)) {perms = [perms];}
      // perms = [
      //   {
      //     role:'FOO',
      //     permissions:['bar']
      //   }
      // ]
      for (let p of perms) {
        if (rolePermissions[p.role]) {
          rolePermissions[p.role].push(p.permissions);
        } else {
          rolePermissions[p.role] = p.permissions;
        }
        rolePermissions[p.role] = _.sortBy(_.uniq(_.flatten(rolePermissions[p.role])));
      }
      cb(null);
    },
    //Use function here to allow use of this
    loadRoles: function(routes){
      for (let dir of routes) {
        for (let r of dir.routes) {
          let file = dir.rootDirectory + r;
          if (fs.existsSync(file + '/permissions.js')) {
            this.addPermissionsToRole(require(file + '/permissions.js').roles, ()=>{});
          }
        }
      }
    }
  };
};
