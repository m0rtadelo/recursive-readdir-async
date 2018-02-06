var assert = require('assert');
const rra = require('../module.js')

describe('recursive-readdir-async', function () {
    it('should load on require', function () {
        assert.notEqual(rra, undefined, 'module not loaded')
    });
    it('should return an object', function () {
        assert.equal(typeof rra, 'object', 'not returns a object, returns ' + typeof rra)
    })
    it('should return an object (Promise)', function () {
        const prom = rra.list('.');
        assert.equal(Promise.resolve(prom), prom, 'not returns a promise.')
    })
});
