const _ = require ('underscore');

module.exports = (graphql, db, errorHandler, permissionsHandler, searchConf) => {

  const resolvers = searchConf.resolvers;

  const checkPermissions = permissionsHandler.checkPermissions;
  const PublicError = errorHandler.PublicError;
  const PrivateError = errorHandler.PrivateError;

  const GraphQLString = graphql.GraphQLString;
  const GraphQLList = graphql.GraphQLList;
  const GraphQLNonNull = graphql.GraphQLNonNull;
  const GraphQLFloat = graphql.GraphQLFloat;

  const SearchType = graphql.schema.search;

  let redisRecursions = 0;
  let redisIterator = (index, text, out, cb) => {

    db.redis.hscan('text_hash', index, 'MATCH', '*:' + text + '*', (err, result) => {
      out = out.concat(result[1]);
      if (result[0] == "0" || redisRecursions > 10) { //Allow a maximum of 10 cycles
        cb(err, out);
      } else {
        redisRecursions ++;
        redisIterator(result[0], text, out, cb);
      }
    });
  };

  return {
    //TODO this needs to cope with paging
    text_search:{
      type: new GraphQLList(SearchType),
      description: 'Search for item',
      args: {
        text:{
          type: new GraphQLNonNull(
              GraphQLString
          )
        },
      },
      resolve: (root, args, ast , info) => {

        return new Promise ((resolve, reject) => {
          root.user.mustBeUser(true);


          const permissions = root.user.permissions[info.fieldName];
          let possible = _.flatten(['ALL', root.user.userUid]);
          if (!checkPermissions(permissions, possible)) {
            return reject( new PublicError('SearchError', 'You cannot search by text', 403));
          }

          redisIterator(0, args.text, [], (err, result) => {

            if (err) {
              return reject( new PrivateError('SearchError', err, 500));
            }

            let data = [];

            for (let i = 1; i < result.length; i += 2) {
              let res = JSON.parse(result[i]);
              let type = res.type;
              let resolver = _.find(resolvers, (s) => {
                return s.schema == type;
              })

              if (resolver.hasPermission(root.user, checkPermissions, res.data)){
                data.push(res.data);
              }
            }
            resolve(data)
          });

        })
      }
    },
    location_search:{
      type: new GraphQLList(SearchType),
      description: 'Search for item',
      args: {
        lat:{
          type: new GraphQLNonNull(
              GraphQLFloat
          )
        },
        long:{
          type: new GraphQLNonNull(
              GraphQLFloat
          )
        },
      },
      resolve: (root, args, ast , info) => {

        return new Promise ((resolve, reject) => {
          root.user.mustBeUser(true);

          const permissions = root.user.permissions[info.fieldName];
          let possible = _.flatten(['ALL', args.room_uids]);
          if (!checkPermissions(permissions, possible)) {
            return reject( new PublicError('VenueError', 'You cannot read these rooms', 403));
          }


        })
      }
    },

  }
}
