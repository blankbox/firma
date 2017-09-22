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
    const loginHandler = req.loginHandler;

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

      const loginUuid = Uuid.fromString(decoded.sub.split(':')[1]);

      loginHandler.getLogin(decoded.aud, loginUuid , (err, login) => {
        if(err) {
          //TODO workout what to actually do here
          return next();
        }

        req.user.loginUid = loginUuid;
        req.user.audience = dec.aud;


        //TODO this flow is ugly - redo
        if (!login) {
          //TODO move default permissions to config
          req.permissionsHandler.builder(
            [
              {
                entity_uid:'ALL',
                roles:['guest']
              },
              {
                entity_uid:String(loginUuid),
                roles:['unregistered']
              }
            ],
            (err, permissions) =>{
              req.user.permissions = permissions;
              return next();
            }
          );
        } else {

          if (login.blacklisted) {
            req.user.error = userErrMsg.blacklisted;
            return next();
          }

          req.user.userUid = login.user_uid;
          req.user.permissions = login.permissions;

          return next();
        }


      });

    });

  };

};
