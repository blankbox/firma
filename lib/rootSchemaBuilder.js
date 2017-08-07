
const graphql = require('graphql');

const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLSchema = graphql.GraphQLSchema;

module.exports = (config) => {

  let config = [
    {
      roots:[],
      dir:''
    },
    {
      roots:[],
      dir:''
    }
  ]

  console.log(modelRoute);

  let queryObject  = {};
  let mutationObject = {};



//TODO add error handling for routes that are query only (i.e. can't add mutation)
  for (let r of routes.queryArray) {
    Object.assign(queryObject, require(r + '/query'));
  }

  for (let r of routes.mutationArray) {
    Object.assign(mutationObject, require(r + '/mutation'));
  }

  const query = new GraphQLObjectType({
    name: 'RootQuery',
    fields: () => queryObject
  });

  const mutation =  new GraphQLObjectType({
    name: 'RootMutation',
    fields: () => mutationObject
  });

  return new GraphQLSchema({query, mutation});
}


const buildFQRouteArray = (config) => {
  let queryArray = [];
  let mutationArray = [];

  for (dir of config) {
    for (r of dir.roots)
    let file = dir.dir + r;
    if (fs.existsSync(file + '/query.js') {
      queryArray.push(file);
    }
    if (fs.existsSync(file + '/mutation.js') {
      mutationArray.push(file);
    }

  }

  return {
    q:queryArray,
    m:mutationArray
  };
}
