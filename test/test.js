var assert = require('assert');
const rra = require('../module.js')

// UT testing
describe('load', function () {

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
    fs.writeFileSync('./test/test/folder1/file1.TXT', 'some')
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
        await rra.list('./test/test/folder1/', function () {
            cb = true
        });
        assert.equal(cb, true, 'not loads supressing options.')
    })
});

describe('usage', function () {
    it('checking defaults', async function () {
        let isOK = true
        const prom = await rra.list('./test/test/')
        if (prom[0].deep || prom[0].stats || prom[0].extension || prom[0].fullname.indexOf('/') == -1)
            isOK = false
        else if (!(prom[0].name && prom[0].path && prom[0].fullname && prom[0].isDirectory != undefined))
            isOK = false
        assert.equal(isOK, true, prom[0])
    });
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
        const prom = await rra.list('./test/test/', options, function () {
            counter++
        })
        assert.equal(counter, 7, 'returns ' + prom.length)
    });
    it('should ignore folder2 structure', async function () {
        options = {
            mode: rra.TREE,
            recursive: true,
            ignoreFolders: true,
            stats: false,
            deep: true,
            extensions: true
        }
        const prom = await rra.list('./test/test/', options)
        assert.equal(prom.length, 1, 'returns ' + prom.length)
    });
    it('should return deep & lowercase extensions properly', async function () {
        let isOK = true
        options = {
            mode: rra.LIST,
            recursive: true,
            ignoreFolders: true,
            stats: false,
            deep: true,
            extensions: true
        }
        const prom = await rra.list('./test/test/', options)
        for (var i = 0; i < prom.length; i++) {
            if (prom[i].extension != '.txt' || isNaN(prom[i].deep))
                isOK = false
            if (prom[i].name == 'file1.TXT' && prom[i].deep != 1)
                isOK = false
            if (prom[i].name == 'subfile1.txt' && prom[i].deep != 3)
                isOK = false
        }
        assert.equal(isOK, true, 'something went wrong')
    });
    it('should not return keys (deep, extension,... ) if not set', async function () {
        const prom = await rra.list('./test/test/')
        let isOK = true
        if (prom[0].hasOwnProperty('stats') || prom[0].hasOwnProperty('deep') || prom[0].hasOwnProperty('extension'))
            isOK = false
        assert.equal(isOK, true, 'something wrong')
    });
    it('should not normalize and set realPath (only works in Windows)', async function () {
        const prom = await rra.list('.\\test\\test\\', { 'realPath': false, 'normalizePath': false })
        let isOK = true
        if (!prom[0].path.startsWith('.\\test\\test\\folder1'))
            isOK = false
        assert.equal(isOK, true, 'Working in Linux? ' + prom[0].path)
    });
    it('should include only paths that exists in settings.include', async function () {
        const prom = await rra.list('./test/test', { 'mode': rra.TREE, 'ignoreFolders': false, 'include': ['/subfolder2'] })
        let isOK = false
        if (prom[0].fullname.indexOf('/test/test/folder2') > -1 && prom.length == 1)
            isOK = true
        assert.equal(isOK, true, 'path folder2 must be included' + prom[0].fullname)
    });
    it('should exclude paths that exists in settings.exclude', async function () {
        const prom = await rra.list('./test/test/', { 'exclude': ['subfolder2'], 'mode': rra.TREE })
        let isOK = false
        if (prom[0].fullname.indexOf('/test/test/folder1') > -1 && prom.length == 1)
            isOK = true
        assert.equal(isOK, true, 'path folder2 must be excluded' + prom[0].fullname)
    });
});

describe('error control', function () {
    it('controlled error for list (must be quiet and return error into object)', async function () {
        let isOk = false
        try {
            const res = await rra.list('./test/test/inexistent.file');
            if (res.error)
                isOk = true
        } catch (error) {
            isOk = false
        }
        assert.equal(isOk, true, 'unexpected behavior (error or no json with error)')
    })
    it('controlled error for stat (must throw error)', async function () {
        let isOk = false
        try {
            await rra.stat('./test/test/inexistent.file');
        } catch (error) {
            isOk = true
        }
        assert.equal(isOk, true, 'unexpected behavior (no error)')
    })
});