
module.exports = (db) => {

  const redisLoginUid = 'loguid';

  const delim = ':';
  const redisCacheTimeoutMins = 60;

  const clearLoginFromCache = (audience, loginUuid) => {
    let redisKey = redisLoginUid + delim + audience + delim + loginUuid;
    db.redis.set(redisKey, null, 'EX', 0);
  };

  const getLogin = (audience, loginUuid, cb) => {
    //TODO this has a potential race condition with delete - add a tempoart (ttl ~2 sec) that 
    //flags that this is to be deleted
    let redisKey = redisLoginUid + delim + audience + delim + loginUuid;

    db.redis.get(redisKey, (err, login) => {
      if (login) {
        db.redis.set(redisKey, login, 'EX', redisCacheTimeoutMins * 60);
        return cb(err, JSON.parse(login));
      }
      db.cassandra.instance.Login.findOne({audience: audience, login_uid:loginUuid}, (err, login) => {
        cb(err, login);
        if (login){
          db.redis.set(redisKey, JSON.stringify(login), 'EX', redisCacheTimeoutMins * 60);
        }
      });
    });

  }

  const updateLogin = (audience, loginUuid, data, cb) =>{

    clearLoginFromCache(audience, loginUuid);

  };

  const registerLogin = () => {};

  const deleteLogin = (audience, loginUuid, cb) => {
    clearLoginFromCache(audience, loginUuid);

    db.cassandra.instance.Login.delete({audience: audience, login_uid:loginUuid}, (err) => {
      if (err) {
        cb(err);
      }
      clearLoginFromCache(audience, loginUuid);
      return cb(err);
    });
  };

  return {
    getLogin:getLogin,
    deleteLogin:deleteLogin,
    updatelogin:
  }


}
