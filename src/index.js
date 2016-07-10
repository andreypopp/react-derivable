/**
 * @copyright 2016, Prometheus Research, LLC
 * @copyright 2016-present, Andrey Popp <8mayday@gmail.com>
 */

import React from 'react';
import {
  __Reactor as Reactor,
  captureDereferences,
  struct
} from 'derivable';

function capture(thunk) {
  return struct(captureDereferences(thunk));
}

export default function reactive(Component) {

  let ReactiveComponent;
  if (Component.prototype.isReactComponent) {
    ReactiveComponent = decorate(Component, self =>
      Component.prototype.render.call(self));
  } else {
    ReactiveComponent =  decorate(React.Component, self =>
      Component(self.props, self.context));
  }

  ReactiveComponent.displayName = Component.displayName || Component.name;
  ReactiveComponent.propTypes = Component.propTypes;
  ReactiveComponent.contextTypes = Component.contextTypes;
  ReactiveComponent.defaultProps = Component.defaultProps;

  return ReactiveComponent;
}

function decorate(Base, render) {
  return class extends Base {

    constructor(props, context) {
      super(props, context);
      this._reactor = null;
    }

    render() {
      let element;
      // collect dependencies while running render
      let dependencies = capture(() => {
        element = render(this);
      });

      if (this._reactor === null) {
        this._reactor = new Reactor(dependencies, this._react);
      } else {
        // _reactor is stopped, so it is (?) safe to do so
        this._reactor._parent = dependencies;
      }

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
      this._reactor.stop();
      this._reactor = null;
      if (super.componentWillUnmount) {
        super.componentWillUnmount(...args);
      }
    }

    _react = () => {
      this._reactor.stop();
      this.forceUpdate();
    };

  };
}
