const fs = require('fs');

module.exports = (config, db) => {
  for (let dir of config) {

    for (let r of dir.routes) {
      let file = dir.rootDirectory + r;
      if (fs.existsSync(file + '/model.js')) {
        require(file + '/model')(db.cassandra);
      }
    }
  }
}
