const async = require('async');
//TODO add second schema for user->token table_name


//TODO update clustering order to return most recent first

 module.exports = (models) => {
  async.series([
    (callback) => {
      models.loadSchema('Timeline', {
        fields:{
          entity_id: {"type": "uuid"},
          entity_type: "text",
          event_id: {"type": "timeuuid"},
          event_type    : "text",
          event_detail : "text",
          private: {"type":"boolean", "default":true}
        },
        key:["entity_id", "event_id"],
        table_name: "event_by_entity",
        indexes:["event_type"]
      });
      callback(null, models)
    }

  ],
  (err, models) => {
    return models;
  });
}
