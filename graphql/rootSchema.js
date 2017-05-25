const {GraphQLSchema} = require('graphql');

const query = require( './rootQuery');
const mutation = require('./rootMutation');
// const subscription = require('./rootSubscription');

module.exports = new GraphQLSchema({query, mutation});
