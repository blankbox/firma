const jwt = require('jsonwebtoken');
const _ = require('underscore');

//Allow multiple jwt providers

//Check that token sxsists
//Decode & check audience
//check that  we accept tokens for that audience
//check that token is not blacklisted

//check that login exsists
//get permissions for login


module.exports = (config) => {


  const keyByAudience = () => {
    let out = {}
    _.mapObject(config, function(val, key) {
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
    const loginHandler = req.loginHandler;

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

      const loginUuid = decoded.sub.split(':')[1];

      loginHandler.getLogin(decoded.aud, loginUuid , (err, login) => {
        if(err) {
          console.log('ERROR');
          console.log(err);
          return next();
        }

        req.user.loginUuid = loginUuid;
        if (!login) {
          return next();
        }

        if (login.blacklisted) {
          req.user.error = userErrMsg.blacklisted;
          return next();
        }

        req.user.userUid = login.user_uid;
        req.user.loginPermissions = login.permissions;
        req.user.login = login;

        return next();

      });

    });

  }

}
