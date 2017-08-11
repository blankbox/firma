const jwt = require('jsonwebtoken');
const _ = require('underscore');

// TODO
//check that login exsists
//get permissions for login

module.exports = (config) => {

  const tokenHandler = config.tokenHandler;

  const keyByAudience = () => {
    let out = {}
    _.mapObject(config.authentication, function(val, key) {
      out[val.audience] = {key: val.key, name: key};
    });
    return out;
  }

  const userErrMsg = {
    noToken:{
      name: 'UserError',
      status: 401,
      message: 'User token is missing'
    },
    wrongAud:{
      name: 'UserError',
      status: 403,
      message: 'User token is not valid for this service'
    },
    invalidToken:{
      name: 'UserError',
      status: 403,
      message: 'User token is invalid'
    },
    blacklisted:{
      name: 'UserError',
      status: 403,
      message: 'User token is blocked'
    }
  }

  return (req, res, next) => {
    req.user = config.userHandler;

    let token = req.headers.user_token;

    if (!token) {
      req.user.error = userErrMsg.noToken;
      return next();
    }

    let dec = jwt.decode(token);

    if (!keyByAudience.hasOwnProperty(dec.aud)){
      req.user.error = userErrMsg.wrongAud;
      return next();
    }

    jwt.verify(token, keyByAudience[dec.aud].key, (err, decoded) => {

      if (err) {
        req.user.error = userErrMsg.invalidToken;
        return next();
      }

      if (tokenHandler.blacklisted(token)) {
        req.user.error = userErrMsg.blacklisted;
        return next();
      }
      
      req.user.decoded = decoded;
      req.user.loginUuid = decoded.sub.split(':')[1];
      return next();
    });

  }

}
