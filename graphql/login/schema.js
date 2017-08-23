
module.exports = (graphql) => {

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;
const GraphQLJSON = graphql.GraphQLJSON

return [
  new GraphQLObjectType({
    name: 'login',
    fields: () => ({
      login_uid: {
        type: GraphQLString,
        description: 'Login UUID'
      },
      blocked: {
        type: GraphQLBoolean,
        description: 'Flag to mark if the user is blocked'
      },
      user_uid: {
        type: GraphQLString,
        description: 'Login UUID'
      },
      permissions: {
        type: GraphQLJSON,
        description: 'Roles'
      }
    })
  })
]
}
