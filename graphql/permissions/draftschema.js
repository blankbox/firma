module.exports = (graphql) => {

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;
const GraphQLJSON = graphql.GraphQLJSON

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
