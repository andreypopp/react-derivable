# React Derivable

[![Travis build status](https://img.shields.io/travis/andreypopp/react-derivable/master.svg)](https://travis-ci.org/andreypopp/react-derivable)
[![npm](https://img.shields.io/npm/v/react-derivable.svg)](https://www.npmjs.com/package/react-derivable)

React Derivable implements fine grained subscriptions for reactive values
defined with [derivable][].

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [`render(derivable: Derivable<V>): React.Node`](#renderderivable-derivablev-reactnode)
  - [`renderMap(derivable: Derivable<V>, (value: V) => React.Node): React.Node`](#rendermapderivable-derivablev-value-v--reactnode-reactnode)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

Install from npm (`react` and `derivable` are peer dependencies and must be
installed for an application too):

```
% npm install react
% npm install derivable@2.0.0-beta.2
% npm install react-derivable
```

## Usage

Define your application data with [derivable][]:

```js
import {atom} from 'derivable'

let message = atom('Hello, World!')
```

Now you can define a React component which accepts and uses in render a reactive
value `message`, note how we wrap the `message` so that it rerenders on changes:

```js
import React from 'react'
import {render as r} from 'react-derivable'

let Hello = props =>
  <div>{r(props.message)}</div>
```

Render `<Hello />` into DOM and pass it a reactive `message` value:

```js
import ReactDOM from 'react-dom'

ReactDOM.render(<Hello message={message} />, ...)
```

Each time reactive value updates - the corresponding part of the React component
tree gets rerendered:

```js
message.set('Works!')
```

## API

### `render(derivable: Derivable<V>): React.Node`

### `renderMap(derivable: Derivable<V>, (value: V) => React.Node): React.Node`

[React]: https://reactjs.org
[derivable]: https://github.com/ds300/derivablejs
[immutable]: https://github.com/facebook/immutable-js
[history]: https://github.com/ReactJSTraining/history§
