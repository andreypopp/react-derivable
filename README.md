# React Derivable

[![Travis build status](https://img.shields.io/travis/andreypopp/react-derivable/master.svg)](https://travis-ci.org/andreypopp/react-derivable)
[![npm](https://img.shields.io/npm/v/react-derivable.svg)](https://www.npmjs.com/package/react-derivable)

React Derivable allows to define [React][] components which re-render when reactive
values (defined in terms of [derivable][]) used in `render()` change.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [`reactive(Component)`](#reactivecomponent)
  - [`pure(Component)`](#purecomponent)
  - [`pure(Component).withEquality(eq)`](#purecomponentwithequalityeq)
- [Guides](#guides)
  - [Local component state](#local-component-state)
  - [Flux/Redux-like unidirectional data flow](#fluxredux-like-unidirectional-data-flow)
  - [Binding to external state sources](#binding-to-external-state-sources)
  - [Lifting regular React components to work with derivable values](#lifting-regular-react-components-to-work-with-derivable-values)
- [Examples](#examples)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

Install from npm (`react` and `derivable` are peer dependencies and must be
installed for an application too):

```
% npm install react
% npm install derivable@1.0.0-beta10
% npm install react-derivable
```

## Usage

Define your application state in terms of [derivable][]:

```js
import {atom} from 'derivable'

let message = atom('Hello, World!')
```

Define a React component which accepts and uses in render a reactive value
`message`:

```js
import React from 'react'

let Hello = props =>
  <div>{props.message.get()}</div>
```

Now produce a new reactive component using higher-order `reactive` component

```js
import reactive from 'react-derivable'

let ReactiveHello = reactive(Hello)
```

Render `<ReactiveHello />` into DOM and pass it a reactive `message` value:

```js
import ReactDOM from 'react-dom'

ReactDOM.render(<ReactiveHello message={message} />, ...)
```

Each time reactive value updates - component gets rerendered:

```js
message.set('Works!')
```

## API

### `reactive(Component)`

As shown in the usage section above `reactive(Component)` decorator produces a
reactive component out of an original one.

Reactive components re-render when one of the reactive values referenced from
within `render()` change.

```js
import React from 'react'
import {reactive} from 'react-derivable'

let ReactiveFunctional = reactive(props =>
  <div>{props.message.get()}</div>)

let ReactiveClassBased = reactive(class extends React.Component {

  render() {
    return <div>{this.props.message.get()}</div>
  }
})
```

### `pure(Component)`

Makes component reactive and defines `shouldComponentUpdate` which compares
`props` and `state` with respect to reactive values.

That allows to get rid of unnecessary re-renders.

```js
import React from 'react'
import {pure} from 'react-derivable'

let PureFunctional = pure(props =>
  <div>{props.message.get()}</div>)

let PureClassBased = pure(class extends React.Component {

  render() {
    return <div>{this.props.message.get()}</div>
  }
})
```

### `pure(Component).withEquality(eq)`

Same as using `pure(Component)` but with a custom equality function which is
used to compare props/state and reactive values.

Useful when using with libraries like [Immutable.js][immutable] which provide
its equality definition:

```js
import * as Immutable from 'immutable'
import {pure} from 'react-derivable'

let Pure = pure(Component).withEquality(Immutable.is)
```

## Guides

### Local component state

React has its own facilities for managing local component state. In my mind it
is much more convenient to have the same mechanism serve both local component
state and global app state management needs. That way composing code which uses
different state values and updates becomes much easier. Also refactorings which
change from where state is originated from are frictionless with this approach.

As any component produced with `reactive(Component)` reacts on changes to
reactive values dereferenced in its `render()` method we can take advantage of
this.

Just store some atom on a component instance and use it to render UI and update
its value when needed.

That's all it takes to introduce local component state:

```js
import {Component} from 'react'
import {atom} from 'derivable'
import {reactive} from 'react-derivable'

class Counter extends Component {

  counter = atom(1)

  onClick = () =>
    this.counter.swap(value => value + 1)

  render() {
    return (
      <div>
        <div>{this.counter.get()}</div>
        <button onClick={this.onClick}>Next</button>
      </div>
    )
  }
}

Counter = reactive(Counter)
```

### Flux/Redux-like unidirectional data flow

Flux (or more Redux) like architecture can be implemented easily with reactive
values.

You would need to create a Flux architecture blueprint as a function which
initialises an atom with some initial state and sets up action dispatching as a
reducer (a-la Redux):

```js
import {atom} from 'derivable'

function createApp(transformWithAction, initialState = {}) {
  let state = atom(initialState)
  return {
    state: state.derive(state => state),
    dispatch(action) {
      let transform = transformWithAction[action.type]
      state.swap(state => transform(state, action))
    }
  }
}
```

Now we can use `createApp()` function to define an application in terms of
initial state and actions which transform application state:

```js
const CREATE_TODO = 'create-todo'

let todoApp = createApp(
  {
    [CREATE_TODO](state, action) {
      let todoList = state.todoList.concat({text: action.text})
      return {...state, todoList}
    }
  },
  {todoList: []}
)

function createTodo(text) {
  todoApp.dispatch({type: CREATE_TODO, text})
}
```

Now it is easy to render app state into UI and subscribe to state changes
through the `reactive(Component)` decorator:

```js
import React from 'react'
import {reactive} from 'react-derivable'

let App = reactive(() =>
  <ul>
    {todoApp.state.get().todoList.map(item => <li>{item.text}</li>)}
  </ul>
)
```

### Binding to external state sources

Sometimes state is originated not from application but from some external
sources. One notorious example is routing where state is stored and partially
controlled by a browser.

It is still useful to have access to that state and do it using the homogenous
API.

Like we already discovered we can use derivable library to implement local
component state and flux like state management easily. Let's see how we can use
derivable to implement routing based on browser navigation state (HTML5
pushState API).

We'll be using the [history][] npm package which makes working with HTML5 API
smooth and simple.

First step is to make a history object which will hold the navigation state and
some methods to influence those state:

```js
import {createHistory as createBaseHistory} from 'history'
import {atom} from 'derivable'

function createHistory(options) {
  let history = createBaseHistory(options)
  let location = atom(history.getCurrentLocation())
  history.listen(loc => location.set(loc));
  history.location = location.derive(location => location)
  return history
}

let history = createHistory()
```

Now to build the router we just need to use `history.location` value in
`render()`:

```js
let Router = reactive(props => {
  let {pathname} = history.location.get()
  // Any complex pathname matching logic here, really.
  if (pathname === '/') {
    return <Home />
  } else if (pathname === '/about') {
    return <About />
  } else {
    return <NotFound />
  }
})
```

Now to change location you would need another component which transforms
location state: Link. Also it could track "active" state (if link's location is
the current location):

```js
let Link = reactive(props => {
  let {pathname} = history.location.get()
  let className = pathname == props.href ? 'active' : ''
  let onClick = e => {
    e.preventDefault()
    history.push(props.href)
  }
  return <a {...props} onClick={onClick} className={className} />
})
```

### Lifting regular React components to work with derivable values

If you already have a React component which works with regular JS values but
want it to work with derivable values you can use this little trick:

```js
import {atom, unpack} from 'derivable'
import {reactive} from 'react-derivable'

class Hello extends React.Component {

  render() {
    return <div>{this.props.message}</div>
  }
}

let ReactiveHello = reactive(props =>
  <Hello message={props.message.get()} {...props} />)

<ReactiveHello message={atom('Hi')} />
```

Also because you are passing values as plain props they are going to participate
in React component lifecycle as usual (e.g. you can access prev values in
`componentDidUpdate`):

```js
class Hello extends React.Component {

  render() {
    return <div>{this.props.message}</div>
  }

  componentDidUpdate(prevProps) {
    if (prevProps.message !== this.props.message) {
      // do something!
    }
  }
}

let ReactiveHello = reactive(props =>
  <Hello {...unpack(props)} />)
```

## Examples

See examples in [examples](./example) directory.

[React]: https://reactjs.org
[derivable]: https://github.com/ds300/derivablejs
[immutable]: https://github.com/facebook/immutable-js
[history]: https://github.com/ReactJSTraining/history§
