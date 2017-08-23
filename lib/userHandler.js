const PublicError = require('./error').PublicError;

module.exports = () => {
  return {
    mustBeUser: function (value) {
      let t = false;
      if (this.userUid ) {
        t = true;
      }
      if (t != value){
        let err = this.error || {name:'User Error', message:'Verification failure user', status: 500};
        throw new PublicError (err.name, err.message, err.status);
      }
    },
    mustBeLoggedIn: function (value) {
      let t = false;
      if (this.loginUid) {
        t = true;
      }
      if (t != value){
        let err = this.error || {name:'User Error', message:'Verification failure login', status: 500};
        throw new PublicError (err.name, err.message, err.status);
      }
    },
    permissions:null,
    userUid:null,
    loginUid: null
  }

};
