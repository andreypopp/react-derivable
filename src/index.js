/**
 * @copyright 2016, Prometheus Research, LLC
 * @copyright 2016-present, Andrey Popp <8mayday@gmail.com>
 */

import invariant from 'invariant';
import React from 'react';
import {__Reactor as Reactor, captureDereferences, struct, isDerivable} from 'derivable';

/**
 * Reactor which wraps React component and schedules its update when
 * dependencies change.
 */
export class ReactUpdateReactor extends Reactor {
  constructor(component) {
    super();
    this.react = this.constructor.prototype.react;
    this.component = component;
    this.dependencies = null;
  }

  setDependenciesFrom(thunk) {
    let result;
    this.setDependencies(captureDereferences(() => (result = thunk())));
    return result;
  }

  setDependencies(dependencies) {
    this._parent = struct(dependencies);
    this.dependencies = dependencies;
  }

  react() {
    this.stop();
    this.component.forceUpdate();
  }

  shutdown() {
    this.stop();
    this.dependencies = null;
    this.component = null;
  }
}

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
  if (Component.prototype && Component.prototype.isReactComponent) {
    DecoratedComponent = decorator(Component);
  } else {
    DecoratedComponent = decorator(React.Component, Component);
  }
  transferComponentStaticProperties(Component, DecoratedComponent);
  return DecoratedComponent;
}

function makeReactiveComponent(Base, render = null) {
  return class extends Base {
    constructor(props, context) {
      super(props, context);
      this._reactor = new ReactUpdateReactor(this);
    }

    render() {
      let element = this._reactor.setDependenciesFrom(
        () => (render === null ? super.render() : render(this.props, this.context)),
      );
      this._reactor.start();
      return element;
    }

    componentWillUpdate(...args) {
      this._reactor.stop();
      if (super.componentWillUpdate) {
        super.componentWillUpdate(...args);
      }
    }

    componentWillUnmount(...args) {
      this._reactor.shutdown();
      this._reactor = null;
      if (super.componentWillUnmount) {
        super.componentWillUnmount(...args);
      }
    }
  };
}

function makePureComponent(ReactiveBase, render = null) {
  invariant(
    ReactiveBase.prototype.shouldComponentUpdate === undefined,
    'pure(Component): shouldComponentUpdate already defined',
  );

  return class extends ReactiveBase {
    static withEquality(eq) {
      return class extends this {
        static eq = eq;
      };
    }

    static eq = Object.is;

    render() {
      return render === null ? super.render() : render(this.props, this.context);
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
      let dependencies = this._reactor.dependencies.slice(0);
      let onDerivableReplace = (prev, next) => {
        let idx = dependencies.indexOf(prev);
        if (idx > -1) {
          dependencies.splice(idx, 1, next);
        }
      };
      let shouldUpdate =
        !shallowEqual(this.props, nextProps, this.constructor.eq, onDerivableReplace) ||
        !shallowEqual(this.state, nextState, this.constructor.eq, onDerivableReplace);
      // if we shouldn't update we just re-subscribe to the new set of
      // dependencies
      if (!shouldUpdate) {
        this._reactor.stop();
        this._reactor.setDependencies(dependencies);
        this._reactor.start();
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

export function shallowEqual(objPrev, objNext, eq = Object.is, onDerivableReplace) {
  if (eq(objPrev, objNext)) {
    return true;
  }

  if (
    typeof objPrev !== 'object' ||
    objPrev === null ||
    typeof objNext !== 'object' ||
    objNext === null
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
      } else if (!eq(valPrev.get(), valNext.get())) {
        return false;
      } else {
        onDerivableReplace && onDerivableReplace(valPrev, valNext);
      }
    } else if (!eq(valPrev, valNext)) {
      return false;
    }
  }

  return true;
}

export default reactive;
