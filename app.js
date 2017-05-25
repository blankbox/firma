require('dotenv-safe').load();

const express = require('express');
const logger = require('morgan');
const {graphql} = require('graphql')
const bodyParser = require('body-parser');
const schema = require ('./graphql/rootSchema');


let app = express();

app.use(logger('dev'));

// TODO: User key check - pass to graphql as 'root' in resolve
app.use( (req, res, next) => {
  req.jwt = {id:'dummy JWT'}
  next()
});

// Get the body for the application/graphql mime-type
app.use(bodyParser.text(
  { type: 'application/graphql' }
));



app.post('/graphql', (req, res) => {

  graphql(schema, req.body,  req.jwt).then(result => {
    req.result = result;
    //TODO extend this to handle errors based on the schema
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Error
    if (req.result.errors){
      //Don't expose graphql errors to clients - add error handler
      console.log(req.result.errors); //TODO add proper logging
      res.status(400).send('An error happened');
    } else {
      res.send(req.result);
    }
  });
});



// TODO:Basic http error handling - needs work
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// TODO:Basic error handling - needs work
app.use(function(err, req, res) {
  // send the  page
  res.status(err.status || 500);
  res.send(err.message || 'err');
});

app.listen(process.env.PORT);
console.log('Running a GraphQL API server at localhost:' + process.env.PORT+ '/graphql');
