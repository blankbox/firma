const _ = require ('underscore');
module.exports = () => {
  //TODO This should probably be a class?

  let rolePermissions = {};
  let err;

  return {

    getRolePermissions: (cb) => {
      cb(err, rolePermissions) ;
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
            fullPerms.push(rolePermissions[r])
          }
        }

        if (p.permissions){
          fullPerms.push(p.permissions)
        }
        permissions[p.entity_uid] =  _.uniq(_.flatten(fullPerms))
      }

      return cb(err, permissions);

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
