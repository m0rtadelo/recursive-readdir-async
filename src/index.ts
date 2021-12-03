/**
 * @packageDocumentation
 * project: recursive-readdir-async
 * @author: m0rtadelo (ricard.figuls)
 * @license MIT
 * 2018
 */

/**
 * A fs.Stats object provides information about a file.
 * @external fs.Stats
 * @see https://nodejs.org/api/fs.html#fs_classfs_stats
 */

/**
 *  Options/Settings options available for this module
 *  @typedef Options
 *  @type {object}
 *  @property [mode] - The list will return an array of items. The tree will return the
 *  items structured like the file system. Default: LIST
 *  @property [recursive] - If true, files and folders of folders and subfolders will be listed.
 *  If false, only the files and folders of the select directory will be listed. Default: true
 *  @property [stats] - If true a stats object (with file information) will be added to every item.
 *  If false this info is not added. Default: false.
 *  @property [ignoreFolders] - If true and mode is LIST, the list will be returned with files only.
 *  If true and mode is TREE, the directory structures without files will be deleted.
 *  If false, all empty and non empty directories will be listed. Default: true
 *  @property [extensions] - If true, lowercase extensions will be added to every item in the extension object property
 *  (file.TXT => info.extension = ".txt"). Default: false
 *  @property [deep] - If true, folder depth information will be added to every item starting with 0 (initial path),
 *  and will be incremented by 1 in every subfolder. Default: false
 *  @property [realPath] - Computes the canonical pathname by resolving ., .. and symbolic links. Default: true
 *  @property [normalizePath] - Normalizes windows style paths by replacing double backslahes with single forward
 *  slahes (unix style). Default: true
 *  @property [include] - Positive filter the items: only items which DO (partially or completely) match one of the
 *  strings in the include array will be returned. Default: []
 *  @property [exclude] - Negative filter the items: only items which DO NOT (partially or completely) match any of
 *  the strings in the exclude array will be returned. Default: []
 *  @property [readContent] - Adds the content of the file into the item (base64 format). Default: false
 *  @property [encoding] - Sets the encoding format to use in the readFile FS native node function
 *  (ascii, base64, binary, hex, ucs2/ucs-2/utf16le/utf-16le, utf8/utf-8, latin1). Default: 'base64'
 */

export interface IOptions {
   /** The list will return an array of items. The tree will return the items structured like the file system.
    *  Default: LIST */
  mode?: any,
  /** If true, files and folders of folders and subfolders will be listed. If false, only the files and folders
   *  of the select directory will be listed. Default: true */
  recursive?: boolean,
  /** If true a stats object (with file information) will be added to every item. If false this info is not added.
   *  Default: false. */
  stats?: any,
  /** If true and mode is LIST, the list will be returned with files only. If true and mode is TREE, the directory
   *  structures without files will be deleted. If false, all empty and non empty directories will be listed.
   *  Default: true */
  ignoreFolders?: boolean,
  /** If true, lowercase extensions will be added to every item in the extension object property
   *  (file.TXT => info.extension = ".txt"). Default: false */
  extensions?: boolean,
  /** If true, folder depth information will be added to every item starting with 0 (initial path), and will be
   *  incremented by 1 in every subfolder. Default: false */
  deep?: boolean,
  /** Computes the canonical pathname by resolving ., .. and symbolic links. Default: true */
  realPath?: boolean,
  /** Normalizes windows style paths by replacing double backslahes with single forward
   *  slahes (unix style). Default: true */
  normalizePath?: boolean,
  /** Positive filter the items: only items which DO (partially or completely) match one of the
   *  strings in the include array will be returned. Default: [] */
  include?: string[],
  /** Negative filter the items: only items which DO NOT (partially or completely) match any of the
   *  strings in the exclude array will be returned. Default: [] */
  exclude?: string[],
  /** Adds the content of the file into the item (base64 format). Default: false */
  readContent?: boolean,
  /** Sets the encoding format to use in the readFile FS native node function (ascii, base64, binary, hex,
   *  ucs2/ucs-2/utf16le/utf-16le, utf8/utf-8, latin1). Default: 'base64' */
  encoding?: BufferEncoding,
}
/**
 * Definition for the common dto object that contains information of the files and folders
 * @typedef IBase
 * @type {object}
 * @property name - The filename of the file
 * @property title - The title of the file (no extension)
 * @property path - The path of the item
 * @property fullname - The fullname of the file (path & name & extension)
 * @property extension - The extension of the file with dot in lowercase
 * @property deep - The depth of current content
 * @property isDirectory - True for directory, false for files
 * @property error - The error object. The structure is variable
 */
export interface IBase {
  /** The filename of the file */
  name: string,
  /** The title of the file (no extension) */
  title: string,
  /** The path of the file */
  path: string,
  /** The fullname of the file (path & name & extension) */
  fullname: string,
  /**  The extension of the file with dot in lowercase */
  extension?: string,
  /** The depth of current content */
  deep?: number,
  /** True for directory, false for files */
  isDirectory?: boolean,
  /** If something goes wrong the error comes here */
  error?: IError|any,
}
/**
 * Definition for the main Error object that contains information of the current exception
 * @typedef IError
 * @type {object}
 * @property error - The error object. The structure is variable
 * @property path - The path where the error is related to
 */
export interface IError {
  /** The raw error returned by service */
  error: any,
  /** Path where the error raises exception */
  path: string,
  [index:number]: any,
}
/**
 * Definition for the Item object that contains information of files used but this module
*  @typedef IFile
*  @type {object}
*  @property name - The filename of the file
*  @property path - The path of the file
*  @property title - The title of the file (no extension)
*  @property fullname - The fullname of the file (path & name)
*  @property [extension] - The extension of the file in lowercase
*  @property [isDirectory] - Always false in files
*  @property [data] - The content of the file in a base64 string by default
*  @property [stats] - The stats (information) of the file
*  @property [error] - If something goes wrong the error comes here
*  @property [deep] - The depth of current content
*/
export interface IFile extends IBase {
  /** The content of the file in a base64 string by default */
  data?: string,
  /** The stats (information) of the file */
  stats?: _fs.Stats,
}
/**
 * Definition for the Item object that contains information of folders used but this module
*  @typedef IFolder
*  @type {object}
*  @property name - The filename of the folder
*  @property path - The path of the folder
*  @property title - The title of the file (no extension)
*  @property fullname - The fullname of the folder (path & name)
*  @property [extension] - The extension of the folder in lowercase
*  @property [isDirectory] - Always true in folders
*  @property [content] - Array of File/Folder content
*  @property [error] - If something goes wrong the error comes here
*  @property [deep] - The depth of current content
*/
export interface IFolder extends IBase {
  /** The content of the Folder (if any) */
  content?:(IFile|IFolder)[]|IError,
}
/**
*  @typedef CallbackFunction
*  @type {function}
*  @param item - The item object with all the required fields
*  @param index - The current index in the array/collection of Files and/or Folders
*  @param total - The total number of Files and/or Folders
*  @returns {boolean} - true to delete the item from the list
*/
export interface ICallback {
  /** The item object with all the required fields */
  item: IFile|IFolder,
  /** The current index in the array/collection of Files and/or Folders */
  index: number,
  /** The total number of Files and/or Folders */
  total: number,
}
// constants
/** @readonly constant for mode LIST to be used in Options */
export const LIST = 1;
/** @readonly constant for mode TREE to be used in Options */
export const TREE = 2;
/**
 * native FS module
 * @see https://nodejs.org/api/fs.html#fs_file_system
 * @external
 */
import * as _fs from 'fs';
/** native node fs object */
export const FS = _fs;
/**
 * native PATH module
 * @external
 * @see https://nodejs.org/api/path.html#path_path
 */
import * as _path from 'path';
/** native node path object */
export const PATH = _path;
/*
 * Variables
 */
let pathSimbol = '/';
/**
 * Returns a Promise with Stats info of the item (file/folder/...)
 * @param file the name of the object to get stats from
 * @returns {Promise<fs.Stats>} stat object information
 * @async
 */
export async function stat(file:string): Promise<_fs.Stats> {
  return new Promise(function(resolve, reject) {
    FS.stat(file, function(err: any, stats: _fs.Stats) {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}
/**
 * Returns a Promise with content (data) of the file
 * @param file the name of the file to read content from
 * @param encoding format for returned data (ascii, base64, binary, hex, ucs2/ucs-2/utf16le/utf-16le,
 *  utf8/utf-8, latin1). Default: base64
 * @returns {Promise<string>} data content string (base64 format by default)
 * @async
 */
export async function readFile(file: string, encoding: BufferEncoding|undefined = 'base64'): Promise<string> {
  return new Promise(function(resolve, reject) {
    FS.readFile(file, { encoding }, function(err: any, data: string) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
/**
 * Returns if an item should be added based on include/exclude options.
 * @param path the item fullpath
 * @param settings the options configuration to use
 * @returns {boolean} if item must be added
 * @private
 */
function checkItem(path: string, settings: IOptions): boolean {
  if (settings.exclude) {
    for (const value of settings.exclude) {
      if (path.indexOf(value) > -1) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Reads content and creates a valid IBase collection
 * @param error Error object (if any)
 * @param files Files array to read in
 * @param rpath Path relative to
 * @param data Model
 * @param settings the options configuration to use
 * @param deep The deep level
 * @param resolve Promise
 * @param reject Promise
 * @returns void
 */
function read(
    error: any, files: string[], rpath: string, data: any, settings: IOptions, deep: number, resolve: any, reject: any,
) {
  /**
     * Adds optional keys to item
     * @param obj the item object
     * @param file the filename
     * @returns void
     * @private
     */
  function addOptionalKeys(obj:IBase, file: string) {
    if (settings.extensions) {
      obj.extension = (PATH.extname(file)).toLowerCase();
    }
    if (settings.deep) {
      obj.deep = deep;
    }
  }
  // If error reject them
  if (error) {
    reject(error);
  } else {
    const removeExt = (file: string) => {
      const extSize = PATH.extname(file).length;
      return file.substring(0, file.length - (extSize > 0 ? extSize : 0));
    };
    // Iterate through elements (files and folders)
    for (let i = 0, tam = files.length; i < tam; i++) {
      const obj:IBase = {
        name: files[i],
        title: removeExt(files[i]),
        path: rpath,
        fullname: rpath + (rpath.endsWith(pathSimbol) ? '' : pathSimbol) + files[i],
      };
      if (checkItem(obj.fullname, settings)) {
        addOptionalKeys(obj, files[i]);
        data.push(obj);
      }
    }

    // Finish, returning content
    resolve(data);
  }
}

/**
 * Returns a Promise with an objects info array
 * @param path the item fullpath to be searched for
 * @param settings the options configuration to use
 * @param deep folder depth value
 * @returns {Promise<IBase[]>} the file object info
 * @private
 */
async function myReaddir(path: string, settings: IOptions, deep: number): Promise<IBase[]> {
  const data:IBase[] = [];
  return new Promise(function(resolve, reject) {
    try {
      // Asynchronously computes the canonical pathname by resolving ., .. and symbolic links.
      FS.realpath(path, function(err: any, rpath: string) {
        if (err || settings.realPath === false) {
          rpath = path;
        }

        // Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
        if (settings.normalizePath) {
          rpath = normalizePath(rpath);
        }

        // Reading contents of path
        FS.readdir(rpath, function(error: any, files: string[]) {
          read(error, files, rpath, data, settings, deep, resolve, reject);
        });
      });
    } catch (err) {
      // If error reject them
      reject(err);
    }
  });
}
/**
 * Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
 * @param path windows/unix path
 * @return {string} normalized path (unix style)
 * @private
 */
function normalizePath(path: string): string {
  return path.toString().replace(/\\/g, '/');
}
/**
 * Returns an array of items in path
 * @param path path
 * @param settings the options to be used
 * @param progress callback progress
 * @param deep deep index information
 * @returns {object[]} array with file information
 * @private
 */
async function listDir(
    path: string, settings: IOptions, progress:Function|undefined, deep = 0,
): Promise<(IFile|IFolder)[]|IError> {
  let content: (IFile|IFolder)[];
  try {
    content = await myReaddir(path, settings, deep);
  } catch (err) {
    return { 'error': err, 'path': path };
  }

  if (settings.stats || settings.recursive || !settings.ignoreFolders ||
    settings.readContent || settings.mode === TREE) {
    content = await statDir(content, settings, progress, deep);
  }

  onlyInclude();

  return content;

  /**
   * Removes paths that not match the include array
   * @returns void
   */
  function onlyInclude() {
    /**
     * Search if the fullname exist in the include array
     * @param fullname - The fullname of the item to search for
     * @returns true if exists
     */
    function exists(fullname: string): boolean {
      if (settings.include) {
        for (const value of settings.include) {
          if (fullname.indexOf(value) > -1) {
            return true;
          }
        }
      }
      return false;
    }
    if (settings.include && settings.include.length > 0) {
      for (let i = content.length - 1; i > -1; i--) {
        const item = content[i];

        if (settings.mode === TREE && item.isDirectory && (item as IFolder).content) continue;

        if (!exists(item.fullname)) {
          content.splice(i, 1);
        }
      }
    }
  }
}
/**
 * Returns an object with all items with selected options
 * @param list items list
 * @param settings the options to use
 * @param progress callback progress
 * @param deep folder depth
 * @returns {object[]} array with file information
 * @private
 */
async function statDir(
    list:(IFile|IFolder)[], settings: IOptions, progress: Function|undefined, deep: number,
): Promise<(IFile|IFolder)[]> {
  let isOk = true;
  for (let i = list.length - 1; i > -1; i--) {
    try {
      list = await statDirItem(list, i, settings, progress, deep);
      if (progress !== undefined) {
        isOk = !progress(list[i], list.length - i, list.length);
      }
    } catch (err) {
      list[i].error = err;
    }
    if ((list[i].isDirectory && settings.ignoreFolders &&
      !((list[i] as IFolder).content) && list[i].error === undefined) || !isOk) {
      list.splice(i, 1);
    }
  }
  return list;
}
/**
 * Returns an object with updated item information
 * @param list items list
 * @param i index of item
 * @param settings the options to use
 * @param progress callback progress
 * @param deep folder depth
 * @returns {object[]} array with file information
 * @private
 */
async function statDirItem(
    list:(IFile|IFolder)[], i: number, settings: IOptions, progress: Function|undefined, deep: number,
):Promise<(IFile|IFolder)[]> {
  const stats = await stat(list[i].fullname);
  list[i].isDirectory = stats.isDirectory();
  if (settings.stats) {
    (list[i] as IFile).stats = stats;
  }
  if (settings.readContent && !list[i].isDirectory) {
    (list[i] as IFile).data = await readFile(list[i].fullname, settings.encoding);
  }
  if (list[i].isDirectory && settings.recursive) {
    const item: IFolder = list[i];
    if (settings.mode === LIST) {
      const result: (IFile|IFolder)[]|IError|any = await listDir(item.fullname, settings, progress, deep + 1);
      if (result.length) {
        list = list.concat(result);
      }
    } else {
      item.content = await listDir(item.fullname, settings, progress, deep + 1);
      if (item.content && (item.content as IFolder[]).length === 0) {
        item.content = undefined;
      }
    }
  }

  return list;
}

/**
 * Returns a javascript object with directory items information (non blocking async with Promises)
 * @param path the path to start reading contents
 * @param [options] options (mode, recursive, stats, ignoreFolders)
 * @param [progress] callback with item data and progress info for each item
 * @returns promise array with file/folder information
 * @async
 */
export async function list(
    path: string, options?: IOptions|Function, progress?:Function,
): Promise<(IFile|IFolder)[]|IError|any> {
  // options skipped?
  if (typeof options === 'function') {
    progress = options;
  }
  // Setting default settings
  const settings = {
    mode: (options as IOptions)?.mode || LIST,
    recursive: (options as IOptions)?.recursive === undefined ? true : (options as IOptions).recursive,
    stats: (options as IOptions)?.stats === undefined ? false : (options as IOptions).stats,
    ignoreFolders: (options as IOptions)?.ignoreFolders === undefined ? true : (options as IOptions).ignoreFolders,
    extensions: (options as IOptions)?.extensions === undefined ? false : (options as IOptions).extensions,
    deep: (options as IOptions)?.deep === undefined ? false : (options as IOptions).deep,
    realPath: (options as IOptions)?.realPath === undefined ? true : (options as IOptions).realPath,
    normalizePath: (options as IOptions)?.normalizePath === undefined ? true : (options as IOptions).normalizePath,
    include: (options as IOptions)?.include || [],
    exclude: (options as IOptions)?.exclude || [],
    readContent: (options as IOptions)?.readContent === undefined ? false : (options as IOptions).readContent,
    encoding: (options as IOptions)?.encoding || undefined,
  };
  // Setting pathSimbol if normalizePath is disabled
  if (settings.normalizePath === false) {
    pathSimbol = PATH.sep;
  } else {
    pathSimbol = '/';
  }

  // Reading contents
  return listDir(path, settings, progress);
}
