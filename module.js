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
// native modules
const FS = require('fs')
const PATH = require('path')
/**
 * returns a Promise with Stats info of the file
 * @param {string} file 
 */
async function stat(file) {
    return new Promise(function (resolve, reject) {
        FS.stat(file, function (err, stats) {
            if (err) {
                // console.error(err)
                reject(err);
            } else {
                resolve(stats);
            }
        })
    });
}
/**
 * Returns a Promise with an objects info array
 * @param {string} path the path to be searched for
 */
async function myReaddir(path, settings, deep) {
    const data = []
    return new Promise(function (resolve, reject) {

        try {
            // Asynchronously computes the canonical pathname by resolving ., .. and symbolic links.
            FS.realpath(path, function (err, rpath) {
                if (err)
                    rpath = path

                // Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
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
                                'fullname': rpath + '/' + files[i]
                            }
                            if (settings.extensions)
                                obj.extension = (PATH.extname(files[i])).toLowerCase()
                            if (settings.deep)
                                obj.deep = deep
                            data.push(obj);
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
}
/**
 * Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
 * @param  {string} path
 * @return {string}
 */
function normalizePath(path) {
    return path.replace(/\\/g, '/');
}
/**
 * Returns an array of items in path
 * @param {*} path 
 * @param {*} settings 
 * @param {*} progress 
 */
async function listDir(path, settings, progress, deep) {
    let list
    if (deep == undefined)
        deep = 0;
    try {
        list = await myReaddir(path, settings, deep);
    } catch (err) {
        return { 'error': err, 'path': path }
    }
    if (settings.stats || settings.recursive || settings.ignoreFolders || settings.mode == TREE) {
        let isOk = true
        for (let i = list.length - 1; i > -1; i--) {
            try {
                const stats = await stat(list[i].fullname)
                list[i].isDirectory = stats.isDirectory()
                if (settings.stats)
                    list[i].stats = stats
                if (list[i].isDirectory && settings.recursive) {
                    if (settings.mode == LIST)
                        list = list.concat(await listDir(list[i].fullname, settings, progress, deep+1))
                    else {
                        list[i].content = await listDir(list[i].fullname, settings, progress, deep+1)
                        if (list[i].content.length == 0)
                            list[i].content = null
                    }
                }
            } catch (err) {
                list[i].error = err
            }

            if (progress != undefined)
                isOk = !progress(list[i], list.length - i, list.length)

            if ((list[i].isDirectory && settings.ignoreFolders && list[i].content == undefined) || isOk == false)
                list.splice(i, 1)
        }
    }
    return list;
}
/**
 * Returns a javascript object with directory items information (non blocking async with Promises)
 * @param {string} path the path to start reading contents
 * @param {object} options options (mode, recursive, stats, ignoreFolders)
 * @param {function} progress callback with item data and progress info for each item
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
        deep: false
    }

    // Aplying options (if set)
    if (options != undefined) {
        if (options.recursive != undefined)
            settings.recursive = options.recursive
        if (options.mode != undefined)
            settings.mode = options.mode
        if (options.stats != undefined)
            settings.stats = options.stats
        if (options.ignoreFolders != undefined)
            settings.ignoreFolders = options.ignoreFolders
        if (options.deep != undefined)
            settings.deep = options.deep
        if (options.extensions != undefined)
            settings.extensions = options.extensions
    }

    // Reading contents
    return await listDir(path, settings, progress);
}
module.exports = {
    LIST: LIST,
    TREE: TREE,
    list: list,
    stat: stat,
    fs: FS,
    path: PATH
}