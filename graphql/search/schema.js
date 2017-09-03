
module.exports = (graphql, resolvers) => {

  let types = resolvers.map(a => graphql.schema[a.schema]);

  const resolveType = (data) => {
    for (let r of resolvers) {
      if (data[r.identifier]) {
        return (graphql.schema[r.schema]);
      }
    }
  };

  return [
    new graphql.GraphQLUnionType({
      name: 'search',
      types: types,
      resolveType: resolveType
    })
  ];
};
