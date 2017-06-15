

const user = {
  select: (params) => {
    //TODO build DB to select on allowed params
    let query = 'SELECT * FROM ' + userTable + ' WHERE ' + params

  }


}



const userStore = {
  checkPassowrd: (email, password) => {
    let user = user.select({email:email})
  }
}



module.exports = {
  user:userStore;
  token: tokenStore;
};
