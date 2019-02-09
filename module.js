/**
 * project: recursive-readdir-async
 * author: m0rtadelo (ricard.figuls)
 * license: MIT
 * 2018
 */
'use strict';
// constants
/**
 * creates list object with content
 */
const LIST = 1
/**
 * creates tree object with content
 */
const TREE = 2
/**
 * Native fs module
 * @preserve
 */
const FS = require('fs')
/**
 * Native path module
 * @preserve
 */
const PATH = require('path')
// variables
let pathSimbol = '/';
/**
 * Returns a Promise with Stats info of the item (file/folder/...)
 * @param {string} file 
 * @returns {Promise} promise stat object info
 * @preserve
 */
async function stat(file) {
    return new Promise(function (resolve, reject) {
        FS.stat(file, function (err, stats) {
            if (err) {
                reject(err);
            } else {
                resolve(stats);
            }
        })
    });
}
/**
 * Returns if an item should be added based on include/exclude options. 
 * @param {string} path item path
 * @param {object} settings options
 * @returns {boolean} returns if item must be added
 */
function checkItem(path, settings) {
    for (let i = 0; i < settings.exclude.length; i++) {
        if (path.indexOf(settings.exclude[i]) > -1)
            return false
    }
    return true
}
/**
 * Returns a Promise with an objects info array
 * @param {string} path the path to be searched for
 * @param {object} settings options
 * @param {number} deep folder depth
 */
async function myReaddir(path, settings, deep) {
    const data = []
    return new Promise(function (resolve, reject) {

        try {
            // Asynchronously computes the canonical pathname by resolving ., .. and symbolic links.
            FS.realpath(path, function (err, rpath) {
                if (err || settings.realPath === false)
                    rpath = path

                // Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
                if (settings.normalizePath)
                    rpath = normalizePath(rpath)

                // Reading contents of path
                FS.readdir(rpath, function (err, files) {

                    // If error reject them
                    if (err) {
                        // console.error(err)
                        reject(err);
                    } else {

                        // Iterate trough elements (files and folders)
                        for (let i = 0, tam = files.length; i < tam; i++) {
                            const obj = {
                                'name': files[i],
                                'path': rpath,
                                'fullname': rpath + (rpath.endsWith(pathSimbol) ? '' : pathSimbol) + files[i]
                            }
                            if (checkItem(obj.fullname, settings)) {
                                addOptionalKeys(obj, files[i]);
                                data.push(obj);
                            }
                        }

                        // Finish, returning content
                        resolve(data);
                    }
                })
            })
        } catch (err) {
            // If error reject them
            reject(err)
        }
    });
    /**
     * Adds optional keys to item
     * @param {object} obj item object
     * @param {string} file filename
     */
    function addOptionalKeys(obj, file) {
        if (settings.extensions)
            obj.extension = (PATH.extname(file)).toLowerCase();
        if (settings.deep)
            obj.deep = deep;
    }
}
/**
 * Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
 * @param  {string} path windows/unix path
 * @return {string} normalized path (unix style)
 */
function normalizePath(path) {
    return path.replace(/\\/g, '/');
}
/**
 * Returns an array of items in path
 * @param {string} path path
 * @param {object} settings options
 * @param {function} progress callback progress
 */
async function listDir(path, settings, progress, deep) {
    let list
    deep = (deep == undefined ? 0 : deep)
    try {
        list = await myReaddir(path, settings, deep);
    } catch (err) {
        return { 'error': err, 'path': path }
    }
    if (settings.stats || settings.recursive || settings.ignoreFolders || settings.mode == TREE) {

        list = await statDir(list, settings, progress, deep);
    }

    onlyInclude();

    return list;

    function onlyInclude() {
        for (let j = 0; j < settings.include.length; j++) {
            for (let i = list.length - 1; i > -1; i--) {
                if (list[i].fullname.indexOf(settings.include[j]) == -1)
                    list.splice(i, 1);
            }
        }
    }
}
/**
 * Returns an object with all items with selected options
 * @param {object} list items list
 * @param {object} settings options
 * @param {function} progress callback progress
 * @param {number} deep folder depth
 */
async function statDir(list, settings, progress, deep) {
    let isOk = true;
    for (let i = list.length - 1; i > -1; i--) {
        try {
            list = await statDirItem(list, i, settings, progress, deep);
        }
        catch (err) {
            list[i].error = err;
        }
        if (progress != undefined)
            isOk = !progress(list[i], list.length - i, list.length);
        if ((list[i].isDirectory && settings.ignoreFolders && list[i].content == undefined) || !isOk)
            list.splice(i, 1);
    }
    return list;
}
/**
 * Returns an object with updated item information
 * @param {object} list items list
 * @param {number} i index of item
 * @param {object} settings options
 * @param {function} progress callback progress
 * @param {number} deep folder depth
 */
async function statDirItem(list, i, settings, progress, deep) {
    const stats = await stat(list[i].fullname);
    list[i].isDirectory = stats.isDirectory();
    if (settings.stats)
        list[i].stats = stats
    if (list[i].isDirectory && settings.recursive) {
        if (settings.mode == LIST)
            list = list.concat(await listDir(list[i].fullname, settings, progress, deep + 1));
        else {
            list[i].content = await listDir(list[i].fullname, settings, progress, deep + 1);
            if (list[i].content.length == 0)
                list[i].content = null;
        }
    }
    return list;
}

/**
 * Returns a javascript object with directory items information (non blocking async with Promises)
 * @param {string} path the path to start reading contents
 * @param {object} options options (mode, recursive, stats, ignoreFolders)
 * @param {function} progress callback with item data and progress info for each item
 * @preserve
 */
async function list(path, options, progress) {

    // options skipped?
    if (typeof options == 'function')
        progress = options

    // Setting default settings
    const settings = {
        mode: LIST,
        recursive: true,
        stats: false,
        ignoreFolders: true,
        extensions: false,
        deep: false,
        realPath: true,
        normalizePath: true,
        include: [],
        exclude: []
    }

    // Aplying options (if set)
    setOptions();

    // Setting pathSimbol if normalizePath is disabled
    if (settings.normalizePath === false) {
        pathSimbol = PATH.sep
    } else {
        pathSimbol = '/'
    }

    // Reading contents
    return await listDir(path, settings, progress);

    function setOptions() {
        if (options != undefined) {
            if (options.recursive != undefined)
                settings.recursive = options.recursive;
            if (options.mode != undefined)
                settings.mode = options.mode;
            if (options.stats != undefined)
                settings.stats = options.stats;
            if (options.ignoreFolders != undefined)
                settings.ignoreFolders = options.ignoreFolders;
            if (options.deep != undefined)
                settings.deep = options.deep;
            if (options.extensions != undefined)
                settings.extensions = options.extensions;
            if (options.realPath != undefined)
                settings.realPath = options.realPath;
            if (options.normalizePath != undefined)
                settings.normalizePath = options.normalizePath;
            if (options.include != undefined)
                settings.include = options.include;
            if (options.exclude != undefined)
                settings.exclude = options.exclude;
        }
    }
}
module.exports = {
    LIST: LIST,
    TREE: TREE,
    list: list,
    stat: stat,
    fs: FS,
    path: PATH
}