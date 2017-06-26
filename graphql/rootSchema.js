
const graphql = require('graphql');

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLSchema = graphql.GraphQLSchema;

module.exports = (routes, db, errorHandler) => {

  require('./user/model')(db.cassandra);



  const query = new GraphQLObjectType({
    name: 'RootQuery',
    fields: () => Object.assign({},
      require('./user/query')(db, errorHandler)
    )
  });


  const mutation =  new GraphQLObjectType({
    name: 'RootMutation',
    fields: () => Object.assign({},
      require('./user/mutation')(db, errorHandler)
    )
  });

    return new GraphQLSchema({query, mutation});
}
