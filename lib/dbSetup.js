const Cassandra = require('express-cassandra');
const Redis = require('redis');



module.exports = function (debug, config) {
  const redisClient = () => {
    return Redis.createClient(
      {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
      }
    ).on('error', function(err){
      //Stop redis connection error crashing the server
      debug.log(err);
      debug.log(Date.now());
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
    messengerRecipient:redisClient()
  };
};
