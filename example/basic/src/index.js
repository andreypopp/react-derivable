import {atom} from 'derivable';
import React from 'react';
import ReactDOM from 'react-dom';
import {reactive} from 'react-derivable';

/**
 * State.
 */

let counter = atom(0);

/**
 * Actions which operate on state.
 */

let increase = () =>
  counter.swap(value => value + 1);

let decrease = () =>
  counter.swap(value => value - 1);

/**
 * Reactive component which reads from state and modifies it via actions.
 */

let App = reactive(props =>
  <div>
    <div>
      Value: {counter.get()}
      <button onClick={increase}>+</button>
      <button onClick={decrease}>-</button>
    </div>
  </div>
);

/**
 * Render application into DOM.
 */

let render = () =>
  ReactDOM.render(
    <App />,
    document.getElementById('root')
  );

/**
 * This is not required to use React and Derivable!
 *
 * This helps webpack reload application when source code changes.
 */
if (module.hot) {
  module.hot.accept();
  render();
}
