/**
 * @flow
 */

import * as Derivable from 'derivable';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {renderMap, render as r} from 'react-derivable';

/**
 * State.
 */

let state = Derivable.atom({
  a: 0,
  b: 0,
});

/**
 * State derivations.
 *
 * They allow to isolate scope of the state. So reactive components which
 * consume such derivations only react when those derivations are changed.
 */

let countA = state.derive(state => state.a);
let countB = state.derive(state => state.b);

/**
 * Actions which operate on state.
 */

let increaseA = () => state.update(state => ({...state, a: state.a + 1}));

let decreaseA = () => state.update(state => ({...state, a: state.a - 1}));

let increaseB = () => state.update(state => ({...state, b: state.b + 1}));

let decreaseB = () => state.update(state => ({...state, b: state.b - 1}));

/**
 * <App /> is a reactive component which distributes state among its children.
 */

let App = props => {
  console.log(`render: <App />`);
  return (
    <div>
      <pre>{renderMap(state, state => JSON.stringify(state, null, 2))}</pre>
      <Counter name="A" counter={countA} increase={increaseA} decrease={decreaseA} />
      <Counter name="B" counter={countB} increase={increaseB} decrease={decreaseB} />
    </div>
  );
};

/**
 * <Counter /> is a pure reactive component.
 *
 * Pure means that its value depends on only reactive values dereferences in its
 * render method. Even if app re-renders it won't re-render unless `counter`
 * prop value changes.
 */

let Counter = props => {
  console.log(`render: <Counter name="${props.name}" />`);
  return (
    <div>
      <div>
        Value: {r(props.counter)}
        <button onClick={props.increase}>+</button>
        <button onClick={props.decrease}>-</button>
      </div>
    </div>
  );
};

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
