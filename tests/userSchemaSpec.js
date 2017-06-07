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


describe ('Users', () => {
  describe('Add user:', () => {

    let response;
    before (done => {
      requestContent.body = `
      mutation {
        addUser (
          email:"test@too.bar",
          password:"test"
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
      assert.equal('test@too.bar', JSON.parse(response.body).data.addUser.pop().email);
    });
  });

  describe('Get users:', () => {

    let response;
    before (done => {
      requestContent.body = 'query {user { user_uid }}';
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

  describe('Get user 0:', () => {

    let response;
    before (done => {
      requestContent.body = 'query {user(user_uid:0) { email }}';
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
