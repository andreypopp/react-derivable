/**
 * @flow
 */

import * as React from 'react';
import * as Derivable from 'derivable';

export function renderMap<V>(d: Derivable.Derivable<V>, f: V => React.Node): React.Node {
  return <Reactive d={d} f={f} />;
}

export function render<V: React.Node>(d: Derivable.Derivable<V>): React.Node {
  return <Reactive d={d} f={renderValue} />;
}

function renderValue<V: React.Node>(v: V): React.Node {
  return v;
}

type Props<V> = {
  d: Derivable.Derivable<V>,
  f: V => React.Node,
};

type State<V> = {
  v: V,
};

class Reactive<V> extends React.Component<Props<V>, State<V>> {
  _reactor: ?Derivable.__Reactor<V>;
  _skipReact: boolean = false;

  _react = (v: any) => {
    if (!this._skipReact) {
      this.setState({v});
    }
  };

  constructor(props: Props<V>) {
    super(props);
    this._skipReact = true;
    this._reactor = new Derivable.__Reactor(this.props.d, this._react);
    this._reactor.start();
    this.state = {v: this.props.d.get()};
    this._skipReact = false;
  }

  componentWillReceiveProps(props: Props<V>) {
    if (props.d !== this.props.d) {
      if (this._reactor != null) {
        this._reactor.stop();
      }
      this._skipReact = true;
      this._reactor = new Derivable.__Reactor(props.d, this._react);
      this._reactor.start();
      this._skipReact = false;
    }
  }

  componentWillUnmount() {
    this._skipReact = true;
    if (this._reactor != null) {
      this._reactor.stop();
      this._reactor = null;
    }
  }

  render() {
    const {f} = this.props;
    const {v} = this.state;
    return f(v);
  }
}
