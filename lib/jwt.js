const jwt = require('jsonwebtoken');
const _ = require('underscore');
const Uuid = require('cassandra-driver').types.Uuid;

//Allow multiple jwt providers

//Check that token sxsists
//Decode & check audience
//check that  we accept tokens for that audience
//check that token is not blacklisted

//check that login exsists
//get permissions for login


module.exports = (config) => {

  const keyByAudience = () => {
    let out = {};
    _.mapObject(config, function(val, key) {
      out[val.audience] = {key: val.key, name: key};
    });
    return out;
  };

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
  };

  let kBA = keyByAudience();

  return (req, res, next) => {

    let token = req.headers.user_token;

    if (!token) {
      req.user.error = userErrMsg.noToken;
      return next();
    }

    let dec = jwt.decode(token);

    if (!kBA.hasOwnProperty(dec.aud)){
      req.user.error = userErrMsg.wrongAud;
      return next();
    }

    jwt.verify(token, kBA[dec.aud].key, (err, decoded) => {

      if (err) {
        req.user.error = userErrMsg.invalidToken;
        return next();
      }

      req.user.loginUid = Uuid.fromString(decoded.sub.split(':')[1]);
      req.user.audience = dec.aud;

      req.user.getPermissionsAndUser( () =>{
        next();
      });

    });

  };

};
