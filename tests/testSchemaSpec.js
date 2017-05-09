/* eslint-env node, mocha */

require('dotenv-safe').load('../.env');
const assert = require('assert');
const request = require('request');
let url = 'http://localhost:' + process.env.PORT + '/graphql';

let requestContent = {
  method: 'POST',
  uri: url,
  headers: {
    'Content-Type':'application/graphql'
  },
  body: ''
};


describe('Add todo:', () => {

  let response;
  before (done => {
    requestContent.body = 'mutation {add (title:"Say hello world") { title }}';
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

  it('returns \'Say hello world\'', () => {
    assert.equal('Say hello world', JSON.parse(response.body).data.add.pop().title);
  });
});

describe('Get todos:', () => {

  let response;
  before (done => {
    requestContent.body = 'query {todos { title, id }}';
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

  it('returns an array of todos', () => {
    assert.equal('[object Array]', Object.prototype.toString.apply(JSON.parse(response.body).data.todos));
  });
});

describe('Get schema:', () => {

  let response;
  before (done => {
    requestContent.body = '{__schema { mutationType {fields {name}}}}';
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

  it('returns a schema', () => {
    let keys = Object.keys(JSON.parse(response.body).data);
    assert.equal('__schema', keys[0]);
  });
});
