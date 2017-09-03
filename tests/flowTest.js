/* eslint-env node, mocha */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const assert = require('assert');
const request = require('request');
const uuid = require('uuid/v1');

let url = 'http://localhost:' + 3000 + '/graphql';
// let url = 'https://vybe-dev.blankbox.co.uk/graphql'//'http://localhost:' + 3000 + '/graphql';

let requestContent = {
  method: 'POST',
  uri: url,
  headers: {
    'Content-Type':'application/graphql'
  },
  body: ''
};

let cert = fs.readFileSync('./vybe_test.pub', 'utf8');
let audience = 'vybe_dev';
let user_token;
let email;
let newEmail;

jwt.sign({ foo: 'bar' }, cert,  {
  audience:audience,
  subject:audience +':' + uuid(),
  expiresIn: '1h'
}, function(err, token) {
  user_token = token;
  email = user_token.slice(-8) + '@foo.bar';
  newEmail = user_token.slice(-8) + '@foo.new';
});

let data;
let uid;



describe ('Flow', () => {
  describe('Register login - no token', () => {
    let response;
    before (done => {
      requestContent.body = `
        mutation {
          registerLogin {
            login_uid
          }
        }`;
      request(requestContent, (error, res) => {
        if (!error) {
          console.log(res.body);
          response = res;
          done();
        }
      });
    });

    it('returns 40x', () => {
      assert.equal(401, response.statusCode);
    });

    it('returns error ', () => {
      let d = JSON.parse(response.body).errors.pop();
      assert.equal("User token is missing", d.message);
    });

  });


  describe('Register login', () => {
    let response;
    before (done => {
      requestContent.headers['user_token'] = user_token;
      requestContent.body = `
        mutation {
          registerLogin {
            login_uid,
            permissions
          }
        }`;
      request(requestContent, (error, res) => {
        console.log(error);
        if (!error) {
          console.log(res.body);
          response = res;
          done();
        }
      });
    });

    it('returns 200', () => {
      assert.equal(200, response.statusCode);
    });

    it('returns login_uid ', () => {
      data =  JSON.parse(response.body).data.registerLogin.pop();
      assert.ok(data.login_uid);
    });

  });

  describe('Register login - try 2 should fail', () => {
    let response;
    before (done => {
      requestContent.headers['user_token'] = user_token;
      requestContent.body = `
        mutation {
          registerLogin {
            login_uid
          }
        }`;
      request(requestContent, (error, res) => {
        if (!error) {
          console.log(res.body);
          response = res;
          done();
        }
      });
    });

    it('returns 40x', () => {
      assert.equal(403, response.statusCode);
    });

    it('returns error ', () => {
      data =  JSON.parse(response.body).errors;
      assert.ok(data);
    });

  });

  describe('Create user:', () => {

    let response;
    before (done => {
      requestContent.headers['user_token'] = user_token;
      requestContent.body = `
        mutation {
          createUser (
            email:"` + email + `"
          ) {
            email,
            user_uid
          }
        }`;
      request(requestContent, (error, res) => {
        if (!error) {
          console.log(res.body);
          response = res;
          done();
        }
      });
    });

    it('returns 200', () => {
      assert.equal(200, response.statusCode);
    });

    it('returns email ', () => {
      data =  JSON.parse(response.body).data.createUser.pop();
      assert.equal(email , data.email);
      uid = data.user_uid;
    });
  });

  describe('Query a user by email:', () => {

    let response;
    before (done => {
      requestContent.headers['user_token'] = user_token;
      requestContent.body = `
        query {
          queryUserByEmail (
            email:"` + email + `"
          ) {
            email,
            user_uid
          }
        }`;
      request(requestContent, (error, res) => {
        if (!error) {
          console.log(res.body)
          response = res;
          done();
        }
      });
    });

    it('returns 200', () => {
      assert.equal(200, response.statusCode);
    });

    it('returns email ', () => {
      let d =  JSON.parse(response.body).data.queryUserByEmail.pop();
      assert.equal(data.email, d.email);
    });
  });


  describe('Query a user by uid:', () => {

    let response;
    before (done => {
      requestContent.headers['user_token'] = user_token;
      requestContent.body = `
        query {
          queryUserByUid (
            user_uid:"` + uid + `"
          ) {
            email,
            user_uid
            deleted
          }
        }`;
      request(requestContent, (error, res) => {
        if (!error) {
          console.log(res.body)
          response = res;
          done();
        }
      });
    });

    it('returns 200', () => {
      assert.equal(200, response.statusCode);
    });

    it('returns email ', () => {
      let d =  JSON.parse(response.body).data.queryUserByUid.pop();
      assert.equal(data.email, d.email);
    });
  });

  describe('Update user:', () => {
    let response;
    before (done => {
      requestContent.headers['user_token'] = user_token;
      requestContent.body = `
        mutation {
          updateUser (
            email:"` + newEmail + `",
            first_name: "Bob",
            last_name: "Test",
          ) {
            email,
            first_name,
            last_name,
            user_uid,
            blocked,
            private
          }
        }`;
      request(requestContent, (error, res) => {
        if (!error) {
          console.log(res.body);
          response = res;
          done();
        }
      });
    });

    it('returns 200', () => {
      assert.equal(200, response.statusCode);
    });

    it('returns new email ', () => {
      let d = JSON.parse(response.body).data.updateUser.pop();
      assert.equal(newEmail, d.email);
    });
  });

  describe('Delete user:', () => {

    let response;
    before (done => {
      requestContent.headers['user_token'] = user_token;
      requestContent.body = `
        mutation {
          deleteUser (
            user_uid:"` + uid + `"
          ) {
            email
          }
        }`;
      request(requestContent, (error, res) => {
        if (!error) {
          console.log(res.body);
          response = res;
          done();
        }
      });
    });

    it('returns 200', () => {
      assert.equal(200, response.statusCode);
    });

    it('returns email ', () => {
      let d = JSON.parse(response.body).data.deleteUser.pop();
      assert.equal(newEmail, d.email);
    });
  });

  describe('Query a user by uid:', () => {

    let response;
    before (done => {
      requestContent.headers['user_token'] = user_token;
      requestContent.body = `
        query {
          queryUserByUid (
            user_uid:"` + uid + `"
          ) {
            email,
            user_uid
            deleted
          }
        }`;
      request(requestContent, (error, res) => {
        if (!error) {
          console.log(res.body)
          response = res;
          done();
        }
      });
    });

    it('returns 200', () => {
      assert.equal(200, response.statusCode);
    });

    it('returns email ', () => {
      let d =  JSON.parse(response.body).data.queryUserByUid.pop();
      assert.equal(newEmail, d.email);
    });
  });

});
