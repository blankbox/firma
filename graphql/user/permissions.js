// perms = [
//   {
//     role:'FOO',
//     permissions:['bar']
//   }
// ]



const roles = [
  //Against all users
  {
    role:'admin',
    permissions:[
      'createUser',
      'updateUser',
      'deleteUser',
      'findUser',
      'findHiddenUser']
  },
  //against a login
  {
    role:'newLogin',
    permissions:['createUser']
  },
  //User is only given against named user (usually self)
  {
    role:'this_user',
    permissions:[
      'updateUser',
      'deleteUser',
      'findUser',
      'findHiddenUser']
  },
  //Against all
  {
    role:'loggedInUser',
    permissions:['findUser']
  }

];


module.exports = {
  roles
};
