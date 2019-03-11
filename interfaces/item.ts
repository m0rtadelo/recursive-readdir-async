/**
 * project: recursive-readdir-async
 * author: m0rtadelo (ricard.figuls)
 * 2019
 * @license MIT
 */
import { IError } from ".";

 /**
  * Interface for the Item object that contains information
  * of files and/or folders used bu this module
  */
export interface IItem {
  /**
   * The filename of the file/folder
   */
  name: string;
  /**
   * The path of the file/folder
   */
  path: string;
  /**
   *  The fullname of the file/folder (path & name)
   */
  fullname: string;
  /**
   * The extension of the file/folder in lowercase
   */
  extension?: string;
  /**
   * false in files true in folders
   */
  isDirectory?: boolean;
  /**
   * The content of the file in a base64 string
   */
  data?: string;
  /**
   *  The stats (information) of the file
   */
  stats?: object;
  /**
   * Array of files and folders
   */
  content?: IItem[]|IError;
  /**
   * If something goes wrong the error comes here
   */
  error?: IError;
  deep?: number;
}
