module.exports = (db, errorHandler, permissionsHandler) => {

  const redisLoginUid = 'loguid';

  const delim = ':';
  const redisCacheTimeoutMins = 60;

  const clearLoginFromCache = permissionsHandler.clearFromCache;

  const getLoginById = (audience, loginUuid, cb) => {
    let redisKey = redisLoginUid + delim + audience + delim + loginUuid;

    db.redis.get(redisKey, (err, login) => {
      if (login) {
        db.redis.expire(redisKey, redisCacheTimeoutMins * 60);
        return cb(err, JSON.parse(login));
      }

      db.cassandra.instance.Login.findOne({audience: audience, login_uid:loginUuid}, (err, login) => {

        if (err || !login) {
          return cb(err, login);
        }

        db.cassandra.instance.Permissions.find({audience: audience, login_uid:loginUuid}, (err, permissions) => {
          if (!permissions) {
            permissions =
            [{
              entity_uid:'ALL',
              roles:['guest', 'newLogin']
            }];
          }
          permissionsHandler.builder(JSON.parse(JSON.stringify(permissions)), (err, permissions) => {
            login = JSON.parse(JSON.stringify(login));
            login.permissions = permissions;

            if (login.user_uid) {
              db.cassandra.instance.UserProfile.findOne({user_uid: db.cassandra.uuidFromString(login.user_uid)}, {raw:true}, (err, user) =>{
                login.user = user;
                cb(err, login);
                db.redis.set(redisKey, JSON.stringify(login), 'EX', redisCacheTimeoutMins * 60);
              });
            } else {
              cb(err, login);
              db.redis.set(redisKey, JSON.stringify(login), 'EX', redisCacheTimeoutMins * 60);
            }
          });
        });

      });
    });

  };


  const getLoginByUser = (userUuid, cb) => {

    //TODO populate permissions here too
    db.cassandra.instance.Login.find(
      {user_uid: userUuid},
      {materialized_view: 'login_by_user'},
      (err, login) => {
        cb(err, login);
      }
    );
  };

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
      entity_uid: String(loginUuid),
      roles:['newLogin']
    });

    let batch = [
      login.save({return_query: true}),
      permissions.save({return_query: true})
    ];

    db.cassandra.doBatch(batch, (error)=>{
      let err;
      if (error) {
        err = new errorHandler.PrivateError('CassandraError', 'error saving login', 500);
        return cb(err);
      }
      login = JSON.parse(JSON.stringify(login));
      permissionsHandler.builder(JSON.parse(JSON.stringify(permissions)), (err, permissions) => {
        login.permissions = permissions;
        clearLoginFromCache(audience, loginUuid);
        cb(err, login);
      });

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
    getLoginByUser,
    deleteLogin,
    updateLogin,
    registerLogin,
    clearLoginFromCache
  };
};
