const graphql = require('graphql');

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;



const TimelineType = new GraphQLObjectType({
  name: 'timeline',
  fields: () => ({
    entity_id: {
      type: GraphQLString,
      description: 'UUID of entity that we want the timeline for'
    },
    event_type: {
      type: GraphQLString,
      description: 'Stringifyed array of event types'
    },
    numberOfEntries: {
      type: GraphQLInt,
      description: 'How many do you want?'
    },
    earliest: {
      type: GraphQLInt,
      description: 'Earliest date (UTC unix seconds)'
    },
    latest: {
      type: GraphQLInt,
      description: 'Latest date (UTC unix seconds)'
    },
    events:{
       type: GraphQLString ,
      description: 'The Events'
    },
  })
});

module.exports = TimelineType;
