const graphql = require('graphql')

const GraphQLObjectType = graphql.GraphQLObjectType
const GraphQLInt = graphql.GraphQLInt
const GraphQLBoolean = graphql.GraphQLBoolean
const GraphQLString = graphql.GraphQLString
const GraphQLList = graphql.GraphQLList
const GraphQLNonNull = graphql.GraphQLNonNull
const GraphQLSchema = graphql.GraphQLSchema

const TodoType = require ('./schema');
let TODOs = require ('./store');


module.exports = {
  todos: {
    type: new GraphQLList(TodoType),
    resolve: (root, args) => {
      return TODOs
    }
  }

};
