const _ = require ('underscore');
module.exports = () => {
  //TODO This should probably be a class?

  let rolePermissions = {};
  let err;

  return {

    getRolePermissions: (cb) => {
      cb(err, rolePermissions) ;
    },

    checkPermissions: (permissions, possible) => {
      let perms = false;
      let check =  _.intersection(possible, permissions)
      if (check.length > 0){
        perms = check;
      }
      return perms
    },

    builder: (roleAndPermissions, cb) => {
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
          fullPerms.push(p.permissions)
        }
        permissions[p.entity_uid] =  _.uniq(_.flatten(fullPerms))
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
          rolePermissions[p.role].push(p.permissions)
        } else {
          rolePermissions[p.role] = p.permissions
        }
        rolePermissions[p.role] = _.sortBy(_.uniq(_.flatten(rolePermissions[p.role])));
      }
      cb(err)
    }
  }
}
