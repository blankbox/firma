const graphql = require('graphql');

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;

const TimelineType = require ('./schema');

module.exports = {
  queryTimeline: {
    type: new GraphQLList(TimelineType),
    description:'Foo',
    args:{
      entity_id: {
        type: new GraphQLNonNull(GraphQLString),
        name: 'Entity Uuid'
      },
      event_type: {
        name: 'Stringifyed array of event types',
        type: GraphQLString
      },
      numberOfEntries: {
        name: 'number of entries',
        type: GraphQLInt
      },
      earliest: {
        name: 'earliest',
        type: GraphQLInt
      },
      latest: {
        name: 'latest',
        type: GraphQLInt
      }
    },
    resolve: (root, args) => {
      const PubErr = root.errorHandler.PublicError;
      const PriErr = root.errorHandler.PrivateError;
      return new Promise ((resolve, reject) =>{
        root.user.mustBeUser(true);
        resolve ([])
      });
    }
  }
}
