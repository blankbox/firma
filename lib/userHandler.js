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
    getPermissionsAndUser: function (cb) {
      //Mechanism to update the permissions in the middle of a graphql request
      let that = this;
      //We already have them
      if (that.permissions && that.userUid) {
        return cb();
      }

      loginHandler.getLogin(that.audience, that.loginUid , (err, login) => {
        if (err) {
          delete that.loginUuid;
          delete that.audience;
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
                entity_uid:String(that.loginUid),
                roles:['unregistered']
              }
            ],
            (err, permissions) =>{
              that.permissions = permissions;
              return cb();
            }
          );
        }  else {

          if (login.blacklisted) {
            that.user.error = {
              name: 'UserError',
              status: 403,
              message: 'User token is blocked'
            };
            return cb();
          }

          that.userUid = login.user_uid;
          that.permissions = login.permissions;
          return cb();
        }

      });
    }
  };

};
