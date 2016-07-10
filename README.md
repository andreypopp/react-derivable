# React Reactive

React Reactive allows to define [React][] components which re-render when reactive
values (defined in terms of [derivable][])_ used in `render()` change.

## Installation

Install from npm (`react` and `derivable` are peer dependencies and must be
installed for an application too):

```
% npm install react
% npm install derivable
% npm install react-reactive
```

## Usage

###### Model application state

Define your application state in terms of [derivable][]:

```js
import {atom} from 'derivable'

let message = atom('Hello, World!')
```

###### Define UI

Define a React component which accepts and uses in render a reactive value
`message`:

```js
import React from 'react'

let Hello = props =>
  <div>{props.message.get()}</div>
```

###### Make UI reactive

Now produce a new reactive component using higher-order `reactive` component

```js
import reactive from 'react-reactive'

let ReactiveHello = reactive(Hello)
```

Or you can define reactive components right away:

```js
let Hello = reactive(props =>
  <div>{props.message.get()}</div>)
```

Or using ES2015 class syntax:

```js
let Hello = reactive(
  class extends React.Component {

    render() {
      return <div>{this.props.message.get()}</div>
    }
  }
)
```

###### Render into DOM

Render `<ReactiveHello />` into DOM and pass it a reactive `message` value:

```js
import ReactDOM from 'react-dom'

ReactDOM.render(<Hello message={message} />, ...)
```

###### Update model

Each time reactive value updates - component gets rerendered:

```js
message.set('Works!')
```

[React]: https://reactjs.org
[derivable]: https://github.com/ds300/derivablejs
