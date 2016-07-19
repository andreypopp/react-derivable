 /**
  * @copyright 2016-present, Andrey Popp <8mayday@gmail.com>
  */

import invariant from 'invariant';
import * as Derivable from 'derivable';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDerivable from '../';
import Inspector from 'react-inspector';
import ObjectValue from 'react-inspector/lib/object/ObjectValue';
import ObjectName from 'react-inspector/lib/object/ObjectName';
import Domlight from 'domlight.js/dist/domlight.js';

function style(Component, stylesheet) {
  return function({style, ...props}) {
    return <Component {...props} style={{...stylesheet, ...style}} />;
  };
}

let store = window.__derivable_devtool = {
  registry: Derivable.atom({})
};

let domlight = new Domlight({
  borderWidth: 0,
  backgroundColor: 'rgba(160, 197, 232, 0.9)',
});

let DevtoolRoot = style('div', {
  position: 'fixed',
  zIndex: 20000000,
  backgroundColor: '#fff'
});

let ObjectRootLabel = () => (
  <span>
    <ObjectName name="Derivables" />{': '}
  </span>
);

class DevtoolBase extends React.Component {

  static __derivableDevtoolSkip = true;

  constructor(props) {
    super(props);
    this._highlight = null;

    this.ObjectLabel = ({name, data, isNonenumerable, depth}) => (
      <span>
        <span
          onMouseLeave={this.removeHighlight}
          onMouseEnter={depth === 1 && this.highlight.bind(null, name)}>
          <ObjectName name={name} dimmed={isNonenumerable} />
        </span>
        <span>: </span>
        <ObjectValue object={data} />
      </span>
    );

    this.Node = ({depth, name, data, isNonenumerable}) => (
      depth === 0
        ? <ObjectRootLabel />
        : <this.ObjectLabel
            depth={depth}
            name={name}
            data={data}
            isNonenumerable={isNonenumerable}
            />
    );
  }

  render() {
    let data = {};
    let values = store.registry.get();
    for (let k in values) {
      data[k] = values[k].get();
    }
    return (
      <DevtoolRoot>
        <Inspector
          data={data}
          nodeRenderer={this.Node}
          expandLevel={1}
          />
      </DevtoolRoot>
    );
  }

  highlight = (name) => {
    if (this._highlight && this._highlight.name === name) {
      return;
    }

    let derivable = store.registry.get()[name];
    let components = collectReactComponents(derivable);
    let node = ReactDOM.findDOMNode(this);
    let nodeList = components
      .map(c => ReactDOM.findDOMNode(c))
      .filter(n => n !== node);

    this.removeHighlight();
    this._highlight = {nodeList, name};
    domlight.highlightAll(this._highlight.nodeList);
  };

  removeHighlight = () => {
    if (this._highlight) {
      domlight.unlightAll(this._highlight.nodeList);
      this._highlight = null;
    }
  };

}

let Devtool = ReactDerivable.reactive(DevtoolBase);

/**
 * Trace every React component instance from a derivable.
 */
function collectReactComponents(derivable) {
  return _collectReactComponents(derivable, []);
}

function _collectReactComponents(derivable, componentList = []) {
  if (derivable._activeChildren) {
    for (let i = 0; i < derivable._activeChildren.length; i++) {
      let child = derivable._activeChildren[i];
      if (
        child._type === 'REACTOR' &&
        child.component &&
        componentList.indexOf(child.component) === -1
      ) {
        componentList.push(child.component);
      } else {
        _collectReactComponents(child, componentList);
      }
    }
  }
  return componentList;
}

let node = null;

export function mountDevtool(options = {}) {
  if (node === null) {
    node = document.createElement('div');
    document.body.appendChild(node);
  }
  ReactDOM.render(<Devtool {...options} />, node);
}

export function unmountDevtool() {
  if (node) {
    ReactDOM.unmountComponentAtNode(node);
    document.body.removeChild(node);
    node = null;
  }
}

export function registerDerivable(derivable, name) {
  invariant(
    name,
    'Invalid registration: missing registration name'
  );
  store.registry.swap(registry =>
    ({...registry, [name]: derivable}));
  return derivable;
}
