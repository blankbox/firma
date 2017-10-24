/* eslint-env node, mocha */
const assert = require('assert');

const permissionsHandler = require('../permissionsHandler')();
const permissionsBuilder = permissionsHandler.builder;
const permissionsSetter = permissionsHandler.addPermissionsToRole;
const permissionsGetter = permissionsHandler.getRolePermissions;

describe ('Permission setter', () => {
  it('adds permissions to roles from array', () => {

    permissionsSetter(
      [
        {
          role:'everyone',
          permissions:['thing', 'thing3']
        },
        {
          role:'everyone',
          permissions:['thing', 'thing2']
        },
        {
          role:'self',
          permissions:['thing', 'thing4']
        }
      ],
      ()=>{}
    );

    let rolePermissions = {
      everyone:['thing', 'thing2', 'thing3'],
      self:['thing', 'thing4']
    };

    permissionsGetter((err, perms)=>{
      assert.deepEqual(
        rolePermissions,
        perms
      );
    });

  });

  it('adds permissions to roles from object', () => {

    permissionsSetter(
      {
        role:'noone',
        permissions:['thing', 'thing2', 'thing3']
      },
      ()=>{}
    );

    let rolePermissions = {
      everyone:['thing', 'thing2', 'thing3'],
      noone:['thing', 'thing2', 'thing3'],
      self:['thing', 'thing4']
    };
    permissionsGetter((err, perms)=>{
      assert.deepEqual(
        rolePermissions,
        perms
      );
    });

  });
});

describe ('Permissions Builder', () => {

  describe('Generates permissions from roles array :', () => {

    it('returns expected', () => {

      let roleAndPermissions = [
        {
          audience: 'vybe_dev',
          login_uid: '03296f70-86b1-11e7-9649-afebb62b45b7',
          entity_uid: 'ALL',
          roles: [
            'everyone',
            'self'
          ],
          permissions:['thing5']
        }
      ];

      let target = {
        thing:['ALL'],
        thing2:['ALL'],
        thing3:['ALL'],
        thing4:['ALL'],
        thing5:['ALL']
      };
      permissionsBuilder(roleAndPermissions, (err, permissions) => {
        assert.deepEqual(
          target,
          permissions
        );
      });

    });

    it('returns expected - self only', () => {

      let roleAndPermissions = [
        {
          audience: 'vybe_dev',
          login_uid: '03296f70-86b1-11e7-9649-afebb62b45b7',
          entity_uid: 'ALL',
          roles: [
            'self'
          ],
          permissions:['thing5']
        }
      ];

      permissionsBuilder(roleAndPermissions, (err, permissions) => {
        assert.deepEqual(
          { thing: [ 'ALL' ], thing4: [ 'ALL' ], thing5: [ 'ALL' ] } ,
          permissions
        );
      });
    });

    it('returns expected - everyone only', () => {

      let roleAndPermissions = [
        {
          audience: 'vybe_dev',
          login_uid: '03296f70-86b1-11e7-9649-afebb62b45b7',
          entity_uid: 'ALL',
          roles: [
            'everyone'
          ]
        }
      ];


      permissionsBuilder(roleAndPermissions, (err, permissions) => {
        assert.deepEqual(
          { thing: [ 'ALL' ], thing2: [ 'ALL' ], thing3: [ 'ALL' ] },
          permissions
        );
      });

    });

    it('returns expected - no permissions', () => {

      let roleAndPermissions = [
        {
          audience: 'vybe_dev',
          login_uid: '03296f70-86b1-11e7-9649-afebb62b45b7',
          entity_uid: 'ALL'
        }
      ];

      permissionsBuilder(roleAndPermissions, (err, permissions) => {
        assert.deepEqual(
          {} ,
          permissions
        );

      });

    });

  });

  describe('Generates permissions from roles object :', () => {

    it('returns expected', () => {

      let roleAndPermissions =
        {
          audience: 'vybe_dev',
          login_uid: '03296f70-86b1-11e7-9649-afebb62b45b7',
          entity_uid: 'ALL',
          roles: [
            'everyone',
            'self'
          ],
          permissions:['thing5']
        };

      permissionsBuilder(roleAndPermissions, (err, permissions) => {

        assert.deepEqual(
          { thing: [ 'ALL' ],
            thing2: [ 'ALL' ],
            thing3: [ 'ALL' ],
            thing4: [ 'ALL' ],
            thing5: [ 'ALL' ] }
           ,
          permissions
        );
      });


    });
  });

  describe('Generates permissions from roles array of multiple entities :', () => {

    it('returns expected', () => {

      let roleAndPermissions = [
        {
          audience: 'vybe_dev',
          login_uid: '03296f70-86b1-11e7-9649-afebb62b45b7',
          entity_uid: 'ALL',
          roles: [
            'everyone',
            'self'
          ],
          permissions:['thing5']
        },
        {
          audience: 'vybe_dev',
          login_uid: '03296f70-86b1-11e7-9649-afebb62b45b7',
          entity_uid: 'FOO',
          roles: [
            'everyone',
            'self'
          ],
          permissions:['thing5']
        }
      ];

      permissionsBuilder(roleAndPermissions, (err, permissions) => {
        assert.deepEqual(
          { thing: [ 'ALL', 'FOO' ],
            thing2: [ 'ALL', 'FOO' ],
            thing3: [ 'ALL', 'FOO' ],
            thing4: [ 'ALL', 'FOO' ],
            thing5: [ 'ALL', 'FOO' ] },
          permissions
        );
      });


    });
  });
});
