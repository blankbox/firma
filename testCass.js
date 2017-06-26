const models = require ('./helpers/cassandra')({});


models.connect(function (err) {
    if (err) throw err;

    const UserModel = models.loadSchema('Person', {
        fields:{
            user_uid: {"type": "uuid", "default": {"$db_function": "uuid()"} },
            name    : "text",
            surname : "text",
            age     : "int"
        },
        key:["user_uid"],
        materialized_views: {
          view_name1: {
            select: ["*"],
            key : ["name"],
          }
        },
      table_name: "my_custom_table_name"

    },

    function(err, UserModel){
      if (err) {
        console.log(err);
      }

        // the table in cassandra is now created
        //the models.instance.Person, UserModel or MyModel can now be used
        // console.log(models.instance.Person);
        // console.log(models.instance.Person === UserModel);
        // console.log(models.instance.Person === MyModel);
        //
        // let john = new models.instance.Person({
        //     name: "Jon",
        //     surname: "Doe",
        //     age: 32
        // });
        // john.save(function(err){
        //     if(err) {
        //         console.log(err);
        //         return;
        //     }
        //     console.log('Yuppiie!');
        // });
        //
        //
        // models.instance.Person.findOne({name: 'John'}, { materialized_view: 'view_name1', raw: true }, function(err, john){
        //     if(err) {
        //         console.log(err);
        //         return;
        //     }
        //     //Note that returned variable john here is an instance of your model,
        //     //so you can also do john.delete(), john.save() type operations on the instance.
        //     console.log('Found ' + john.name + ' to be ' + john.age + ' years old!');
        // });
        //

    });
});

//
