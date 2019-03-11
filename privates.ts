/**
 * project: recursive-readdir-async
 * author: m0rtadelo (ricard.figuls)
 * 2019
 * @license MIT
 */

import FS from "fs";
import PATH from "path";

import { Mode } from "./enums";
import { IError, IItem, IOptions } from "./interfaces";
import { callbackFunction } from "./types";

const pathSimbol = "/";

// export class Private {
/**
 * Returns a Promise with Stats info of the item (file/folder/...)
 * @param {string} file the name of the object to get stats from
 * @returns {Promise} stat object information
 */
export async function stat(file: string): Promise<any> {
  return new Promise((resolve, reject) => {
    FS.stat(file, (err, stats) => {
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
 * @param {string} file the name of the file to read content from
 * @returns {Promise} data content string (base64 format)
 */
export async function readFile(file: string): Promise<any> {
  return new Promise((resolve, reject) => {
    FS.readFile(file, { encoding: "base64" }, (err, data) => {
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
 * @param {string} path the item fullpath
 * @param {IOptions} settings the options configuration to use
 * @returns {boolean} if item must be added
 */
function checkItem(path: string, settings: IOptions): boolean {
  for (let i = 0; i < settings.exclude.length; i++) {
    if (path.indexOf(settings.exclude[i]) > -1) {
      return false;
    }
  }
  return true;
}

/**
 * Returns a Promise with an objects info array
 * @param {string} path the item fullpath to be searched for
 * @param {IOptions} settings the options configuration to use
 * @param {number} deep folder depth value
 * @returns {Promise<IItem[]>} the file object info
 * @private
 */
async function myReaddir(path: string, settings: IOptions, deep: number): Promise<IItem[]> {
  const data = [];
  return new Promise((resolve, reject) => {
    try {
      // Asynchronously computes the canonical pathname by resolving ., .. and symbolic links.
      FS.realpath(path, (err, rpath: string) => {
        if (err || settings.realPath === false) {
          rpath = path;
        }

        // Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
        if (settings.normalizePath) {
          rpath = normalizePath(rpath);
        }

        // Reading contents of path
        FS.readdir(rpath, (errs, files: string[]) => {
          // If error reject them
          if (errs) {
            reject(errs);
          } else {
            // Iterate through elements (files and folders)
            for (let i = 0, tam = files.length; i < tam; i++) {
              const obj = {
                fullname: rpath + (rpath.endsWith(pathSimbol) ? "" : pathSimbol) + files[i],
                name: files[i],
                path: rpath,
              };
              if (checkItem(obj.fullname, settings)) {
                addOptionalKeys(obj, files[i]);
                data.push(obj);
              }
            }

            // Finish, returning content
            resolve(data);
          }
        });
      });
    } catch (err) {
      // If error reject them
      reject(err);
    }
  });
  /**
   * Adds optional keys to item
   * @param {object} obj the item object
   * @param {string} file the filename
   * @private
   */
  function addOptionalKeys(obj: IItem, file: string) {
    if (settings.extensions) {
      obj.extension = (PATH.extname(file)).toLowerCase();
    }
    if (settings.deep) {
      obj.deep = deep;
    }
  }
}
/**
 * Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style).
 * @param  {string} path windows/unix path
 * @return {string} normalized path (unix style)
 * @private
 */
function normalizePath(path: string): string {
  return path.toString().replace(/\\/g, "/");
}
/**
 * Returns an array of items in path
 * @param {string} path path
 * @param {IOptions} settings the options to be used
 * @param {function} progress callback progress
 * @param {number} deep index of folder depth iteraction
 * @returns {<IItem[]|IError>} array with file information
 * @private
 */
export async function listDir(path: string, settings?: IOptions, progress?, deep?: number): Promise<IItem[]|IError> {
  let list;
  deep = (deep === undefined ? 0 : deep);
  try {
    list = await myReaddir(path, settings, deep);
  } catch (err) {
    return { error: err, path };
  }

  if (settings.stats
    || settings.recursive
    || !settings.ignoreFolders
    || settings.readContent
    || settings.mode === Mode.TREE) {
    list = await statDir(list, settings, progress, deep);
  }

  onlyInclude();

  return list;

  function onlyInclude() {
    for (let j = 0; j < settings.include.length; j++) {
      for (let i = list.length - 1; i > -1; i--) {
        const item = list[i];

        if (settings.mode === Mode.TREE && item.isDirectory && item.content) { continue; }

        if (item.fullname.indexOf(settings.include[j]) === -1) {
          list.splice(i, 1);
        }
      }
    }
  }
}
/**
 * Returns an object with all items with selected options
 * @param {object} list items list
 * @param {IOptions} settings the options to use
 * @param {callbackFunction} progress callback progress
 * @param {number} deep folder depth
 * @returns {object[]} array with file information
 * @private
 */
async function statDir(list: IItem[], settings: IOptions, progress: callbackFunction, deep: number): Promise<IItem[]> {
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
    if ((list[i].isDirectory && settings.ignoreFolders && !list[i].content && list[i].error === undefined) || !isOk) {
      list.splice(i, 1);
    }
  }
  return list;
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
async function statDirItem(list: IItem[], i: number, settings: IOptions, progress, deep: number): Promise<IItem[]> {
  const stats = await stat(list[i].fullname);
  list[i].isDirectory = stats.isDirectory();
  if (settings.stats) {
    list[i].stats = stats;
  }
  if (settings.readContent && !list[i].isDirectory) {
    list[i].data = await readFile(list[i].fullname);
  }
  if (list[i].isDirectory && settings.recursive) {
    if (settings.mode === Mode.LIST) {
      list = list.concat(await listDir(list[i].fullname, settings, progress, deep + 1) as IItem[]);
    } else {
      list[i].content = await listDir(list[i].fullname, settings, progress, deep + 1);
      if (list[i].content instanceof Array) {
        if ((list[i].content as IItem[]).length === 0) {
          list[i].content = null;
        }
      }
    }
  }

  return list;
}
