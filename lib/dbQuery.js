module.exports = (config) => {
  console.log('foo');

  let cassandra = config.db.cassandra.instance;
  let redis = config.db.redis;

  return {
    find: (table, query, options, cb) => {
      let redisKey = `${table}`; //TODO what should this be? Can we get the pk
      redis.get(redisKey, (err, data) => {
        if (data) {
          return cb(err, JSON.parse(data));
        }
        cassandra[table].find(query, options, (err, data) => {
          cb(err, data);
          if (!err && data) {
            redis.set(redisKey, JSON.stringify(data));
          }
        });
      });
    },

    findOne: (table, query, options, cb) => {
      cassandra[table].findOne(query, options, cb);
    },

    create: (table, data) => {
      return new cassandra[table](data);
    },

    update: () => {

    },

    delete: () => {

    }
  };
};
