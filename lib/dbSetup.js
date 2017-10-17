const Cassandra = require('express-cassandra');
const Redis = require('redis');

module.exports = function (debug, config) {
  const redisClient = () => {

    let clientConf = {
      host: config.redis.host || 'localhost',
      port: config.redis.port || 6379
    };

    if (typeof(config.redis.password) != 'undefined') {
      clientConf.password = config.redis.password;
    }

    if (typeof(config.redis.db) != 'undefined') {
      clientConf.db =  config.redis.db;
    }

    return Redis.createClient(
      clientConf
    ).on('error', function(err){
      //Stop redis connection error crashing the server
      config.debug.error(err);
      config.debug.error(Date.now());
    });
  };


  return {
    cassandra: Cassandra.createClient({
      clientOptions: {
        contactPoints: config.cassandra.points,
        protocolOptions: { port: config.cassandra.port },
        keyspace: config.cassandra.keyspace,
        queryOptions: {consistency: Cassandra.consistencies.one},
        authProvider: new Cassandra.driver.auth.PlainTextAuthProvider(config.cassandra.user, config.cassandra.password)
      },
      ormOptions: {
          defaultReplicationStrategy : {
              class: 'SimpleStrategy',
              replication_factor: 1
          },
          migration: 'safe',
          createKeyspace: true
      }
    }),
    redis: redisClient(),
    messengeRecipient:redisClient()
  };
};
