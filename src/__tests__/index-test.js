/**
 * @copyright 2016, Prometheus Research, LLC
 * @copyright 2017-present, Andrey Popp
 *
 * @flow
 */

import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as Derivable from 'derivable';
import {render as r, renderMap} from '../index';
import TestRenderer from 'react-test-renderer';

test('render', function() {
  const answer = Derivable.atom(42);

  function Component() {
    return <div>The answer is {r(answer)}</div>;
  }

  const renderer = TestRenderer.create(<Component />);
  expect(renderer.toJSON()).toMatchSnapshot();
  answer.set(0);
  expect(renderer.toJSON()).toMatchSnapshot();

  renderer.unmount();
});

test('renderMap', function() {
  const answer = Derivable.atom(42);

  function Component() {
    return <div>The answer is {renderMap(answer, answer => <span>{answer}</span>)}</div>;
  }

  const renderer = TestRenderer.create(<Component />);
  expect(renderer.toJSON()).toMatchSnapshot();
  answer.set(0);
  expect(renderer.toJSON()).toMatchSnapshot();

  renderer.unmount();
});

test('the number of derivation computations', function() {
  const effects = [];
  const answer = Derivable.atom(42);
  const answerPlusOne = answer.derive(answer => {
    effects.push('answerPlusOne');
    return answer + 1;
  });

  function Component() {
    return <div>The answer is {r(answerPlusOne)}</div>;
  }

  const renderer = TestRenderer.create(<Component />);
  expect(renderer.toJSON()).toMatchSnapshot();
  expect(effects).toEqual(['answerPlusOne']);
  answer.set(0);
  expect(renderer.toJSON()).toMatchSnapshot();
  expect(effects).toEqual(['answerPlusOne', 'answerPlusOne']);

  renderer.unmount();

  answer.set(1);
  expect(effects).toEqual(['answerPlusOne', 'answerPlusOne']);
});

test('rendering to string', function() {
  const answer = Derivable.atom(42);

  function Component() {
    return <div>The answer is {r(answer)}</div>;
  }

  expect(ReactDOMServer.renderToString(<Component />)).toMatchSnapshot();
});
