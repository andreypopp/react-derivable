'use strict';

let Benchmark = require('benchmark');
let React = require('react');

let {atom} = require('derivable');
let {reactive} = require('../');

let suite = new Benchmark.Suite();

let message = atom('ok');
let Component = reactive(() => React.createElement('div', null, message.get()));
let component = new Component({}, {});
component.componentWillMount && component.componentWillMount();

suite
.add('management overhead', function() {
  component.render();
  component.componentWillUpdate && component.componentWillUpdate();
})
.on('cycle', function(event) {
  console.log(String(event.target)); // eslint-disable-line no-console
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name')); // eslint-disable-line no-console
})
.run({'async': true});
