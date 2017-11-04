

const socketClusterServer = require('socketcluster-server');

const jwt = require ('./jwt');
const userHandler = require('./userHandler');

module.exports = ({
  server,
  config,
  db,
  LoginHandler,
  errorHandler,
  permissionsHandler,
  graphqlHandler,
  debug
}) => {

  const scServer = socketClusterServer.attach(server);

  // const socketDeny = (req, next) => {
  //   let err = {
  //     httpCode: 401,
  //     message: 'You can\'t do that',
  //     errorCode: 1234,
  //     errorType: 'permissions'
  //   }
  //    next(err);
  // };

  scServer.on('connection', (socket) => {

//     scServer.MIDDLEWARE_HANDSHAKE
// scServer.MIDDLEWARE_SUBSCRIBE
// scServer.MIDDLEWARE_PUBLISH_IN
// scServer.MIDDLEWARE_PUBLISH_OUT
// scServer.MIDDLEWARE_EMIT
    //
    // scServer.addMiddleware(scServer.MIDDLEWARE_PUBLISH_IN, socketDeny);
    //
    // scServer.addMiddleware(scServer.MIDDLEWARE_PUBLISH_OUT, socketDeny);

    scServer.addMiddleware(scServer.MIDDLEWARE_SUBSCRIBE, (req, next) => {
      req.socket.user.getPermissionsAndUser( () => {
        if (!req.socket.user.userUid || req.socket.user.userUid != req.channel){
          return next('NOOOO');
        }
        next();
      });
    });


    socket.loginHandler = LoginHandler(db, errorHandler, permissionsHandler);
    socket.user = userHandler(socket.loginHandler, permissionsHandler, config);

    socket

    .on('login', (req,  res) => {
      socket.headers = req.headers;
      jwt(config.authentication)(socket, null, () => {
        if (socket.user.loginUid) {
          socket.setAuthToken({loginUid: socket.user.loginUid, aud: socket.user.audience});
          return res();
        } else {
          return res(socket.user.error);
        }
      });
    })

    .on('graphql', (req, res) => {
      graphqlHandler.requestParser(req, res, () => {
        graphqlHandler.graphqlExecute(socket, req, res, () => {
          res(req.result.errors, req.result);
          setTimeout(function(){

            console.log(req.result.data.createUser[0].user_uid);
            scServer.exchange.publish(req.result.data.createUser[0].user_uid, {'hi':'hi'}, (err) => {
              console.log('err', err);
            });
           }, 3000);

        });
      });
    });
    //
    // .on('subscription', (req, res) => {
    //   //TODO subscription handler
    //   res();
    // });


  })

  .on('error', (err) => {
    debug.error(err);
  });

  return scServer;
};
