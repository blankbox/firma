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

module.exports = () => {
  return {
    mustBeUser: function (value, reject) {
      return checkCase(this, 'userUid', value, reject);
    },
    mustBeLoggedIn: function (value, reject) {
      return checkCase(this, 'loginUid', value, reject);
    },
    permissions:null,
    userUid:null,
    loginUid: null
  };

};
