/**
 * project: recursive-readdir-async
 * author: m0rtadelo (ricard.figuls)
 * 2019
 * @license MIT
 */
import { IItem } from ".";
import { Mode } from "../enums";

/**
 * Interface for the Option object that contains config information
 * for setting and configuring the module
 */
export interface IOptions {
  /**
   * The list will return an array of items. The tree will return the items structured like the file system. Default: LIST
   */
  mode?: Mode;
  /**
   * If true, files and folders of folders and subfolders will be listed. If false, only the files and folders of the select directory will be listed. Default: true
   */
  recursive?: boolean;
  /**
   * If true a stats object (with file information) will be added to every item. If false this info is not added. Default: false.
   */
  stats?: boolean;
  /**
   * If true and mode is LIST, the list will be returned with files only. If true and mode is TREE, the directory structures without files will be deleted. If false, all empty and non empty directories will be listed. Default: true
   */
  ignoreFolders?: boolean;
  /**
   * If true, lowercase extensions will be added to every item in the extension object property (file.TXT => info.extension = ".txt"). Default: false
   */
  extensions?: boolean;
  /**
   * If true, folder depth information will be added to every item starting with 0 (initial path), and will be incremented by 1 in every subfolder. Default: false
   */
  deep: boolean;
  /**
   * Computes the canonical pathname by resolving ., .. and symbolic links. Default: true
   */
  realPath?: boolean;
  /**
   * Normalizes windows style paths by replacing double backslahes with single forward slahes (unix style). Default: true
   */
  normalizePath?: boolean;
  /**
   * Positive filter the items: only items which DO (partially or completely) match one of the strings in the include array will be returned. Default: []
   */
  include?: string[];
  /**
   * Negative filter the items: only items which DO NOT (partially or completely) match any of the strings in the exclude array will be returned. Default: []
   */
  exclude?: string[];
  /**
   * Adds the content of the file into the item (base64 format). Default: false
   */
  readContent?: boolean;
}
