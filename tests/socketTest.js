// Client code
const jwt = require('jsonwebtoken');
const fs = require('fs');
const uuid = require('uuid/v1');


let cert = fs.readFileSync('./vybe_test.pub', 'utf8');
let audience = 'vybe_dev';
let user_token;
let email;

jwt.sign({ foo: 'bar' }, cert,  {
  audience:audience,
  subject:audience +':' + uuid(),
  expiresIn: '1h'
}, function(err, token) {
  user_token = token;
  email = user_token.slice(-8) + '@foo.bar';
});

const socketCluster = require('socketcluster-client');

const options = {
  port:3000,
  hostname:'localhost',
};

const socket = socketCluster.connect(options);

//Socket request:
//{
  // headers:{},
  // body{},
//}

const socketRequest = (query, response) => {
  socket.emit('graphql', {body: query}, (err, result) => {
    if (err) {
      //Do something
    }

    response(result);
  });
};

socket.on('connect', (status) => {

  if (!status.isAuthenticated) {

    socket.emit('login', {headers:{user_token}}, (err) => {
      if (err) {
        // Do something
      } else {
        socketRequest(
          `mutation {
            registerLogin {
              login_uid
            },
            createUser (
              email:"` + email + `"
            ) {
              email,
              user_uid
            },
            updateUser (
             first_name: "Bob"
             last_name:"TEST"
           ) {
             first_name,
             last_name
           }
          }`,
           (result) => {

            process.stdout.write(JSON.stringify(result.data));
            if(result.errors) {
              process.stdout.write(JSON.stringify(result.errors));
            }

          }
        );
      }

    });
  }
});