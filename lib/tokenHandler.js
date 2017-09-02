const jwt = require('jsonwebtoken');


module.exports = (db) => {


  // Expire for redis & cassandra countdown time in seconds
  // Expire for jwt is time

  const ttl = (date) => {
    return (date - Date.now()/1000)
  }
  const redisBlklist = 'bklst';
  const delim = ':';


  const blacklistToken = (token, cb) => {
    let decode = jwt.decode(token);
    db.redis.set(redisBlklist + delim + token, null, 'EX', ttl(decode.exp) + 30);
    db.cassandra.instance.Token.update(
      {token:token},
      {blacklist: true},
      {ttl:  ttl(decode.exp) , if_exists: true},
      function(err){
        cb(err)
    });
  }


  return {
    blacklistToken: blacklistToken,
    containsToken: (token, cb) => {
      db.redis.exists(redisBlklist + delim + token, (err, res) => {
        cb(err, res);
      });

    // },
    // issueToken: (login, cb)=>{
    //   localConf

    }
  }
}
