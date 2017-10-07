// perms = [
//   {
//     role:'FOO',
//     permissions:['bar']
//   }
// ]


const roles = [
  {
    role:'loggedInUser',
    permissions:['text_search', 'uid_search', 'location_search']
  }

];

module.exports = {
  roles
};
