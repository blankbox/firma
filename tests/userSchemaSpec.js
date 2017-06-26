/* eslint-env node, mocha */

require('dotenv-safe').load('../.env');
const assert = require('assert');
const request = require('request');
let url = 'http://localhost:' + process.env.PORT + '/graphql';

let requestContent = {
  method: 'POST',
  uri: url,
  headers: {
    'Content-Type':'application/graphql',
    'user_token':'foo'
  },
  body: ''
};

let data;
let pass = 'test123';

describe ('Users', () => {
  describe('Create user:', () => {

    let response;
    before (done => {
      requestContent.body = `
        mutation {
          createUser (
            email:"test@goo.bar",
            password:"` + pass + `"
          ) {
            email,
            user_uid,
            password
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
      assert.equal('test@goo.bar', data.email);
    });
  });

  describe('Login user:', () => {

    let response;
    before (done => {
      requestContent.body = `
        mutation {
          login (
            email:"test@goo.bar",
            password:"` + pass + `"
          ) {
            email,
            user_uid,
            user_token
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
      assert.equal('test@goo.bar', data.email);
    });
  });




  xdescribe('Get all users:', () => {

    let response;
    before (done => {
      requestContent.body = 'query {queryUser { user_uid }}';
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

    it('returns an array of users', () => {
      assert.equal('[object Array]', Object.prototype.toString.apply(JSON.parse(response.body).data.user));
    });
  });


  describe('Delete user:', () => {

    let response;
    before (done => {
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
      assert.equal(data.email, JSON.parse(response.body).data.deleteUser.pop().email);
    });
  });




  xdescribe('Get user 0:', () => {

    let response;
    before (done => {
      requestContent.body = 'query {user(queryUser:0) { email }}';
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

    it('returns a single user', () => {
      assert.equal(1, JSON.parse(response.body).data.user.length);
    });
  });

});
