
module.exports = (models) => {
  return  models.loadSchema('User', {
     fields:{
         user_uid: {"type": "uuid"},
         first_name    : "text",
         last_name : "text",
         email     : "text",
         password_hash: "text",
         blocked: {"type":"boolean", "default":false}
     },
     key:["user_uid"],
     materialized_views: {
       user_by_email: {
         select: ["*"],
         key : ["email", "user_uid"],
       }
     },
   table_name: "user"
 });
}
