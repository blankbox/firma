

const query = (config, root, args) => {

  const checkAuthType = (authConfig, keys) => {
    for (let key of keys) {
      if (typeof Object.keys(authConfig)[key] != 'undefined') {
        let err = root.user[key](authConfig[key]);
        if (err) {
          return err;
        }
      }
    }
  };

  return new Promise ((resolve, reject) => {

    let store = {};

    async.series({

      auth: (cb) => {
        if (typeof(config.auth) != 'undefined') {
          let err = checkAuthType(config.auth, Object.keys(config.auth));
          if (err) {
            cb (err);
          }
        }
        cb();
      },

      prePermissions: (cb) => {
        if (typeof(config.prePermissions) != 'undefined') {

        }

      },

      dbActions: (cb) => {

      },

      postPermissions: (cb) => {

      },

      postProcess: (cb) => {
        //Allow data reshape etc if needed
      },

    }, (err, results) => {
      if (err) {
        //TODO log err and results & query
        return reject(err);
      }
      return resolve(store.dbActions)
  });

  });

};



//
// const query = (config, root, args) => {
//
//   const checkAuthType = (authConfig, keys) => {
//     for (let key of keys) {
//       if (typeof Object.keys(authConfig)[key] != 'undefined') {
//         let err = root.user[key](authConfig[key]);
//         if (err) {
//           return err;
//         }
//       }
//     }
//   };
//
//
//
//
//   return new Promise ((resolve, reject) => {
//
//     if (typeof(config.auth) != 'undefined') {
//       let err = checkAuthType(config.auth, Object.keys(config.auth));
//       if (err) {
//         //RESOLVE with auth error status?
//         return reject(err);
//       }
//     }
//
//     root.user.getPermissionsAndUser(() => {
//       config.prePermissions(() => {
//         config.dbAction(() => {
//           config.postPermissions(() => {
//
//             resolve();
//           });
//         });
//       });
//     });
//
//   });
// };
//




//config
let config = {
  auth:{
    mustBeUser: true,
    mustBeLoggedIn: true,
    mustBeWebhook:true,
  },

  preParamsCheck: [
    {
      param,
      value,
      equality,
      error
    }
  ],

  prePermissions: (store, cb) => {

    [
      {
        permissions,
        possible,
        error
      }
    ]


    cb(err);
  },
  dbAction: (cb) => {
    cb(err, result);
  },
  postPermissions: (cb) => {
    cb(err);
  }

};


query(config);
