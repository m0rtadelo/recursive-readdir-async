import { IItem } from "../interfaces";

export type callbackFunction = (item: IItem, index: number, total: number) => boolean;
