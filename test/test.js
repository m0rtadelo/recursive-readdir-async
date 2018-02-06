var assert = require('assert');
const rra = require('../module.js')

describe('recursive-readdir-async load', function () {

    // Creating test structure
    const fs = require('fs-extra')
    try {
        fs.removeSync('./test/test/')
    } catch (err) {
        // ignore
    }
    fs.mkdirSync('./test/test/')
    fs.mkdirSync('./test/test/folder1/')
    fs.mkdirSync('./test/test/folder1/subfolder1/')
    fs.mkdirSync('./test/test/folder1/subfolder1/subsubf1/')
    fs.writeFileSync('./test/test/folder1/file1.txt', 'some')
    fs.writeFileSync('./test/test/folder1/subfolder1/subsubf1/subfile1.txt', 'something')
    fs.mkdirSync('./test/test/folder2/')
    fs.mkdirSync('./test/test/folder2/subfolder2/')

    it('should load on require', function () {
        assert.notEqual(rra, undefined, 'module not loaded')
    });
    it('should return an object', function () {
        assert.equal(typeof rra, 'object', 'not returns a object, returns ' + typeof rra)
    })
    it('should return an object (Promise) when ok', function () {
        const prom = rra.list('.');
        assert.equal(Promise.resolve(prom), prom, 'not returns a promise.')
    })
    it('should return an object (Promise) when ko', function () {
        const prom = rra.list('....../0/0...#@');
        assert.equal(Promise.resolve(prom), prom, 'not returns a promise.')
    })
    it('should load without options (with callback)', async function () {
        let cb = false
        const prom = await rra.list('./test/test/folder1/', function (file) {
            cb = true
        });
        assert.equal(cb, true, 'not loads supressing options.')
    })
});

describe('recursive-readdir-async usage', function () {
    it('should return an array of 2 items (only files)', async function () {
        const prom = await rra.list('./test/test/')
        assert.equal(prom.length, 2, 'returns ' + prom.length)
    });
    let options = {
        ignoreFolders: false
    }
    it('should return an array of 7 items (files and folders)', async function () {
        const prom = await rra.list('./test/test/', options)
        assert.equal(prom.length, 7, 'returns ' + prom.length)
    });
    it('should return an array of 2 items (folders)', async function () {
        options = {
            ignoreFolders: false,
            recursive: false
        }
        const prom = await rra.list('./test/test/', options)
        assert.equal(prom.length, 2, 'returns ' + prom.length)
    });
    it('should return an array of 0 items (empty folders LIST)', async function () {
        options = {
            ignoreFolders: true,
            recursive: true
        }
        const prom = await rra.list('./test/test/folder2/', options)
        assert.equal(prom.length, 0, 'returns ' + prom.length)
    });
    it('should return an array of 0 items (empty folders TREE)', async function () {
        options = {
            mode: rra.TREE
        }
        const prom = await rra.list('./test/test/folder2/', options)
        assert.equal(prom.length, 0, 'returns ' + prom.length)
    });
    it('should delete file with 4 bytes (remains subfile1.txt)', async function () {
        options = {
            mode: rra.LIST,
            recursive: true,
            ignoreFolders: true,
            stats: true
        }
        const prom = await rra.list('./test/test/', options, function (file) {
            if (file.stats.size === 4)
                return true;
        })
        let result = false
        if (prom[0].name == 'subfile1.txt' && prom.length == 1)
            result = true
        assert.equal(result, true, 'returns ' + prom[0].name)
    });
    it('should trigger function 7 times', async function () {
        options = {
            mode: rra.LIST,
            recursive: true,
            ignoreFolders: false,
            stats: false
        }
        let counter = 0
        const prom = await rra.list('./test/test/', options, function (file) {
            counter++
        })
        assert.equal(counter, 7, 'returns ' + prom.length)
    });

});