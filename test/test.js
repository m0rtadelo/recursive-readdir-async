var assert = require('assert');
const rra = require('../module.js')
const path = require('path')

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
        for (let i=0;i<prom.length;i++) {
            if (prom[0].deep || prom[0].stats || prom[0].data || prom[0].extension || prom[0].fullname.indexOf('/') == -1)
                isOK = false
            else if (!(prom[0].name && prom[0].path && prom[0].fullname && prom[0].isDirectory != undefined))
                isOK = false
        }
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
        assert.equal(prom.length, 1, 'unexpected length')
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
        if (prom[0].hasOwnProperty('stats') || prom[0].hasOwnProperty('deep') || prom[0].hasOwnProperty('extension') || prom[0].hasOwnProperty('data'))
            isOK = false
        assert.equal(isOK, true, 'something wrong')
    });
    it('should not normalize and set realPath', async function () {
        const prom = await rra.list('.\\test\\test\\', { 'realPath': false, 'normalizePath': false })
        // As we pass in a 'Windows' path in this test, we can expect quite different behaviour on different platforms:
        if (path.sep === '\\') {
            // Windows et al
            assert.ok(prom[0].path.startsWith('.\\test\\test\\folder1'), 'Backslashed paths should work in Windows: ' + prom[0].path)
        } else {
            assert.deepEqual(prom, {
              "error": {
                "errno": -2,
                "code": "ENOENT",
                "syscall": "scandir",
                "path": ".\\test\\test\\"
              },
              "path": ".\\test\\test\\"
            }, "Backslashed paths are only supported on Windows platforms.");
        }
    });
    it('should normalize Windows paths on all platforms by default', async function () {
        const prom = await rra.list('.\\test\\test\\', { 'realPath': false })
        assert.ok(prom[0].path.startsWith('./test/test/folder1'), 'Backslashed paths should be normalized by default on any platform: ' + prom[0].path)
    });
    it('should include only paths that exists in settings.include', async function () {
        const prom = await rra.list('./test/test', { 'mode': rra.TREE, 'ignoreFolders': false, 'include': ['/subfolder2'] })
        let isOK = false
        if (prom.length == 1 && prom[0].fullname.indexOf('/test/test/folder2') > -1)
            isOK = true
        assert.equal(isOK, true, 'path folder2 must be included' + (prom.length ? prom[0].fullname : ""))
        assert.strictEqual(prom[0].content.length, 1, 'path folder2 must include subfolder content')
        assert.ok(prom[0].content[0].fullname.indexOf('/subfolder2') > 7, 'path folder2 must include subfolder2 in its tree')
    });
    it('should exclude paths that exists in settings.exclude', async function () {
        const prom = await rra.list('./test/test/', { 'exclude': ['subfolder2'], 'mode': rra.TREE })
        let isOK = false
        if (prom.length == 1 && prom[0].fullname.indexOf('/test/test/folder1') > -1)
            isOK = true
        assert.equal(isOK, true, 'path folder2 must be excluded' + (prom.length ? prom[0].fullname : ""))
    });
    it('should include file data if readContent is true', async function() {
        const prom = await rra.list('./test/test/', { 'readContent': true, 'mode': rra.LIST })
        assert.notEqual(prom[0].data, undefined, 'data unavailable')
        assert.notEqual(prom[1].data, undefined, 'data unavailable')
    });
    it('should return data in base64 format', async function() {
        const prom = await rra.list('./test/test/folder1/subfolder1/subsubf1/', { 'include':['subfile1.txt'], 'readContent': true, 'mode': rra.LIST, 'recursive': false })
        console.log()
        assert.equal(prom.length,1,'error with include option')
        assert.equal(prom[0].data, 'c29tZXRoaW5n', 'unexpected base64 data')
    });

});

describe('bugfix check', function () {
    it('should return data when readContent are the only active option', async function() {
        const prom = await rra.list('./test/test/folder1/',
        {'readContent': true, 'ignoreFolders':false, 'stats':false, 'recursive': false, });
        assert.notEqual(prom[0].data, undefined, 'data expected')
        assert.equal(prom[0].stats, undefined, 'stats unexpected')
    });
    it('should return subfolders when ignoreFolders are set to false', async function() {
        const prom = await rra.list('./test/test/folder1/',
        {'readContent': false, 'ignoreFolders':false, 'stats':false, 'recursive': false, });
        assert.notEqual(prom[0].name, undefined, 'data expected')
        assert.equal(prom[0].specs, undefined, 'specs unexpected')
        assert.equal(prom.length,2,'should return 2 items')
    });
    it('should add extension field in files and folders and add isDirectory if ignoreFolders is false', async function() {
        let counter=0;
        const prom = await rra.list('./test/test/folder1/',
        {'readContent': false, 'ignoreFolders':false, 'extensions':true, 'recursive': false, });
        for(let i=0;i<prom.length;i++) {
            if(prom[i].isDirectory && prom[i].extension != undefined)
                counter++
            if(!prom[i].isDirectory && prom[i].extension != undefined)
                counter++
        }
        assert.equal(counter, 2, 'extension unexpected')
        assert.equal(prom.length,2,'should return 2 items')
    });
    it('should add isDirectory field for mode TREE', async function() {
        const prom = await rra.list('./test/test/folder1/',
        {'readContent': false, 'ignoreFolders':true, 'stats':false, 'recursive': false, 'mode':rra.TREE});
        assert.notEqual(prom[0].isDirectory, undefined, 'isDirectory expected')
    });
    it('should not add isDirectory field for non spec-required options', async function() {
        const prom = await rra.list('./test/test/folder1/',
        {'readContent': false, 'ignoreFolders':true, 'stats':false, 'recursive': false, 'mode':rra.LIST});
        assert.equal(prom[0].isDirectory, undefined, 'isDirectory unexpected')
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
    it('controlled error for readFile (must throw error)', async function () {
        let isOk = false
        try {
            await rra.readFile('./test/test/inexistent.file');
        } catch (error) {
            isOk = true
        }
        assert.equal(isOk, true, 'unexpected behavior (no error)')
    })

    // towards 100% coverage: generate failure to test line #175 (try/catch)
    it('controlled error for exceptions - part 1: subtree fatality', async function () {
        let isOk = false
        try {
            let count = 0;
            const res = await rra.list('./test', function progressUserCallback() {
                // fake failure.
                count++;
                if (count === 2) throw new Error('boom!');
            });
            if (!res.error && res[1].error)
                isOk = true
            assert.equal(isOk, true, 'unexpected behavior (no json with error)')
        } catch (error) {
            isOk = false
        }
        assert.equal(isOk, true, 'unexpected behavior (error or no json with error)')
    })

    // complete the previou test for the root entry: regression test: previously rra
    // would pass this exception through to the caller.
    it('controlled error for exceptions - part 2: root fatality', async function () {
        let isOk = false
        try {
            let count = 0;
            const res = await rra.list('./test', function progressUserCallback() {
                // fake failure.
                count++;
                if (count === 1) throw new Error('boom!');
            });
            if (res[0].error)
                isOk = true
            assert.equal(isOk, true, 'unexpected behavior (no json with error)')
        } catch (error) {
            isOk = false
        }
        assert.equal(isOk, true, 'unexpected behavior (error or no json with error)')
    })

    // towards 100% coverage: generate failure to test line #99 (try/catch)
    it('controlled error for exceptions - part 3: file system fatality', async function () {
        let isOk = false
        let rpf = rra.fs.realpath;
        try {
            let count = 0;
            rra.fs.realpath = function fakeRealPath(path, cb) {
                throw new Error('boom');
            };
            const res = await rra.list('./test');
            if (res.error)
                isOk = true
            assert.equal(isOk, true, 'unexpected behavior (no json with error)')
        } catch (error) {
            isOk = false
        }
        rra.fs.realpath = rpf;
        assert.equal(isOk, true, 'unexpected behavior (error or no json with error)')
    })

    // towards 100% coverage: generate failure to test line #144 (try/catch)
    it('controlled error for exceptions - part 4: file system fatality #2', async function () {
        let rpf = rra.fs.stat;
        try {
            rra.fs.stat = function fakeStat(path, cb) {
                if (/test\/test$/.test(path)) {
                    // console.error('STAT:', path);
                    cb(new Error('boom'));
                    return;
                }

                rpf(path, cb);
            };
            const res = await rra.list('./test');

            assert.ok(!res.error, 'unexpected behavior')
            assert.strictEqual(res.length, 2, 'unexpected behavior')
            assert.ok(res[0].error, 'unexpected behavior (no json with error for item)')
        } catch (error) {
            assert.ok(false, 'unexpected behavior')
        }
        rra.fs.realpath = rpf;
    })
});