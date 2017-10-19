const fs = require('fs');
const async = require('async');

module.exports = (config, db, callback) => {
  let models = [];
  //See if a model is needed for a resource, and if so load it into models
  for (let dir of config.routes) {
    for (let route of dir.routes) {
      let filePath = dir.rootDirectory + route;
      if (fs.existsSync(filePath + '/model.js')) {
        models = models.concat(require(filePath + '/model'));
      }
    }
  }

  //Build an array of dbloader queries to pass to async
  let asyncArray = [];
  for (let model of models) {
    asyncArray.push(
      (cb) => {
        db.cassandra.loadSchema(model.name, model.config, (err) => {cb(err);});
      }
    );
  }

  async.parallel(
    asyncArray,
    (err) => {
      callback(err);
    }
  );

};
