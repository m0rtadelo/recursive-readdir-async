/**
 * project: recursive-readdir-async
 * author: m0rtadelo (ricard.figuls)
 * 2019
 * @license MIT
 */

import PATH from "path";
import FS from "fs";
import { Mode } from "./enums";
import { IError, IItem, IOptions } from "./interfaces";
import { listDir, stat, readFile } from "./privates";
import { callbackFunction } from "./types";

let pathSimbol = "/";

module.exports.LIST = Mode.LIST;
module.exports.TREE = Mode.TREE;
module.exports.stat = stat;
module.exports.readFile = readFile;
module.exports.fs = FS;
module.exports.path = PATH;
/**
 * Returns a javascript object with directory items information (non blocking async with Promises)
 * @param {string} path the path to start reading contents
 * @param {IOptions} options options (mode, recursive, stats, ignoreFolders)
 * @param {callbackFunction} progress callback with item data and progress info for each item
 * @returns {Promise<IItem[]|IError>} array with file/folder information
 * @async
 */
module.exports.list = async function list(
  path: string,
  options?: IOptions,
  progress?: callbackFunction): Promise<IItem[]|IError> {
  // options skipped?
  if (typeof options === "function") {
    progress = options;
  }
  // Setting default settings
  const settings = {
    deep: false,
    exclude: [],
    extensions: false,
    ignoreFolders: true,
    include: [],
    mode: Mode.LIST,
    normalizePath: true,
    readContent: false,
    realPath: true,
    recursive: true,
    stats: false,
  };

  // Applying options (if set)
  setOptions();

  // Setting pathSimbol if normalizePath is disabled
  if (settings.normalizePath === false) {
    pathSimbol = PATH.sep;
  } else {
    pathSimbol = "/";
  }

  // Reading contents
  return listDir(path, settings, progress, 0, pathSimbol);

  // sets the user settings
  function setOptions() {
    if (options) {
      if (options.recursive !== undefined) {
        settings.recursive = options.recursive;
      }
      if (options.mode !== undefined) {
        settings.mode = options.mode;
      }
      if (options.stats !== undefined) {
        settings.stats = options.stats;
      }
      if (options.ignoreFolders !== undefined) {
        settings.ignoreFolders = options.ignoreFolders;
      }
      if (options.deep !== undefined) {
        settings.deep = options.deep;
      }
      if (options.extensions !== undefined) {
        settings.extensions = options.extensions;
      }
      if (options.realPath !== undefined) {
        settings.realPath = options.realPath;
      }
      if (options.normalizePath !== undefined) {
        settings.normalizePath = options.normalizePath;
      }
      if (options.include !== undefined) {
        settings.include = options.include;
      }
      if (options.exclude !== undefined) {
        settings.exclude = options.exclude;
      }
      if (options.readContent !== undefined) {
        settings.readContent = options.readContent;
      }
    }
  }
};
