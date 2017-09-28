const PublicError = require('./error').PublicError;

const checkCase = (that, key, value, reject) => {
  let t = false;
  if (that[key] ) {
    t = true;
  }
  if (t != value){
    let err = that.error || {name:'User Error', message:'Verification failure ' + key, status: 500};
    return reject (new PublicError (err.name, err.message, err.status));
  } else {
    return;
  }
};

module.exports = (loginHandler, permissionsHandler) => {
  return {
    mustBeUser: function (value, reject) {
      return checkCase(this, 'userUid', value, reject);
    },
    mustBeLoggedIn: function (value, reject) {
      return checkCase(this, 'loginUid', value, reject);
    },
    permissions:null,
    userUid:null,
    loginUid: null,
    audience:null,
    setPermissions: function (permissions){
      this.permissions = permissions;
    },
    getPermissionsAndUser: function (cb) {
      //Mechanism to update the permissions in the middle of a graphql request
      //We already have them

      if (this.permissions != null && this.userUid) {
        return cb();
      }

      loginHandler.getLogin(this.audience, this.loginUid , (err, login) => {
        if (err) {
          delete this.loginUuid;
          delete this.audience;
          //TODO workout what to actually do here
          return cb();
        }
        if (!login) {
          //TODO move default permissions to config
          permissionsHandler.builder(
            [
              {
                entity_uid:'ALL',
                roles:['guest']
              },
              {
                entity_uid:String(this.loginUid),
                roles:['unregistered']
              }
            ],
            (err, permissions) =>{
              this.permissions = permissions;
              return cb();
            }
          );
        }  else {

          if (login.blacklisted) {
            this.user.error = {
              name: 'UserError',
              status: 403,
              message: 'User token is blocked'
            };
            return cb();
          }

          this.userUid = login.user_uid;
          this.setPermissions(login.permissions);
          return cb();
        }

      });
    }
  };

};
