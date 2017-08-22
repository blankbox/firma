const permissionsBuilder = require('./permissionsHandler');

module.exports = (db, errorHandler) => {

  const redisLoginUid = 'loguid';

  const delim = ':';
  const redisCacheTimeoutMins = 60;

  const clearLoginFromCache = (audience, loginUuid) => {
    let redisKey = redisLoginUid + delim + audience + delim + loginUuid;
    db.redis.set(redisKey, null, 'EX', 0);
  };

  const getLoginById = (audience, loginUuid, cb) => {
    let redisKey = redisLoginUid + delim + audience + delim + loginUuid;

    db.redis.get(redisKey, (err, login) => {

      if (login) {
        db.redis.expire(redisKey, redisCacheTimeoutMins * 60);
        return cb(err, JSON.parse(login));
      }

      db.cassandra.instance.Login.findOne({audience: audience, login_uid:loginUuid}, (err, login) => {
        if (err || !login) {return cb(err, login)}

        db.cassandra.instance.Permissions.find({audience: audience, login_uid:loginUuid}, (err, permissions) => {
          if (permissions) {
            login = JSON.parse(JSON.stringify(login))
            login.permissions = JSON.parse(JSON.stringify(permissions));
          }
          cb(err, login);
          db.redis.set(redisKey, JSON.stringify(login), 'EX', redisCacheTimeoutMins * 60);
        })

      });
    });

  }


  const getLoginByUser = (userUuid, cb) => {
    db.cassandra.instance.Login.find(
      {user_uid: userUuid},
      {materialized_view: 'login_by_user'},
      (err, login) => {
        cb(err, login);
      }
    );
  }

  const updateLogin = (audience, loginUuid, data, cb) =>{

    db.cassandra.instance.Login.update({audience: audience, login_uid:loginUuid}, data, (err) => {
      if (err) {
        cb(err);
      }
      clearLoginFromCache(audience, loginUuid);
      return cb(err);
    });
  };

  const registerLogin = (audience, loginUuid, cb) => {
    let login = new db.cassandra.instance.Login({
      login_uid:loginUuid,
      audience: audience
    });

    let permissions = new db.cassandra.instance.Permissions({
      login_uid:loginUuid,
      audience: audience,
      entity_uid: 'ALL',
      roles:['everyone', 'self']
    });

    let batch = [
      login.save({return_query: true}),
      permissions.save({return_query: true})
    ]
    db.cassandra.doBatch(batch, (error)=>{
      let err;
      if (error) {
        err = new errorHandler.PrivateError('CassandraError', 'error saving login', 500);
        return cb(err);
      }
      login = JSON.parse(JSON.stringify(login))
      login.permissions = JSON.parse(JSON.stringify(permissions));

      cb(err, login);
    });

  };

  const deleteLogin = (audience, loginUuid, cb) => {
    //TODO remove permissions entry too
    db.cassandra.instance.Login.delete({audience: audience, login_uid:loginUuid}, (err) => {
      if (err) {
        cb(err);
      }
      clearLoginFromCache(audience, loginUuid);
      return cb(err);
    });
  };

  return {
    getLogin:getLoginById,
    getLoginByUser:getLoginByUser,
    deleteLogin:deleteLogin,
    updatelogin:updateLogin,
    registerLogin:registerLogin
  }


}
