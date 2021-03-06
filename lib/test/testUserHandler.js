/* eslint-env node, mocha */
const assert = require('assert');

const userHandler = require('../../lib/userHandler');

describe ('UserHandler', () => {
  describe('Keys:', () => {

    it('returns expected keys', () => {
      let keys = Object.keys(userHandler());
      assert.deepEqual(
        [
          'mustBeUser',
          'mustBeLoggedIn',
          'permissions',
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
        assert.equal('Verification failure user', theError.message);
      }
    });

    it('No error if not verified when false', () => {
      let theError;
      try {
        Handler.mustBeUser(false);
      } catch(err){
        theError = err;
      } finally {
        assert.equal(null, theError);
      }
    });

    it('Throws an error if logged in when false', () => {
      Handler.loginUid = '1234';
      let theError;
      try {
        Handler.mustBeLoggedIn(false);
      } catch(err){
        theError = err;
      } finally {
        assert.equal('Verification failure login', theError.message);
      }
    });

  });
});
