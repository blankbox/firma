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

const keyByAudience = (config) => {
  let out = {};
  _.mapObject(config, (val, key) => {
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
  }
};

const decodeJwt = (authoconfig, req, res, cb) => {
  let token = req.headers.user_token;

  if (!token) {
    req.user.error = userErrMsg.noToken;
    return cb();
  }

  let dec = jwt.decode(token);

  let kBA = keyByAudience(authoconfig);

  if (!dec.aud || !kBA.hasOwnProperty(dec.aud)){
    req.user.error = userErrMsg.wrongAud;
    return cb();
  }

  jwt.verify(token, kBA[dec.aud].key, (err, decoded) => {

    if (err) {
      req.user.error = userErrMsg.invalidToken;
      return cb();
    }

    req.user.loginUid = Uuid.fromString(decoded.sub.split(':')[1]);
    req.user.audience = dec.aud;
    return cb();
  });
};

module.exports = (authoconfig) => {

  return (req, res, next) => {
    decodeJwt(authoconfig, req, res, () => {
      req.user.getPermissionsAndUser( () =>{
        next();
      });
    });
  };
};
