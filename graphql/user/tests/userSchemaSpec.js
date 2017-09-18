/* eslint-env node, mocha */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const assert = require('assert');
const request = require('request');
const uuid = require('uuid/v1');

let url = 'http://localhost:' + 3000 + '/graphql';

let requestContent = {
  method: 'POST',
  uri: url,
  headers: {
    'Content-Type':'application/graphql'
  },
  body: ''
};

let data;
let pass = 'test123';
let email = 'test@foo.bar';
let newEmail = 'foo@new.test';

let cert = fs.readFileSync('./vybe_test.pub', 'utf8');
let audience = 'vybe_dev';
let user_token;

jwt.sign({ foo: 'bar' }, cert,  {
  audience:audience,
  subject:audience +':' + uuid(),
  expiresIn: '1h'
},function(err, token) {
  user_token = token;
});

xdescribe ('Users', () => {

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
    });
  });

  xdescribe('Login user:', () => {

    let response;
    before (done => {
      requestContent.body = `
        mutation {
          login (
            email:"` + data.email + `",
            password:"` + pass + `"
          ) {
            email,
            user_uid,
            user_token
          }
        }`;
      request(requestContent, (error, res) => {
        if (!error) {
          response = res;
          done();
        }
      });
    });

    it('returns 200', () => {
      assert.equal(200, response.statusCode);
    });

    it('returns email ', () => {
      let d =  JSON.parse(response.body).data.login.pop();
      assert.equal(d.email, data.email);
      data.user_token = d.user_token;
    });
  });


  describe('Select a user:', () => {

    let response;
    before (done => {
      requestContent.headers['user_token'] = user_token;
      requestContent.body = `
        query {
          queryUser (
            email:"` + email + `"
          ) {
            email,
            user_uid
          }
        }`;
      request(requestContent, (error, res) => {
        if (!error) {
          response = res;
          done();
        }
      });
    });

    it('returns 200', () => {
      assert.equal(200, response.statusCode);
    });

    it('returns email ', () => {
      let d =  JSON.parse(response.body).data.queryUser.pop();
      assert.equal(data.email, d.email);
    });
  });

  describe('Update user:', () => {
    let response;
    before (done => {
      requestContent.headers['user_token'] = data.user_token;
      requestContent.body = `
        mutation {
          updateUser (
            email:"` + newEmail + `",
            first_name: "Bob",
            last_name: "Test",
            password: "` + pass + `",
            new_password: "newP"
          ) {
            email,
            first_name,
            last_name,
            user_uid,
            blocked
          }
        }`;
      request(requestContent, (error, res) => {
        if (!error) {
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


  xdescribe('Get all users:', () => {

    let response;
    before (done => {
      requestContent.body = 'query {queryUser { user_uid }}';
      request(requestContent, (error, res) => {
        if (!error) {
          response = res;
          done();
        }
      });
    });

    it('returns 200', () => {
      assert.equal(200, response.statusCode);
    });

    it('returns an array of users', () => {
      assert.equal('[object Array]', Object.prototype.toString.apply(JSON.parse(response.body).data.user));
    });
  });


  describe('Delete user:', () => {

    let response;
    before (done => {
      requestContent.headers['user_token'] = data.user_token;
      requestContent.body = `
        mutation {
          deleteUser (
            user_uid:"` + data.user_uid + `"
          ) {
            email
          }
        }`;
      request(requestContent, (error, res) => {
        if (!error) {
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

});
