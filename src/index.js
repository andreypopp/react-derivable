/**
 * @copyright 2016, Prometheus Research, LLC
 * @copyright 2016-present, Andrey Popp <8mayday@gmail.com>
 */

import React from 'react';
import {captureDereferences, struct, atom} from 'derivable';

function capture(thunk) {
  return struct(captureDereferences(thunk));
}

export default function reactive(Component) {

  if (Component.prototype.isReactComponent) {

    return class extends Component {

      static displayName = Component.displayName || Component.name;

      constructor(props, context) {
        super(props, context);
        this.disactivate = atom(false);
        this.reactor = null;
      }

      render() {
        this.disactivate.set(false);
        let element;
        this.reactor = capture(() => {
          element = super.render();
        });
        this.reactor.react(() => {
          this.forceUpdate();
        }, {
          once: true,
          skipFirst: true,
          until: this.disactivate,
        });
        return element;
      }

      componentWillUpdate(...args) {
        this.disactivate.set(true);
        if (super.componentWillUpdate) {
          super.componentWillUpdate(...args);
        }
      }

      componentWillUnmount(...args) {
        this.disactivate.set(true);
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
        this.disactivate = null;
        this.reactor = null;
        this.forceUpdateBound = this.forceUpdate.bind(this, undefined);
      }

      render() {
        let element;
        this.disactivate = atom(false);
        this.reactor = capture(() => {
          element = Component(this.props, this.context);
        });
        this.reactor.react(this.forceUpdateBound, {
          once: true,
          skipFirst: true,
          until: this.disactivate,
        });
        return element;
      }

      componentWillUpdate() {
        this.disactivate.set(true);
      }

      componentWillUnmount() {
        this.disactivate.set(true);
      }

    };
  }
}
