'use strict';

export default 'Working with modules';

export function select(selector, scope = document) {
    return scope.querySelector(selector);
} 

export function listen(event, selector, callback) {
    return selector.addEventListener(event, callback);
}

export function selectAll(selector, scope = document) {
    return [...scope.querySelectorAll(selector)];
}

