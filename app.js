const errorHandler = require ('./lib/error');
const LoginHandler = require('./lib/loginHandler');

module.exports = (config) => {

  const debug = config.debug;
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


    const schema = require ('./lib/rootSchemaBuilder')(config, db, errorHandler, permissionsHandler);
    const graphqlHandler = require('./lib/graphQLHandler')(debug, errorHandler, schema);

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

    return {
      db,
      schema,
      app,
      scServer
    };
  });
};
