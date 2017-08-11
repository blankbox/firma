const PublicError = require('./error').PublicError;

module.exports = (db) => {
  return {
    mustBeUser: function (value) {
      if (this.userVerified !== value){
        let err = this.error || {name:'User Error', message:'Verification failure', status: 500};
        throw new PublicError (err.name, err.message, err.status);
      }
    },
    mustBeLoggedIn: function (value) {
      if (this.loginVerified !== value){
        let err = this.error || {name:'User Error', message:'Verification failure', status: 500};
        throw new PublicError (err.name, err.message, err.status);
      }
    },
    userVerified: false,
    loginVerified: false,
    loginPermissions:null,
    userUid:null,
    loginUid: null,
    getUser: function (cb) {
      let err, user;

      if (this.userUid){
        return cb(err, this.userUid)
      }

      if (!this.loginVerified) {
        return cb('Not verified', user)
      }

      if (!this.loginUuid) {
        return cb('No login found', user);
      }


        //check redis
        //if found extend exp and add to this .user_uid
        //check cassandra
        //add to redis
    },
    getPermissions: function (cb) {
      let err, permissions;

      if (this.permissions) {
        return cb(err, this.permissions);
      }

      if (!this.loginVerified) {
        return cb('Not verified', user)
      }

      if (!this.loginUuid) {
        return cb('No login found', user);
      }
      //check redis
      //if found extend exp and add to this .user_uid
      //check cassandra
      //add to redis


    }
  }

};
