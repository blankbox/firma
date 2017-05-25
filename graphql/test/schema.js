const graphql = require('graphql')

const GraphQLObjectType = graphql.GraphQLObjectType
const GraphQLInt = graphql.GraphQLInt
const GraphQLBoolean = graphql.GraphQLBoolean
const GraphQLString = graphql.GraphQLString
const GraphQLList = graphql.GraphQLList
const GraphQLNonNull = graphql.GraphQLNonNull
const GraphQLSchema = graphql.GraphQLSchema


const TodoType = new GraphQLObjectType({
  name: 'todo',
  fields: () => ({
    id: {
      type: GraphQLInt,
      description: 'Todo id'
    },
    title: {
      type: GraphQLString,
      description: 'Task title'
    },
    completed: {
      type: GraphQLBoolean,
      description: 'Flag to mark if the task is completed'
    }
  })
});

module.exports = TodoType;
