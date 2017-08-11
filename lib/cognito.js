const jwt = require('jsonwebtoken');

module.exports = (config) => {
  const cert = config.jwtCert;
  const blacklist = config.userBlacklist;
  const PublicError = config.error.PublicError;
  const db = config.cassandra;

  const verify = (req, res, next) => {
    req.user = {};

    //Convenience method to check verification in business logic
    req.user.mustBeVerified = function (value) {
      if (this.verified !== value){
        let err = this.error;
        throw new PublicError (err.name, err.message, err.status);
      }
    }

    req.user.verified = false;

    let token = req.headers.user_token;
    if (!token) {
      req.user.error = {
        name: 'UserError',
        status: 401,
        message: 'User token is missing'
      };
      return next();
    }

    jwt.verify(token, cert, function(err, decoded) {
      if (err) {
        req.user.error = {
          name: 'UserError',
          status: 403,
          message: 'User token is invalid'
        };
        return next();
      } else {
        if (blacklist.containsToken (token)) {
          req.user.error = {
            name: 'UserError',
            status: 403,
            message: 'User token is blocked'
          };
          return next();
        } else {
          //check that the jwt is for the correct identity pool
          if (decoded.aud != config.identityPoolId) {
            req.user.error = {
              name: 'UserError',
              status: 403,
              message: 'User token is not valid for this service'
            };
            return next();
          } else {
            req.user.error = {
              name: 'UserError',
              status: 403,
              message: 'You are logged in'
            };
            //Check that we have this user

            let userUuid = decoded.sub.split(':')[1];
            db.instance.UserCognitoLogin.findOne(
              {login_uid:userUuid}, (err, user) => {
                if (err || !user) {
                  req.user.error = {
                    name: 'UserError',
                    status: 403,
                    message: 'Unkown'
                  };
                  return next();
                } else {
                  req.user.payload = decoded;
                  req.user.verified = true;
                  return next();
                }
              }
            );
          }
        }
      }
    });

  }
  return verify;
}
