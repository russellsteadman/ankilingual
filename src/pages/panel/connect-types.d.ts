export interface Model {
  id: number;
  name: string;
  type: number;
  mod: number;
  usn: number;
  sortf: number;
  did: any;
  tmpls: Tmpl[];
  flds: Fld[];
  css: string;
  latexPre: string;
  latexPost: string;
  latexsvg: boolean;
  req: [number, string, number[]][];
  originalStockKind: number;
}

export interface Tmpl {
  name: string;
  ord: number;
  qfmt: string;
  afmt: string;
  bqfmt: string;
  bafmt: string;
  did: any;
  bfont: string;
  bsize: number;
  id: number;
}

export interface Fld {
  name: string;
  ord: number;
  sticky: boolean;
  rtl: boolean;
  font: string;
  size: number;
  description: string;
  plainText: boolean;
  collapsed: boolean;
  excludeFromSearch: boolean;
  id: number;
  tag: any;
  preventDeletion: boolean;
}

export interface Root {
  note: Note;
}

export interface Note {
  deckName: string;
  modelName: string;
  fields: Fields;
  options: Options;
  tags: string[];
  audio?: Audio[];
  video?: Video[];
  picture?: Picture[];
}

export interface Fields {
  Front: string;
  Back: string;
}

export interface Options {
  allowDuplicate: boolean;
  duplicateScope: string;
  duplicateScopeOptions: DuplicateScopeOptions;
}

export interface DuplicateScopeOptions {
  deckName: string;
  checkChildren: boolean;
  checkAllModels: boolean;
}

export interface Audio {
  url: string;
  filename: string;
  skipHash: string;
  fields: string[];
}

export interface Video {
  url: string;
  filename: string;
  skipHash: string;
  fields: string[];
}

export interface Picture {
  url: string;
  filename: string;
  skipHash: string;
  fields: string[];
}

export type Action =
  | "getNumCardsReviewedToday"
  | "findModelsByName"
  | "createModel"
  | "deckNamesAndIds"
  | "addNote";
export type APIResponse<T extends Action> = T extends "getNumCardsReviewedToday"
  ? number
  : T extends "findModelsByName"
  ? Model[]
  : T extends "createModel"
  ? Model
  : T extends "deckNamesAndIds"
  ? Record<string, number>
  : T extends "addNote"
  ? number
  : never;
export type APIParams<T extends Action> = T extends "findModelsByName"
  ? {
      modelNames: string[];
    }
  : T extends "createModel"
  ? {
      modelName: string;
      inOrderFields: string[];
      css?: string;
      isCloze?: boolean;
      cardTemplates: {
        Name: string;
        Front: string;
        Back: string;
      }[];
    }
  : {};
