// Client code
const jwt = require('jsonwebtoken');
const fs = require('fs');
const uuid = require('uuid/v1');


let cert = fs.readFileSync('./vybe_test.pub', 'utf8');
let audience = 'vybe_dev';
let user_token;
let email;
let user_name;
let first_name = 'Bob';
let last_name = 'Test';
jwt.sign({ foo: 'bar' }, cert,  {
  audience:audience,
  subject:audience +':' + uuid(),
  expiresIn: '1h'
}, function(err, token) {
  user_token = token;
  email = user_token.slice(-8) + '@foo.bar';
  user_name = email;
});

const socketCluster = require('socketcluster-client');

const options = {
  port:3000,
  hostname:'localhost',
};

let socket = socketCluster.connect(options);

const socketRequest = (query, response) => {

  socket.emit('graphql', {body: query}, (err, result) => {
    if (err) {
      //Do something
    }

    response(result);
  });
};


socket.on('error', (err,  cb) => {
  console.log(err.code);
  if (err.code != 1000) {
    socket = socketCluster.connect(options);
  }
});

socket.on('connect', (status) => {

  if (!status.isAuthenticated) {

    socket.emit('login', {headers:{user_token}}, (err) => {
      if (err) {
        console.log(err);
        // Do something
      } else {
        let query = `
        mutation {
          registerLogin {
            login_uid
          },
          createUser (
            user_name:"${user_name}"
            email:"${email}"
            first_name: "${first_name}"
            last_name:"${last_name}"
          ) {
            user_uid
          },
        }

       `;


        socketRequest(
          query,
          (result) => {
            process.stdout.write(JSON.stringify(result));
            if(result.errors) {
              process.stdout.write(JSON.stringify(result.errors));
            }

            let myNotifications = socket.subscribe(result.data.createUser[0].user_uid);

            myNotifications.on('subscribeFail', function (err, channelName) {
              console.log(err);
              console.log(channelName);

              // Handle subscribe failure
            });

            myNotifications.watch((data) => {
              console.log('data', data);
            });

            socket.publish(result.data.createUser[0].user_uid, 'lo');
          }
        );
      }

    });
  }
});
