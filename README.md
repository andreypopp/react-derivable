# React Reactive

    import {atom} from 'derivable'
    import reactive from 'react-reactive'
    import React from 'react'
    import ReactDOM from 'react-dom'

    let Hello = reactive(props =>
      <div>{props.message.get()}</div>
    )

    let message = atom('Hello, World!')

    ReactDOM.render(<Hello message={message} />, ...)

    message.set('Works!')
