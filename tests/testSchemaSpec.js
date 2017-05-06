var assert = require('assert');
var request = require('request');
var url = 'http://localhost:' + process.env.PORT + '/graphql';

var requestContent = {
	method: 'POST',
	uri: url,
	headers: {
		'Content-Type':'application/graphql'
	},
	body: ''
};
require('dotenv-safe').load('../.env');


describe('Add todo:', function() {

	var response;
	before (function(done) {
		requestContent.body = 'mutation {add (title:"Say hello world") { title }}';
		request(requestContent, function(error, res, body) {
			if (!error) {
				response = res;
				done();
			}
		});
	});

	it('returns 200', function() {
		assert.equal(200, response.statusCode);
	});

	it('returns \'Say hello world\'', function() {
		assert.equal('Say hello world', JSON.parse(response.body).data.add.pop().title);
	});
});

describe('Get todos:', function() {

	var response;
	before (function(done) {
		requestContent.body = 'query {todos { title, id }}';
		request(requestContent, function(error, res, body) {
			if (!error) {
				response = res;
				done();
			}
		});
	});

	it('returns 200', function() {
		assert.equal(200, response.statusCode);
	});

	it('returns an array of todos', function() {
		assert.equal('[object Array]', Object.prototype.toString.apply(JSON.parse(response.body).data.todos));
	});
});
