const bcrypt = require('bcrypt');

const checkPassword = (root, args, user, cb) => {
  bcrypt.compare(args.password, user.password_hash, (err, res) => {
    if (!res) {
      cb(new root.errorHandler.PublicError('UserError', 'User or password error', 403));
    } else {
      cb();
    }
  });
};

const hashPassword = (root, args, user, cb) => {
  bcrypt.genSalt(1, (err, salt) => {
    if (err) {
      cb( new root.errorHandler.PrivateError('BcryptError', 'error generating salt', 500));
    } else {
      bcrypt.hash(args.password, salt, (err, hash) => {
        if (err) {
          cb( new root.errorHandler.PrivateError('BcryptError', 'error hashing password', 500));
        } else {
          user.password_hash = hash;
          cb(null, user);
        }
      });
    }
  });
};

const checkEmail = (root, args, cb) => {
  root.db.cassandra.instance.UserProfile.findOne(
    {email:args.email},
    {materialized_view:'user_by_email'}, (err, user) => {
    if (err) {
      cb(new root.errorHandler.PrivateError('CassandraError', 'error select from user by email', 500));
    } else {
      cb(null, user);
    }
  });
};

module.exports = {
  checkPassword:checkPassword,
  hashPassword:hashPassword,
  checkEmail:checkEmail
};
