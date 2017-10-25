const checkCase = (that, key, value) => {
  let t = false;
  let err = that.error;

  if (that[key+'Uid']) {
    t = true;
  }

  if (t != value){
    err = that.error || {name:'User Error', message:'Verification failure - this ' + key + ' is not known.', status: 500};
  }
  return err;
};

const roles = {
  guest:{
    entity_uid:'ALL',
    roles:['guest']
  },
};

module.exports = (loginHandler, permissionsHandler, config) => {
  return {
    audience:null,
    error:null,
    loginUid: null,
    permissions:null,
    user:null,
    userUid:null,
    mustBeLoggedIn: function (value) {
      return checkCase(this, 'login', value);
    },
    mustBeUser: function (value) {
      return checkCase(this, 'user', value);
    },
    getPermissionsAndUser: function (cb) {
      //Mechanism to update the permissions in the middle of a graphql request

      if (this.audience === null || this.loginUid === null) {
        //i.e. no token, so is guest
        permissionsHandler.builder(
          [
            roles.guest
          ],
          (err, permissions) =>{
            this.permissions = permissions;
            return cb();
          }
        );

      } else {

        loginHandler.getLogin(this.audience, this.loginUid , (err, login) => {

          if (err) { //Something has gone wrong - allow guest access only
            config.debug.error(err);
            delete this.loginUuid;
            delete this.audience;
            permissionsHandler.builder(
              [
                roles.guest
              ],
              (err, permissions) =>{
                this.permissions = permissions;
                return cb();
              }
            );
          }
          if (!login) {
            //TODO move default permissions to config
            permissionsHandler.builder(
              [
                roles.guest,
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
            this.permissions = login.permissions;
            if (login.user) {
              this.user = login.user;
            }
            return cb();
          }

        });
      }

    }
  };

};
