/**
 * @flow
 */

import {atom} from 'derivable';
import React from 'react';
import ReactDOM from 'react-dom';
import {renderMap, render as r} from 'react-derivable';

/**
 * State.
 */

const state = atom({counter: 0});
const counter = state.derive(state => {
  console.log('computing...');
  return state.counter;
});

/**
 * Actions which operate on state.
 */

const increase = () => {
  state.update(state => ({...state, counter: state.counter + 1}));
};

let decrease = () => {
  state.update(state => ({...state, counter: state.counter - 1}));
};

/**
 * Reactive component which reads from state and modifies it via actions.
 */

let App = () => (
  <div>
    <div>
      <div>Value: {r(counter)}</div>
      <div>
        Is Even: {renderMap(counter, counter => (counter % 2 === 0 ? 'Yes' : 'No'))}
      </div>
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
    // $FlowFixMe: ...
    document.getElementById('root'),
  );

/**
 * This is not required to use React and Derivable!
 *
 * This helps webpack reload application when source code changes.
 */
if (module.hot) {
  // $FlowFixMe: ...
  module.hot.accept();
  render();
}
