const _ = require ('underscore');

module.exports = (graphql, db, errorHandler, permissionsHandler, config) => {

  const resolvers = config.search.resolvers;

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

    db.redis.hscan('text_hash', index, 'MATCH', text + '*', (err, result) => {
      out = out.concat(result[1]);
      if (result[0] == '0' || redisRecursions > 10) { //Allow a maximum of 10 cycles
        cb(err, out);
      } else {
        redisRecursions ++;
        redisIterator(result[0], text, out, cb);
      }
    });
  };

  let cassandraIterator = (user, dataIn, dataOut, cb) => {
    let data = dataIn.pop();
    let resolver = data.resolver;
    db.cassandra.instance[resolver.cassandra_model].find(
      {[resolver.identifier]:{'$in':data.uids}},
      {raw: true},
      (err, results) => {
        data.err = err;
        let res = [];
        for (let row of results) {
          if (resolver.hasPermission(user, checkPermissions,
            { [resolver.identifier]:row[resolver.identifier] }) ) {
            res.push(row);
          }
        }
        data.results = res;
        dataOut.push(data);
        if(dataIn.length) {
          cassandraIterator(user, dataIn, dataOut, cb);
        } else {
          cb(dataOut);
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

          redisRecursions = 0;
          redisIterator(0, '*:' + args.text, [], (err, res) => {

            let data = {};
            let results = [];
            for (let i = 1; i < res.length; i +=2) {
              results.push(res[i]);
            }

            for (let rj of results) {
              let r = JSON.parse(rj);

              if (!data[r.type]){
                data[r.type] = {
                  uids:[],
                  resolver: _.find(resolvers, (s) => {
                    return s.schema == r.type;
                  })
                };
              }
              data[r.type].uids.push(db.cassandra.uuidFromString(r.uid));
            }

            let dataIn = [];
            for (let o of Object.keys(data)) {
              dataIn.push(data[o]);
            }
            cassandraIterator(root.user, dataIn, [], (dataOut) => {
              let out = dataOut.map(a => a.results);
              let err = dataOut.map(a => a.err);
              if (err) {
                for (let e of err) {
                  if (typeof(e) != 'undefined') {
                    new PrivateError('CassandraError', err, 500);
                  }
                }
              }
              return resolve(_.flatten(out));
            });
          });

        });
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
        radius:{
          type: new GraphQLNonNull(
              GraphQLFloat
          ),
          description: 'Radius in miles'
        }
      },
      resolve: (root, args, ast , info) => {

        return new Promise ((resolve, reject) => {
          root.user.mustBeUser(true);

          const permissions = root.user.permissions[info.fieldName];
          let possible = _.flatten(['ALL']);
          if (!checkPermissions(permissions, possible)) {
            return reject( new PublicError('VenueError', 'You cannot read these rooms', 403));
          }

          db.redis.GEORADIUS('geo_hash', args.long, args.lat, args.radius, 'mi', (err, res) => {

            let data = {};
            for (let rj of res) {
              let r = JSON.parse(rj);
              if (!data[r.type]){
                data[r.type] = {
                  uids:[],
                  resolver: _.find(resolvers, (s) => {
                    return s.schema == r.type;
                  })
                };
              }
              data[r.type].uids.push(db.cassandra.uuidFromString(r.uid));
            }

            let dataIn = [];
            for (let o of Object.keys(data)) {
              dataIn.push(data[o]);
            }

            cassandraIterator(root.user, dataIn, [], (dataOut) => {
              let out = dataOut.map(a => a.results);
              let err = dataOut.map(a => a.err);
              if (err) {
                for (let e of err) {
                  if (typeof(e) != 'undefined') {
                    //TODO workout how to capture these
                    // new PrivateError('CassandraError', err, 500);
                  }
                }
              }
              return resolve(_.flatten(out));
            });
          });
        });
      }
    },
    uid_search:{
      type: new GraphQLList(SearchType),
      description: 'Search by uid',
      args: {
        uid:{
          type: new GraphQLNonNull(
              GraphQLString
          )
        }
      },
      resolve: (root, args, ast , info) => {

        return new Promise ((resolve, reject) => {
          root.user.mustBeUser(true);

          const permissions = root.user.permissions[info.fieldName];
          let possible = _.flatten(['ALL', args.uid]);

          if (!checkPermissions(permissions, possible)) {
            return reject( new PublicError('SearchError', 'You cannot find this', 403));
          }

          redisIterator(0, args.uid + ':*', [], (err, result) => {

            if (err) {
              return reject( new PrivateError('SearchError', err, 500));
            }
            if (!result.length) {
              return resolve([]);
            }
            let res = JSON.parse(result[1]);
            let type = res.type;
            let resolver = _.find(resolvers, (s) => {
              return s.schema == type;
            });

            if (!resolver.hasPermission(root.user, checkPermissions,
              {[resolver.identifier]: res.uid}
            )){
              return reject( new PublicError('SearchError', 'You cannot find this', 403));
            }

            db.cassandra.instance[resolver.cassandra_model].findOne(
              {[resolver.identifier]: db.cassandra.uuidFromString(res.uid)},
              {raw: true}, (err, res) => {
                if (err) {
                 return reject( new PrivateError('CassandraError', err, 500));
                }
                resolve([res]);
              }
            );

          });

        });
      }
    },

  };
};
