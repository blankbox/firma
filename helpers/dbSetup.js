const Cassandra = require('express-cassandra');
const Redis = require("redis");


module.exports = function (config) {

  return {
    cassandra: Cassandra.createClient({
      clientOptions: {
        contactPoints: config.cassPoints,
        protocolOptions: { port: config.cassPort },
        keyspace: config.cassKeyspace,
        queryOptions: {consistency: Cassandra.consistencies.one},
        authProvider: new Cassandra.driver.auth.DsePlainTextAuthProvider(config.cassUser, config.cassPass)
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

    redis: Redis.createClient(
      {
        host: config.redisHost,
        port: config.redisPort,
        password: config.redisPass
      }
    )
  }
}
