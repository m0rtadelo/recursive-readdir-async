/**
 * project: recursive-readdir-async
 * author: m0rtadelo (ricard.figuls)
 * @license MIT
 * 2018
 */

/**
 * A fs.Stats object provides information about a file.
 * @external stats
 * @see https://nodejs.org/api/fs.html#fs_class_fs_stats
 */

/**
 * Definition for the main Error object that contains information of the current exception
 * @typedef Error
 * @type {object}
 * @property {object} error - The error object. The structure is variable
 * @property {string} path - The path where the error is related to
 */
export interface IError {
  error: any,
  path: string,
}
/**
 * Definition for the Item object that contains information of files used but this module
*  @typedef File
*  @type {object}
*  @property {string} name - The filename of the file
*  @property {string} path - The path of the file
*  @property {string} fullname - The fullname of the file (path & name)
*  @property {string} [extension] - The extension of the file in lowercase
*  @property {boolean} [isDirectory] - Always false in files
*  @property {string} [data] - The content of the file in a base64 string by default
*  @property {external:stats} [stats] - The stats (information) of the file
*  @property {Error} [error] - If something goes wrong the error comes here
*  @property {number} [deep] - The depth of current content
*/
export interface IFile {
  name: string,
  title: string,
  path: string,
  fullname: string,
  extension?: string,
  isDirectory?: boolean,
  data?: string,
  stats?: any,
  error?: IError,
  deep?: number,
}
/**
 * Definition for the Item object that contains information of folders used but this module
*  @typedef Folder
*  @type {object}
*  @property {string} name - The filename of the folder
*  @property {string} path - The path of the folder
*  @property {string} fullname - The fullname of the folder (path & name)
*  @property {string} [extension] - The extension of the folder in lowercase
*  @property {boolean} [isDirectory] - Always true in folders
*  @property {File[]|Folder[]} [content] - Array of File/Folder content
*  @property {Error} [error] - If something goes wrong the error comes here
*  @property {number} [deep] - The depth of current content
*/
export interface IFolder {
  name: string,
  title: string,
  path: string,
  fullname: string,
  extension?: string,
  isDirectory?: boolean,
  content?:(IFile|IFolder)[],
  error?: IError,
  deep?: number,
}
/**
*  @typedef CallbackFunction
*  @type {function}
*  @param {File|Folder} item - The item object with all the required fields
*  @param {number} index - The current index in the array/collection of Files and/or Folders
*  @param {number} total - The total number of Files and/or Folders
*  @returns {boolean} - true to delete the item from the list
*/
export interface ICallback {
  item: IFile|IFolder,
  index: number,
  total: number,
}
// constants
/**
 * @readonly
 * @enum {number} constant for mode LIST to be used in Options
 */
export const LIST = 1
/**
 * @readonly
 * @enum {number} constant for mode TREE to be used in Options
 */
export const TREE = 2
/**
 * native FS module
 * @see https://nodejs.org/api/fs.html#fs_file_system
 * @external
 */
export const FS = require('fs')
/**
 * native PATH module
 * @external
 * @see https://nodejs.org/api/path.html#path_path
 */
export const PATH = require('path')
/*
 * Variables
 */
let pathSimbol = '/'
/**
 * Returns a Promise with Stats info of the item (file/folder/...)
 * @param {string} file the name of the object to get stats from
 * @returns {Promise<external:stats>} stat object information
 */
export async function stat (file:string): Promise<any> {
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
 * @param {string} encoding format for returned data (ascii, base64, binary, hex, ucs2/ucs-2/utf16le/utf-16le, utf8/utf-8, latin1). Default: base64
 * @returns {Promise<string>} data content string (base64 format by default)
 */
export async function readFile (file: string, encoding: string = 'base64'): Promise<string> {
  return new Promise(function (resolve, reject) {
    FS.readFile(file, { encoding }, function (err, data) {
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
 * @param {Options} settings the options configuration to use
 * @returns {boolean} if item must be added
 * @private
 */
function checkItem (path: string, settings: Options): boolean {
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
 * @param {Options} settings the options configuration to use
 * @param {number} deep folder depth value
 * @returns {Promise} the file object info
 * @private
 */
async function myReaddir (path: string, settings: Options, deep: number): Promise<(IFile|IFolder)[]> {
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
            const removeExt = (file) => {
              const extSize = PATH.extname(file).length
              return file.substring(0, file.length - (extSize > 0 ? extSize : 0))
            }
            // Iterate through elements (files and folders)
            for (let i = 0, tam = files.length; i < tam; i++) {
              const obj:IFile|IFolder = {
                name: files[i],
                title: removeExt(files[i]),
                path: rpath,
                fullname: rpath + (rpath.endsWith(pathSimbol) ? '' : pathSimbol) + files[i]
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
  function addOptionalKeys (obj:IFile|IFolder, file: string) {
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
function normalizePath (path: string): string {
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
async function listDir (path: string, settings: Options, progress, deep = 0) {
  let list
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
    function exists (fullname) {
      for (let j = 0; j < settings.include.length; j++) {
        if (fullname.indexOf(settings.include[j]) > -1) {
          return true
        }
      }
      return false
    }
    if (settings.include.length > 0) {
      for (let i = list.length - 1; i > -1; i--) {
        let item = list[i]

        if (settings.mode === TREE && item.isDirectory && item.content) continue

        if (!exists(item.fullname)) {
          list.splice(i, 1)
        }
      }
    }
  }
}
/**
 * Returns an object with all items with selected options
 * @param {object[]} list items list
 * @param {object} settings the options to use
 * @param {function} progress callback progress
 * @param {number} deep folder depth
 * @returns {object[]} array with file information
 * @private
 */
async function statDir (list:(IFile|IFolder)[], settings: Options, progress, deep: number): Promise<(IFile|IFolder)[]> {
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
    if ((list[i].isDirectory && settings.ignoreFolders && !((list[i] as IFolder).content) && list[i].error === undefined) || !isOk) {
      list.splice(i, 1)
    }
  }
  return list
}
/**
 * Returns an object with updated item information
 * @param {object[]} list items list
 * @param {number} i index of item
 * @param {object} settings the options to use
 * @param {function} progress callback progress
 * @param {number} deep folder depth
 * @returns {object[]} array with file information
 * @private
 */
async function statDirItem (list:(IFile|IFolder)[], i, settings, progress, deep) {
  const stats = await stat(list[i].fullname)
  list[i].isDirectory = stats.isDirectory()
  if (settings.stats) {
    list[i].stats = stats
  }
  if (settings.readContent && !list[i].isDirectory) {
    list[i].data = await readFile(list[i].fullname, settings.encoding)
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

interface Options {
  mode?: any,
  recursive?: boolean,
  stats?: any,
  ignoreFolders?: boolean,
  extensions?: boolean,
  deep?: boolean,
  realPath?: boolean,
  normalizePath?: boolean,
  include?: string[],
  exclude?: string[],
  readContent?: boolean,
  encoding?: string,
}

/**
 * Returns a javascript object with directory items information (non blocking async with Promises)
 * @param {string} path the path to start reading contents
 * @param {Options=} [options] options (mode, recursive, stats, ignoreFolders)
 * @param {CallbackFunction=} [progress] callback with item data and progress info for each item
 * @returns {Promise<File[]|Folder[]>} promise array with file/folder information
 * @async
 */
module.exports.list = async function list (path: string, options?: Options|Function, progress?) {
  // options skipped?
  if (typeof options === 'function') {
    progress = options
  }
  /**
  *  @typedef Options
  *  @type {object}
  *  @property {LIST|TREE} [mode] - The list will return an array of items. The tree will return the items structured like the file system. Default: LIST
  *  @property {boolean} [recursive] - If true, files and folders of folders and subfolders will be listed. If false, only the files and folders of the select directory will be listed. Default: true
  *  @property {boolean} [stats] - If true a stats object (with file information) will be added to every item. If false this info is not added. Default: false.
  *  @property {boolean} [ignoreFolders] - If true and mode is LIST, the list will be returned with files only. If true and mode is TREE, the directory structures without files will be deleted. If false, all empty and non empty directories will be listed. Default: true
  *  @property {boolean} [extensions] - If true, lowercase extensions will be added to every item in the extension object property (file.TXT => info.extension = ".txt"). Default: false
  *  @property {boolean} [deep] - If true, folder depth information will be added to every item starting with 0 (initial path), and will be incremented by 1 in every subfolder. Default: false
  *  @property {boolean} [realPath] - Computes the canonical pathname by resolving ., .. and symbolic links. Default: true
  *  @property {boolean} [normalizePath] - Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style). Default: true
  *  @property {string[]} [include] - Positive filter the items: only items which DO (partially or completely) match one of the strings in the include array will be returned. Default: []
  *  @property {string[]} [exclude] - Negative filter the items: only items which DO NOT (partially or completely) match any of the strings in the exclude array will be returned. Default: []
  *  @property {boolean} [readContent] -  Adds the content of the file into the item (base64 format). Default: false
  *  @property {string} [encoding] - Sets the encoding format to use in the readFile FS native node function (ascii, base64, binary, hex, ucs2/ucs-2/utf16le/utf-16le, utf8/utf-8, latin1). Default: 'base64'
  */
  // Setting default settings
  const settings = {
    mode: LIST || (options as Options)?.mode,
    recursive: true || (options as Options)?.recursive,
    stats: false || (options as Options)?.stats,
    ignoreFolders: true || (options as Options)?.ignoreFolders,
    extensions: false || (options as Options)?.extensions,
    deep: false || (options as Options)?.deep,
    realPath: true || (options as Options)?.realPath,
    normalizePath: true || (options as Options)?.normalizePath,
    include: [] || (options as Options)?.include,
    exclude: [] || (options as Options)?.exclude,
    readContent: false || (options as Options)?.readContent,
    encoding: undefined || (options as Options)?.encoding,
  }

  // Setting pathSimbol if normalizePath is disabled
  if (settings.normalizePath === false) {
    pathSimbol = PATH.sep
  } else {
    pathSimbol = '/'
  }

  // Reading contents
  return listDir(path, settings, progress)
}
