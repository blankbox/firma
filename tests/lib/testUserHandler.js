/* eslint-env node, mocha */
const assert = require('assert');
const PublicError = require('../../lib/error').PublicError;

const userHandler = require('../../lib/userHandler');

describe ('UserHandler', () => {
  describe('Keys:', () => {

    it('returns expected keys', () => {
      let keys = Object.keys(userHandler());
      assert.deepEqual(
        [
          'userVerified',
          'loginVerified',
          'getUser',
          'getPermissions',
          'mustBeUser',
          'mustBeLoggedIn',
          'loginPermissions',
          'userUid',
          'loginUid'
        ].sort() , keys.sort()
      );
    });

  });

  describe('Must Be:', () => {
    let Handler = userHandler();

    it('Throws an error if not verified when true', () => {
      let theError;
      try {
        Handler.mustBeUser(true);
      } catch(err){
        theError = err;
      } finally {
        assert.equal('Verification failure', theError.message)
      }
    });

    it('No error if not verified when false', () => {
      let theError;
      try {
        Handler.mustBeUser(false)
      } catch(err){
        theError = err;
      } finally {
        assert.equal(null, theError)
      }
    });

    it('Throws an error if loged in when false', () => {
      Handler.loginVerified = true;
      let theError;
      try {
        Handler.mustBeLoggedIn(false)
      } catch(err){
        theError = err;
      } finally {
        assert.equal('Verification failure', theError.message)
      }
    });

  });

  describe('Get User:', () => {
    userHandler().getUser((err, user) => {
      console.log(err);
      console.log(user);
    });


  });

  describe('Get Permissions:', () => {
    let Handler = userHandler();

  });
});
