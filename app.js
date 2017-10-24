const errorHandler = require ('./lib/error');
const LoginHandler = require('./lib/loginHandler');

module.exports.db = require ('./lib/dbSetup');

module.exports.default = (config, cb) => {

  const debug = config.debug || require('tracer').colorConsole({level:'error'});
  debug.error('Preparing to configure database');

  const db = require ('./lib/dbSetup')(debug, config.database );

  config.routes.push(
    {
      routes:['user', 'login', 'permissions'],
      rootDirectory:__dirname + '/graphql/'
    }
  );

  if (config.search){
    config.routes.push(
      {
        routes:['search'],
        rootDirectory:__dirname + '/graphql/'
      }
    );
  }

  const permissionsHandler = require('./lib/permissionsHandler')(db);

  permissionsHandler.loadRoles(config.routes);
  require('./lib/dbLoader')(config, db, (err) => {

    if (err) {
      return process.exit(1); //Ensure the the database has loaded before continuing
    }

    debug.error('Database configured');


    const schema = require ('./lib/rootSchemaBuilder')(config, db, errorHandler, permissionsHandler);
    const graphqlHandler = require('./lib/graphQLHandler')(debug, errorHandler, schema);

    debug.error('Loading express');

    const app = require('./lib/express')({
      config,
      db,
      LoginHandler,
      errorHandler,
      permissionsHandler,
      graphqlHandler
    });

    let server;

    if (config.https) {
      const https = require('https');
      server = https.createServer({cert: config.https.cert, key: config.https.key}, app);
      server.listen(config.https.port);
    } else {
      const http = require('http');
      server = http.createServer(app);
      server.listen(config.http.port);
    }
    debug.error('Done');

    debug.error('Loading socket server');

    let scServer = require('./lib/socket')({
      server,
      config,
      db,
      LoginHandler,
      errorHandler,
      permissionsHandler,
      graphqlHandler,
      debug
    });

    debug.error('Done');


    if (!cb) {cb=()=>{debug.log('ready');};}
    cb(
      {
        db,
        schema,
        app,
        scServer
      }
    );
  });
};
