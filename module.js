/*
 * project: recursive-readdir-async
 * author: m0rtadelo (ricard.figuls)
 * license: MIT
 * 2018
 */
'use strict'

/**
*  @typedef File
*  @type {object}
*  @property {string} name - The filename of the file
*  @property {string} path - The path of the file
*  @property {string} fullname - The fullname of the file (path & name)
*  @property {string} extension - The extension of the file in lowercase
*  @property {boolean} isDirectory - Always false in files
*  @property {string} data - The content of the file in a base64 string
*  @property {object} stats - The stats (information) of the file
*  @property {error} error - If something goes wrong the error comes here
*/

/**
*  @typedef Folder
*  @type {object}
*  @property {string} name - The filename of the folder
*  @property {string} path - The path of the folder
*  @property {string} fullname - The fullname of the folder (path & name)
*  @property {string} extension - The extension of the folder in lowercase
*  @property {boolean} isDirectory - Always true in folders
*  @property {File[]|Folder[]} content - Array of File/Folder content
*  @property {error} error - If something goes wrong the error comes here
*/

/**
*  @typedef CallbackFunction
*  @type {function}
*  @param {File|Folder} item - The item object with all the required fields
*  @param {number} index - The current index in the array/collection of Files and/or Folders
*  @param {number} total - The total number of Files and/or Folders
*/

// constants
/**
 * constant for mode LIST to be used in Options
 */
const LIST = 1
/**
 * constant for mode TREE to be used in Options
 */
const TREE = 2
/**
 * native FS module
 */
const FS = require('fs')
/**
 * native PATH module
 */
const PATH = require('path')

/*
 * Variables
 */
let pathSimbol = '/'
/**
 * Returns a Promise with Stats info of the item (file/folder/...)
 * @param {string} file the name of the object to get stats from
 * @returns {Promise} stat object information
 */
async function stat (file) {
  return new Promise(function (resolve, reject) {
    FS.stat(file, function (err, stats) {
      if (err) {
        reject(err)
      } else {
        resolve(stats)
      }
    })
  })
}
/**
 * Returns a Promise with content (data) of the file
 * @param {string} file the name of the file to read content from
 * @returns {Promise} data content string (base64 format)
 */
async function readFile (file) {
  return new Promise(function (resolve, reject) {
    FS.readFile(file, { 'encoding': 'base64' }, function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
/**
 * Returns if an item should be added based on include/exclude options.
 * @param {string} path the item fullpath
 * @param {object} settings the options configuration to use
 * @returns {boolean} if item must be added
 * @private
 */
function checkItem (path, settings) {
  for (let i = 0; i < settings.exclude.length; i++) {
    if (path.indexOf(settings.exclude[i]) > -1) {
      return false
    }
  }
  return true
}
/**
 * Returns a Promise with an objects info array
 * @param {string} path the item fullpath to be searched for
 * @param {object} settings the options configuration to use
 * @param {number} deep folder depth value
 * @returns {Promise} the file object info
 * @private
 */
async function myReaddir (path, settings, deep) {
  const data = []
  return new Promise(function (resolve, reject) {
    try {
      // Asynchronously computes the canonical pathname by resolving ., .. and symbolic links.
      FS.realpath(path, function (err, rpath) {
        if (err || settings.realPath === false) {
          rpath = path
        }

        // Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
        if (settings.normalizePath) {
          rpath = normalizePath(rpath)
        }

        // Reading contents of path
        FS.readdir(rpath, function (err, files) {
          // If error reject them
          if (err) {
            reject(err)
          } else {
            // Iterate through elements (files and folders)
            for (let i = 0, tam = files.length; i < tam; i++) {
              const obj = {
                'name': files[i],
                'path': rpath,
                'fullname': rpath + (rpath.endsWith(pathSimbol) ? '' : pathSimbol) + files[i]
              }
              if (checkItem(obj.fullname, settings)) {
                addOptionalKeys(obj, files[i])
                data.push(obj)
              }
            }

            // Finish, returning content
            resolve(data)
          }
        })
      })
    } catch (err) {
      // If error reject them
      reject(err)
    }
  })
  /**
     * Adds optional keys to item
     * @param {object} obj the item object
     * @param {string} file the filename
     * @private
     */
  function addOptionalKeys (obj, file) {
    if (settings.extensions) {
      obj.extension = (PATH.extname(file)).toLowerCase()
    }
    if (settings.deep) {
      obj.deep = deep
    }
  }
}
/**
 * Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
 * @param  {string} path windows/unix path
 * @return {string} normalized path (unix style)
 * @private
 */
function normalizePath (path) {
  return path.toString().replace(/\\/g, '/')
}
/**
 * Returns an array of items in path
 * @param {string} path path
 * @param {object} settings the options to be used
 * @param {function} progress callback progress
 * @returns {object[]} array with file information
 * @private
 */
async function listDir (path, settings, progress, deep) {
  let list
  deep = (deep === undefined ? 0 : deep)
  try {
    list = await myReaddir(path, settings, deep)
  } catch (err) {
    return { 'error': err, 'path': path }
  }

  if (settings.stats || settings.recursive || !settings.ignoreFolders || settings.readContent || settings.mode === TREE) {
    list = await statDir(list, settings, progress, deep)
  }

  onlyInclude()

  return list

  function onlyInclude () {
    for (let j = 0; j < settings.include.length; j++) {
      for (let i = list.length - 1; i > -1; i--) {
        let item = list[i]

        if (settings.mode === TREE && item.isDirectory && item.content) continue

        if (item.fullname.indexOf(settings.include[j]) === -1) {
          list.splice(i, 1)
        }
      }
    }
  }
}
/**
 * Returns an object with all items with selected options
 * @param {object} list items list
 * @param {object} settings the options to use
 * @param {function} progress callback progress
 * @param {number} deep folder depth
 * @returns {object[]} array with file information
 * @private
 */
async function statDir (list, settings, progress, deep) {
  let isOk = true
  for (let i = list.length - 1; i > -1; i--) {
    try {
      list = await statDirItem(list, i, settings, progress, deep)
      if (progress !== undefined) {
        isOk = !progress(list[i], list.length - i, list.length)
      }
    } catch (err) {
      list[i].error = err
    }
    if ((list[i].isDirectory && settings.ignoreFolders && !list[i].content && list[i].error === undefined) || !isOk) {
      list.splice(i, 1)
    }
  }
  return list
}
/**
 * Returns an object with updated item information
 * @param {object} list items list
 * @param {number} i index of item
 * @param {object} settings the options to use
 * @param {function} progress callback progress
 * @param {number} deep folder depth
 * @returns {object[]} array with file information
 * @private
 */
async function statDirItem (list, i, settings, progress, deep) {
  const stats = await stat(list[i].fullname)
  list[i].isDirectory = stats.isDirectory()
  if (settings.stats) {
    list[i].stats = stats
  }
  if (settings.readContent && !list[i].isDirectory) {
    list[i].data = await readFile(list[i].fullname)
  }
  if (list[i].isDirectory && settings.recursive) {
    if (settings.mode === LIST) {
      list = list.concat(await listDir(list[i].fullname, settings, progress, deep + 1))
    } else {
      list[i].content = await listDir(list[i].fullname, settings, progress, deep + 1)
      if (list[i].content.length === 0) {
        list[i].content = null
      }
    }
  }

  return list
}

/**
 * Returns a javascript object with directory items information (non blocking async with Promises)
 * @param {string} path the path to start reading contents
 * @param {Options} options options (mode, recursive, stats, ignoreFolders)
 * @param {CallbackFunction} progress callback with item data and progress info for each item
 * @returns {File[]|Folder[]} array with file/folder information
 */
async function list (path, options, progress) {
  // options skipped?
  if (typeof options === 'function') {
    progress = options
  }

  /**
  *  @typedef Options
  *  @type {object}
  *  @property {LIST|TREE} mode - The list will return an array of items. The tree will return the items structured like the file system. Default: LIST
  *  @property {boolean} recursive - If true, files and folders of folders and subfolders will be listed. If false, only the files and folders of the select directory will be listed. Default: true
  *  @property {boolean} stats - If true a stats object (with file information) will be added to every item. If false this info is not added. Default: false.
  *  @property {boolean} ignoreFolders - If true and mode is LIST, the list will be returned with files only. If true and mode is TREE, the directory structures without files will be deleted. If false, all empty and non empty directories will be listed. Default: true
  *  @property {boolean} extensions - If true, lowercase extensions will be added to every item in the extension object property (file.TXT => info.extension = ".txt"). Default: false
  *  @property {boolean} deep - If true, folder depth information will be added to every item starting with 0 (initial path), and will be incremented by 1 in every subfolder. Default: false
  *  @property {boolean} realPath - Computes the canonical pathname by resolving ., .. and symbolic links. Default: true
  *  @property {boolean} normalizePath - Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style). Default: true
  *  @property {string[]} include - Positive filter the items: only items which DO (partially or completely) match one of the strings in the include array will be returned. Default: []
  *  @property {string[]} exclude - Negative filter the items: only items which DO NOT (partially or completely) match any of the strings in the exclude array will be returned. Default: []
  *  @property {boolean} readContent -  Adds the content of the file into the item (base64 format). Default: false
  */
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
    exclude: [],
    readContent: false
  }

  // Applying options (if set)
  setOptions()

  // Setting pathSimbol if normalizePath is disabled
  if (settings.normalizePath === false) {
    pathSimbol = PATH.sep
  } else {
    pathSimbol = '/'
  }

  // Reading contents
  return listDir(path, settings, progress)

  function setOptions () {
    if (options) {
      if (options.recursive !== undefined) {
        settings.recursive = options.recursive
      }
      if (options.mode !== undefined) {
        settings.mode = options.mode
      }
      if (options.stats !== undefined) {
        settings.stats = options.stats
      }
      if (options.ignoreFolders !== undefined) {
        settings.ignoreFolders = options.ignoreFolders
      }
      if (options.deep !== undefined) {
        settings.deep = options.deep
      }
      if (options.extensions !== undefined) {
        settings.extensions = options.extensions
      }
      if (options.realPath !== undefined) {
        settings.realPath = options.realPath
      }
      if (options.normalizePath !== undefined) {
        settings.normalizePath = options.normalizePath
      }
      if (options.include !== undefined) {
        settings.include = options.include
      }
      if (options.exclude !== undefined) {
        settings.exclude = options.exclude
      }
      if (options.readContent !== undefined) {
        settings.readContent = options.readContent
      }
    }
  }
}
module.exports = {
  /**
     * creates list object with content
     * @preserve
    */
  LIST: LIST,
  /**
     * creates tree object with content
     * @preserve
    */
  TREE: TREE,
  /**
     * Returns a javascript object with directory items information (non blocking async with Promises)
     * @param {string} path the path to start reading contents
     * @param {object} options options (mode, recursive, stats, ignoreFolders)
     * @param {function} progress callback with item data and progress info for each item
     * @returns {Promise} object array with file information
     * @preserve
     */
  list: list,
  /**
     * Returns a Promise with Stats info of the item (file/folder/...)
     * @param {string} file
     * @returns {Promise} promise stat object info
     * @preserve
     */
  stat: stat,
  /**
     * Returns a Promise with content (data) of the file
     * @param {string} file
     * @returns {Promise} promise stat object info
     * @preserve
     */
  readFile: readFile,
  /**
     * Native FS module
     * @preserve
     */
  fs: FS,
  /**
     * Native PATH module
     * @preserve
     */
  path: PATH
}
