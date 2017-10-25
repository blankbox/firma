const {graphql} = require('graphql');

module.exports = (debug, errorHandler, schema) => {

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

  const graphqlExecute = (main, req, res, next) =>{
    graphql(schema, req.body,  main, null, req.variables, req.operationName).then(result => {
      req.status = 200;
      req.result = result;
      if (req.result.errors){
        let err = errorHandler.errorHandler(result.errors);
        req.result.errors = err.errors;
        req.status = err.status;
      }
      next();
    });
  };


  return {
    requestParser,
    graphqlExecute
  };
};
