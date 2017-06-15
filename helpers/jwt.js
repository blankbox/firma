
const jwt = require('jsonwebtoken');

module.exports = (config) => {
  const secret = config.jwtSecret;
  const blacklist = config.userBlacklist();
  const PublicError = config.error.PublicError;


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

    let token = req.header.user_token;
    if (!token) {
      req.user.error = {
        name: 'UserError',
        status: 401,
        message: 'User token is missing'
      };
      return next();
    }

    jwt.verify(token, secret, function(err, decoded) {
      if (err) {
        req.user.error = {
          name: 'UserError',
          status: 403,
          message: 'User token is invalid'
        };
        return next();
      } else {
        if (blacklist.checkToken (token)) {
          req.user.error = {
            name: 'UserError',
            status: 403,
            message: 'User token is blocked'
          };
          return next();
        } else {
          req.user.error = {
            name: 'UserError',
            status: 403,
            message: 'You are logged in'
          };
          //TODO replace token if due to expire, send in header
          req.user.payload = decoded;
          req.user.verified = true;
          return next();
        }
      }
    });

  }
  return verify;
}
