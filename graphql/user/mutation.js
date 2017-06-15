const graphql = require('graphql');


const GraphQLObjectType = graphql.GraphQLObjectType;
const GraphQLInt = graphql.GraphQLInt;
const GraphQLBoolean = graphql.GraphQLBoolean;
const GraphQLString = graphql.GraphQLString;
const GraphQLList = graphql.GraphQLList;
const GraphQLNonNull = graphql.GraphQLNonNull;

const UserType = require ('./schema');
let users = require ('./store');



const add = {
  type: new GraphQLList(UserType),
  description: 'Add a user',
  args: {
    email: {
      name: 'Email',
      type: new GraphQLNonNull(GraphQLString)
    },
    first_name: {
      name: 'First name',
      type: GraphQLString
    },
    last_name: {
      name: 'Last name',
      type: GraphQLString
    },
    password: {
      name: 'Password',
      type: new GraphQLNonNull(GraphQLString)
    }
  },
  resolve: (root, args) => {
    let id = users.length;
    let user = {
      user_uid: id,
      email: args.email,
      first_name: args.first_name,
      last_name: args.last_name,
      password: args.password,
      blocked: false
    };
    users.push(user);
    return [user];
  }
};

module.exports = {
  addUser: add
};
