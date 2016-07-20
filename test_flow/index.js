 /**
  * @flow
  */

import type {Derivable} from 'derivable';

import {atom} from 'derivable';
import * as React from 'react';
import * as ReactDerivable from 'react-derivable';

class X extends React.Component {

  props: {
    message: Derivable<string>
  };

  render() {
    return <div>{this.props.message.get()}</div>;
  }
}

// $ExpectError
<X />;

// $ExpectError
<X message="x" />;

// $ExpectError
<X message={atom(42)} />;

let Y = ReactDerivable.reactive(X);

// $ExpectError
<Y />;

// $ExpectError
<Y message="x" />;

// $ExpectError
<Y message={atom(42)} />;

let Z = ReactDerivable.pure(X);

// $ExpectError
<Z />;

// $ExpectError
<Z message="x" />;

// $ExpectError
<Z message={atom(42)} />;
