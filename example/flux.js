import invariant from 'invariant';
import React from 'react';
import ReactDOM from 'react-dom';
import {atom, transact} from 'derivable';
import {reactive, pure} from 'react-reactive';

/**
 * Create new Redux-style store (7 loc, really!)
 */

function createStore(apply, initialState = {}) {
  let state = atom(initialState);
  if (typeof apply !== 'function') {
    apply = makeApplyFromDispatchTable(apply);
  }
  return {
    state: state.derive(state => state),
    dispatch(action) {
      state.swap(state => apply(state, action));
    }
  };
}

function makeApplyFromDispatchTable(table) {
  return function(state, action) {
    let apply = table[action.type];
    invariant(
      apply,
      'Orphan action type: %s', action.type
    );
    return apply(state, action);
  };
}

/**
 * Define action types.
 */

const ADD_TODO = 'add-todo';
const COMPLETE_TODO = 'complete-todo';

/**
 * Define action creators.
 */

function addTodo(text) {
  app.dispatch({
    type: ADD_TODO,
    text,
  });
}

function completeTodo(id) {
  app.dispatch({
    type: COMPLETE_TODO,
    id
  });
}

/**
 * Define app as a pair of initial state and a reducer-style function of how to
 * apply actions to the current state.
 */

let app = createStore({
  [ADD_TODO](state, action) {
    let todo = {
      id: state.todoList.length,
      text: action.text,
      completed: false
    };
    return {
      ...state,
      todoStore: {
        ...state.todoStore,
        [todo.id]: todo,
      },
      todoList: state.todoList.concat(todo.id),
    };
  },
  [COMPLETE_TODO](state, action) {
    let todo = state.todoStore[action.id];
    if (!todo) {
      return state;
    }
    return {
      ...state,
      todoStore: {
        ...state.todoStore,
        [todo.id]: {...todo, completed: true},
      }
    };
  },
}, {todoList: [], todoStore: {}});

/**
 * Query
 */

function lookup(derivable) {
  let cache = new Map();
  return function makeLookup(key) {
    if (cache.has(key)) {
      return cache.get(key);
    } else {
      let d = derivable.derive(key);
      cache.set(key, d);

      // gc
      derivable.react(value => {
        if (value[key] === undefined) {
          cache.delete(key);
        }
      }, {
        until: () => cache.has(key),
        skipFirst: true,
      });

      return d;
    }
  };
}

let completedTodoList = app.state.derive(state =>
  state.todoList.filter(item => state.todoStore[item].completed));

let todoList = app.state.derive(state =>
  state.todoList.filter(item => !state.todoStore[item].completed));

let todoByID = lookup(app.state.derive(state => state.todoStore));

/**
 * Define app components which use app state and automatically subscribe to its
 * changes.
 */

let TodoApp = reactive(class extends React.Component {

  constructor(props) {
    super(props);
    this.todoDraft = atom('');
  }

  render() {
    return (
      <div>
        <h1>Todo App</h1>

        <h2>Add new todo</h2>
        <input
          value={this.todoDraft.get()}
          onChange={this.onTodoDraftChange}
          />
        <button onClick={this.onAddTodo}>
          Add
        </button>

        <h2>Todo:</h2>
        <TodoList
          items={todoList}
          />

        <h2>Completed:</h2>
        <TodoList
          items={completedTodoList}
          />
      </div>
    );
  }

  onTodoDraftChange = (e) => {
    this.todoDraft.set(e.target.value);
  };

  onAddTodo = () => {
    transact(() => {
      let text = this.todoDraft.get();
      addTodo(text);
      this.todoDraft.set('');
    });
  };
});

let TodoList = pure(({items}) =>
  <ul>
    {items.get().map((id) =>
      <TodoItem
        key={id}
        item={todoByID(id)}
        />
    )}
  </ul>
);

let TodoItem = pure(({item}) => {
  let todo = item.get();
  return (
    <li>
      {todo.text}
      {!todo.completed &&
        <button onClick={() => completeTodo(todo.id)}>
          Complete
        </button>}
    </li>
  );
});

ReactDOM.render(<TodoApp />, document.getElementById('app'));
