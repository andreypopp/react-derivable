/**
 * @copyright 2016-present, Andrey Popp <8mayday@gmail.com>
 */

import {ReactUpdateReactor} from './index';

/**
 * Collect all React component instances which reference the derivable value
 * provided as argument.
 */
export function collectReactComponentList(derivable) {
  return _collectReactComponentList(derivable, []);
}

function _collectReactComponentList(derivable, componentList) {
  if (derivable._activeChildren) {
    for (let i = 0; i < derivable._activeChildren.length; i++) {
      let child = derivable._activeChildren[i];
      if (
        child.constructor === ReactUpdateReactor &&
        componentList.indexOf(child.component) === -1
      ) {
        componentList.push(child.component);
      } else {
        _collectReactComponentList(child, componentList);
      }
    }
  }
  return componentList;
}
