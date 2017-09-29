const PublicError = require('./error').PublicError;

const checkCase = (that, key, value) => {
  let t = false;
  let err = null;

  if (that[key] ) {
    t = true;
  }

  if (t != value){
    err = that.error || {name:'User Error', message:'Verification failure ' + key, status: 500};
  }

  return err;

};

module.exports = (loginHandler, permissionsHandler, config) => {
  return {
    mustBeUser: function (value) {
      return checkCase(this, 'userUid', value);
    },
    mustBeLoggedIn: function (value) {
      return checkCase(this, 'loginUid', value);
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

      if (this.audience === null || this.loginUid === null) {
        //i.e. no token, so is guest
        permissionsHandler.builder(
          [
            {
              entity_uid:'ALL',
              roles:['guest']
            },
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
                {
                  entity_uid:'ALL',
                  roles:['guest']
                },
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

    }
  };

};
