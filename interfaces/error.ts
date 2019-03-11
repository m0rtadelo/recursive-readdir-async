/**
 * project: recursive-readdir-async
 * author: m0rtadelo (ricard.figuls)
 * 2019
 * @license MIT
 */

 /**
  * Interface for the main Error object that contains information
  * of the current exception
  */
 export interface IError {
   "error": object;
   "path": string;
 }
