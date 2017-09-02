module.exports = (graphql) => {

const GraphQLObjectType = graphql.GraphQLObjectType;

const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;

  return  new GraphQLObjectType({
    name: 'permissions',
    fields: () => ({
      login_uid: {
        type: GraphQLString,
        description: 'Login UUID'
      },
      entity_uid:{
        type: GraphQLString,
        description: 'Entity UUID'
      },
      possible_permissions: {
        type: GraphQLList,
        description: 'Roles'
      },
      possible_roles: {
        type: GraphQLList,
        description: 'Roles'
      },
      add_permissions: {
        type: GraphQLList,
        description: 'Roles'
      },
      add_roles: {
        type: GraphQLList,
        description: 'Roles'
      },
      remove_permissions: {
        type: GraphQLList,
        description: 'Roles'
      },
      remove_roles: {
        type: GraphQLList,
        description: 'Roles'
      },
    })
  });

}
