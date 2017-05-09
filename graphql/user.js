const graphql = require('graphql')

const GraphQLObjectType = graphql.GraphQLObjectType
const GraphQLInt = graphql.GraphQLInt
const GraphQLBoolean = graphql.GraphQLBooleanv
const GraphQLString = graphql.GraphQLString
const GraphQLList = graphql.GraphQLList
const GraphQLNonNull = graphql.GraphQLNonNull
const GraphQLSchema = graphql.GraphQLSchema

let TODOs = [];

const UserType = new GraphQLObjectType({
  name: 'user',
  fields: () => ({
    id: {
      type: GraphQLInt,
      description: 'User UUID'
    },
    title: {
      type: GraphQLString,
      description: 'Task title'
    },
    completed: {
      type: GraphQLBoolean,
      description: 'Flag to mark if the task is completed'
    }
  })
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    todos: {
      type: new GraphQLList(TodoType),
      resolve: (root, args) => {
        return TODOs
      }
    }
  })
});

const MutationAdd = {
  type: new GraphQLList(TodoType),
  description: 'Add a Todo',
  args: {
    title: {
      name: 'Todo title',
      type: new GraphQLNonNull(GraphQLString)
    }
  },
  resolve: (root, args) => {
    var id = TODOs.length;
    TODOs.push({
      id: id,
      title: args.title,
      completed: false
    });
    return [TODOs[id]];
  }
};

const MutationToggle = {
  type: new GraphQLList(TodoType),
  description: 'Toggle the todo',
  args: {
    id: {
      name: 'Todo Id',
      type: new GraphQLNonNull(GraphQLInt)
    }
  },
  resolve: (root, args) => {
    TODOs
      .filter((todo) => todo.id === args.id)
      .forEach((todo) => todo.completed = !todo.completed)
    return TODOs;
  }
};

const MutationDestroy = {
  type: new GraphQLList(TodoType),
  description: 'Destroy the todo',
  args: {
    id: {
      name: 'Todo Id',
      type: new GraphQLNonNull(GraphQLInt)
    }
  },
  resolve: (root, args) => {
    return TODOs = TODOs.filter((todo) => todo.id !== args.id);
  }
};

var MutationToggleAll = {
  type: new GraphQLList(TodoType),
  description: 'Toggle all todos',
  args: {
    checked: {
      name: 'Todo Id',
      type: new GraphQLNonNull(GraphQLBoolean)
    }
  },
  resolve: (root, args) => {
    TODOs.forEach((todo) => todo.completed = args.checked)
    return TODOs;
  }
};

var MutationClearCompleted = {
  type: new GraphQLList(TodoType),
  description: 'Clear completed',
  resolve: () => {
    return TODOs = TODOs.filter((todo) => !todo.completed)
  }
};

var MutationSave = {
  type: new GraphQLList(TodoType),
  description: 'Edit a todo',
  args: {
    id: {
      name: 'Todo Id',
      type: new GraphQLNonNull(GraphQLInt)
    },
    title: {
      name: 'Todo title',
      type: new GraphQLNonNull(GraphQLString)
    }
  },
  resolve: (root, args) => {
    TODOs
      .filter((todo) => todo.id === args.id)
      .forEach((todo) => todo.title = args.title)
    return TODOs
  }
}

var MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    add: MutationAdd,
    toggle: MutationToggle,
    toggleAll: MutationToggleAll,
    destroy: MutationDestroy,
    clearCompleted: MutationClearCompleted,
    save: MutationSave
  }
});

module.exports = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType
});
