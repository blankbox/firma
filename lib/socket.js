

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

  scServer.on('connection', (socket) => {

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
        });
      });
    })

    .on('subscription', (req, res) => {
      //TODO subscription handler
      res();
    });


  })

  .on('error', (err) => {
    debug.error(err);
  });

  return scServer;
};