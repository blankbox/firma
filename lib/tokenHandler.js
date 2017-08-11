const jwt = require('jsonwebtoken');

const redisString = 'bklst:'

module.exports = (db) => {
  return {
    blackListToken: (tokens) => {
      for (let token of tokens) {
        let decode = jwt.decode(token);
        db.redis.set(redisString + token, null, 'EX', decode.exp + 30);
        // let blackListEntry = new db.cassandra.instance.Tokens({
        //
        // });


      }
    },
    containsToken: (token) => {
      db.redis.exists(redisString + token, (err, res) => {
        return res;
      });

    },
    issueToken: ()=>{}
  }
}
