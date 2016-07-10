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

  if (Component.prototype.isReactComponent) {

    return class extends Component {

      static displayName = Component.displayName || Component.name;

      constructor(props, context) {
        super(props, context);
        this.reactor = null;
        this.forceUpdateBound = this.forceUpdate.bind(this, undefined);
      }

      render() {
        let element;
        let refs = capture(() => {
          element = super.render();
        });
        if (this.reactor === null) {
          this.reactor = new Reactor(refs, this.forceUpdateBound);
        } else {
          // reactor is stopped, so it is (?) safe to do so
          this.reactor._parent = refs;
        }
        this.reactor.start();
        return element;
      }

      componentWillUpdate(...args) {
        this.reactor.stop();
        if (super.componentWillUpdate) {
          super.componentWillUpdate(...args);
        }
      }

      componentWillUnmount(...args) {
        this.reactor.stop();
        if (super.componentWillUnmount) {
          super.componentWillUnmount(...args);
        }
      }

    };

  } else {

    return class extends React.Component {

      static displayName = Component.displayName || Component.name;
      static propTypes = Component.propTypes;
      static contextTypes = Component.contextTypes;
      static defaultProps = Component.defaultProps;

      constructor(props) {
        super(props);
        this.reactor = null;
        this.forceUpdateBound = this.forceUpdate.bind(this, undefined);
      }

      render() {
        let element;
        let refs = capture(() => {
          element = Component(this.props, this.context);
        });
        if (this.reactor === null) {
          this.reactor = new Reactor(refs, this.forceUpdateBound);
        } else {
          // reactor is stopped, so it is (?) safe to do so
          this.reactor._parent = refs;
        }
        this.reactor.start();
        return element;
      }

      componentWillUpdate() {
        this.reactor.stop();
      }

      componentWillUnmount() {
        this.reactor.stop();
      }

    };
  }
}

