/**
 * @copyright 2016, Prometheus Research, LLC
 * @copyright 2016-present, Andrey Popp <8mayday@gmail.com>
 */

import invariant from 'invariant';
import React from 'react';
import {
  __Reactor as Reactor,
  captureDereferences,
  struct,
  isDerivable
} from 'derivable';

/**
 * Produce reactive component out of original React component.
 *
 * Reactive component re-render when one of the reactive values used in render()
 * funciton changes.
 *
 * @example
 *
 * let Hello = props =>
 *   <div>{props.message.get()}</div>
 *
 * let ReactiveHello = reactive(Hello)
 *
 * @example
 *
 * class Hello extends React.Component {
 *   render() {
 *     return <div>{props.message.get()}</div>
 *   }
 * }
 *
 * let ReactiveHello = reactive(Hello)
 */
export function reactive(Component) {
  return decorateWith(Component, makeReactiveComponent);
}

/**
 * Produce pure reactive component out of original React component.
 *
 * Pure reactive component behave the same as reactive component but have
 * additional optimization through shouldComponentUpdate which prevents
 * re-rendering if props / state aren't changed.
 *
 * @example
 *
 * let Hello = props =>
 *   <div>{props.message.get()}</div>
 *
 * let PureHello = pure(Hello)
 *
 * @example
 *
 * class Hello extends React.Component {
 *   render() {
 *     return <div>{props.message.get()}</div>
 *   }
 * }
 *
 * let PureHello = pure(Hello)
 */
export function pure(Component) {
  Component = decorateWith(Component, makeReactiveComponent);
  return decorateWith(Component, makePureComponent);
}

function decorateWith(Component, decorator) {
  let DecoratedComponent;
  if (Component.prototype.isReactComponent) {
    DecoratedComponent = decorator(Component);
  } else {
    DecoratedComponent =  decorator(React.Component, Component);
  }
  transferComponentStaticProperties(Component, DecoratedComponent);
  return DecoratedComponent;
}

function makeReactiveComponent(Base, render = null) {
  return class extends Base {

    constructor(props, context) {
      super(props, context);
      this._dependencies = [];
      this._reactor = null;
    }

    render() {
      let element;
      // collect dependencies while running render
      let dependencies = captureDereferences(() => {
        element = render === null
          ? super.render()
          : render(this.props, this.context);
      });

      this._startReactor(dependencies);

      return element;
    }

    componentWillUpdate(...args) {
      this._reactor.stop();
      if (super.componentWillUpdate) {
        super.componentWillUpdate(...args);
      }
    }

    componentWillUnmount(...args) {
      this._reactor.stop();
      this._reactor = null;
      this._dependencies = null;
      if (super.componentWillUnmount) {
        super.componentWillUnmount(...args);
      }
    }

    _startReactor(dependencies) {
      this._dependencies = dependencies;
      if (this._reactor === null) {
        this._reactor = new Reactor(struct(dependencies), this._react);
      } else {
        // _reactor is stopped, so it is (?) safe to do so
        this._reactor._parent = struct(dependencies);
      }
      this._reactor.start();
    }

    _react = () => {
      this._reactor.stop();
      this.forceUpdate();
    };

  };
}

function makePureComponent(ReactiveBase, render = null) {
  invariant(
    ReactiveBase.prototype.shouldComponentUpdate === undefined,
    'pure(Component): shouldComponentUpdate already defined'
  );

  return class extends ReactiveBase {

    render() {
      return render === null
        ? super.render()
        : render(this.props, this.context);
    }

    shouldComponentUpdate(nextProps, nextState) {
      // Here we compare nextProps and nextState against this.props and
      // this.state.
      //
      // Comparison is made by shallowEqual function which is modified to
      // compare reactive values (respecting custom equality rules if any).
      //
      // On each equivalent (but not equal!) reactive value we receive a
      // call back which allows us to populate new list of dependencies and then
      // in case we don't do a real re-render — update what we are listening
      // to.
      //
      // Why it is safe not to re-render on equivalent but not equal reactive
      // values? Because observation of both equivalent reactive values leads to
      // the same render result!
      let dependencies = this._dependencies.slice(0);
      let onDerivableReplace = (prev, next) => {
        let idx = dependencies.indexOf(prev);
        if (idx > -1) {
          dependencies.splice(idx, 1, next);
        }
      };
      let shouldUpdate = (
        !shallowEqual(this.props, nextProps, onDerivableReplace) ||
        !shallowEqual(this.state, nextState, onDerivableReplace)
      );
      if (!shouldUpdate) {
        this._reactor.stop();
        this._startReactor(dependencies);
      }
      return shouldUpdate;
    }

  };
}

function transferComponentStaticProperties(From, To) {
  To.displayName = From.displayName || From.name;
  To.propTypes = From.propTypes;
  To.contextTypes = From.contextTypes;
  To.defaultProps = From.defaultProps;
}

let hasOwnProperty = Object.prototype.hasOwnProperty;

function is(x, y) {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}

export function shallowEqual(objPrev, objNext, onDerivableReplace) {
  if (is(objPrev, objNext)) {
    return true;
  }

  if (
    typeof objPrev !== 'object' || objPrev === null ||
    typeof objNext !== 'object' || objNext === null
  ) {
    return false;
  }

  let keysPrev = Object.keys(objPrev);
  let keysNext = Object.keys(objNext);

  if (keysPrev.length !== keysNext.length) {
    return false;
  }

  for (let i = 0; i < keysPrev.length; i++) {
    let key = keysPrev[i];
    if (!hasOwnProperty.call(objNext, key)) {
      return false;
    }
    let valPrev = objPrev[key];
    let valNext = objNext[key];
    if (isDerivable(valPrev) && isDerivable(valNext)) {
      if (valPrev._equals !== valNext._equals) {
        return false;
      } else if (valPrev._equals !== null) {
        if (!valPrev._equals(valPrev.get(), valNext.get())) {
          return false;
        } else {
          onDerivableReplace && onDerivableReplace(valPrev, valNext);
        }
      } else if (valPrev.get() !== valNext.get()) {
        return false;
      } else {
        onDerivableReplace && onDerivableReplace(valPrev, valNext);
      }
    } else if (!is(valPrev, valNext)) {
      return false;
    }
  }

  return true;
}

export default reactive;
