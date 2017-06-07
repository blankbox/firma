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


describe ('Graphql', () => {
  describe('Get schema:', () => {

    let response;
    before (done => {
      requestContent.body = '{__schema { mutationType {fields {name}}}}';
      request(requestContent, (error, res) => {
        if (!error) {
          response = res;
          console.log(res.body);
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
});
