const PublicError = require('./error').PublicError;

module.exports = () => {
  return {
    mustBeUser: function (value) {
      if (this.userUid !== value){
        let err = this.error || {name:'User Error', message:'Verification failure', status: 500};
        throw new PublicError (err.name, err.message, err.status);
      }
    },
    mustBeLoggedIn: function (value) {
      if (this.loginUid !== value){
        let err = this.error || {name:'User Error', message:'Verification failure', status: 500};
        throw new PublicError (err.name, err.message, err.status);
      }
    },
    loginPermissions:null,
    userUid:null,
    loginUid: null
  }

};
