module.exports = (graphql) => {

  const GraphQLObjectType = graphql.GraphQLObjectType;
  const GraphQLInt = graphql.GraphQLInt;
  const GraphQLBoolean = graphql.GraphQLBoolean;
  const GraphQLString = graphql.GraphQLString;
  const GraphQLList = graphql.GraphQLList;
  const GraphQLNonNull = graphql.GraphQLNonNull;

  return new GraphQLObjectType({
    name: 'user',
    fields: () => ({
      user_uid: {
        type: GraphQLString,
        description: 'User UUID'
      },
      email: {
        type: GraphQLString,
        description: 'Email'
      },
      first_name: {
        type: GraphQLString,
        description: 'First name'
      },
      last_name: {
        type: GraphQLString,
        description: 'Last name'
      },
      blocked: {
        type: GraphQLBoolean,
        description: 'Flag to mark if the user is blocked'
      }
    })
  });
}
