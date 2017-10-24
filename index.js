


//TODO set up firma from here - separate express and socket


//Step one - setup database.


module.exports = (config) => {

  //Step one - validate config TODO



  // - set defaults for debug TODO
  const debug = config.debug;

  // Add the basic firma routes - allow this to be configured
  config.routes.push(
    {
      routes:['user', 'login', 'permissions'],
      rootDirectory:__dirname + '/graphql/'
    }
  );


  //Step two load databases

  const db = require ('./lib/dbSetup')(debug, config.database);
  require('./lib/dbLoader')(config, db, (err) => {

    //TODO make this error more explanitory
    if (err) {
      return process.exit(1); //Ensure the the database has loaded before continuing
    }



    //Step three load services TODO


    //Load permissions
    const permissionsHandler = require('./lib/permissionsHandler')(db);
    permissionsHandler.loadRoles(config.routes);

    const errorHandler = require ('./lib/error');
    const LoginHandler = require('./lib/loginHandler');
    const loginHandler = LoginHandler(db, errorHandler, permissionsHandler);
    //Load auth middleware
    const jwt = require ('./lib/jwt')(config.authentication);

    //Load graphql
    const schema = require ('./lib/rootSchemaBuilder')(config, db, errorHandler, permissionsHandler);

    //Load Graphql request parser

    const requestParser = (req, res, next) => {
      req.variables = {};
      req.operationName = '';
      try {
        let body = JSON.parse(req.body);
        req.body = body.query;
        req.variables = body.variables;
        req.operationName = body.operationName;
      } catch (err) {
        debug.log(err);
      } finally {
        next();
      }
    };

    const {graphql} = require('graphql');
    const graphqlExecute = (req, res, next) =>{
      graphql(schema, req.body,  req, null, req.variables, req.operationName).then(result => {
        req.result = result;
        if (req.result.errors){
          let err = errorHandler.errorHandler(result.errors);
          req.result.errors = err.errors;
        }

        next();
        // res.status(status).json(result);
      });
    }



    //Step four
    // initialise:
    // - express?
    // - socket

    const app = loadExpress({
      debug,
      jwt,
      loginHandler,
      errorHandler,
      permissionsHandler,
      requestParser,
      graphqlExecute,
    });

    const server = http.createServer(app).listen(3000);


    loadSocket(server,
      {
        debug,
        jwt,
        loginHandler,
        errorHandler,
        permissionsHandler,
        requestParser,
        graphqlExecute,
      }
    );



    //Step 5 run tests if applicable
    //Run tests

    return {
      db,
      schema
    };

  });









};
