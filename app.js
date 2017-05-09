require('dotenv-safe').load();

const express = require('express');
const logger = require('morgan');
const {graphql} = require('graphql')
const bodyParser = require('body-parser');

const schema = require ('./graphql/testSchema');

let app = express();

app.use(logger('dev'));

//TODO: API Key checked

//TODO: User key check??? <- do this in graphql?? (Needs to be optional)

// Get the body for the application/graphql mime-tyepe
app.use(bodyParser.text(
  { type: 'application/graphql' }
));

app.use ( (req, res, next) => {
  console.log(req.hostname)
  console.log(req.socket.remoteAddress);
  next();
});

app.post('/graphql', (req, res) => {
  graphql(schema, req.body).then(result => {
    req.result = result;
    res.send(req.result);
  });
});


// TODO:Basic error handling - needs work
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
