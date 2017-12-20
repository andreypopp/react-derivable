/**
 * @flow
 */

import * as React from 'react';
import * as Derivable from 'derivable';
import {renderMap, render as r} from './src';

const store = Derivable.atom({
  name: 'Andrey',
});

const name = store.derive(state => state.name);

function TestRenderReactive() {
  return <div>Hello, {renderMap(name, name => <span>{name}</span>)}</div>;
}

function TestRenderReturnReactive() {
  return renderMap(name, name => <div>Hello, {name}</div>);
}

function TestRenderReturnR() {
  return r(name);
}

function TestRenderR() {
  return <div>Hello, {r(name)}</div>;
}
