"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_localstorage_1 = require("node-localstorage");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const temp = path_1.default.normalize(path_1.default.join(os_1.default.tmpdir(), '/.local_storage_'));
const DEFAULT_STORAGE_PATH = temp;
class LocalStorage {
    constructor(id) {
        if (!id) {
            throw new TypeError('Id need to be provided');
        }
        this._localStorage = new node_localstorage_1.LocalStorage(DEFAULT_STORAGE_PATH + id);
    }
    getItem(key) {
        return this._localStorage.getItem(key);
    }
    setItem(key, value) {
        this._localStorage.setItem(key, value);
    }
    removeItem(key) {
        return this._localStorage.removeItem(key);
    }
}
exports.default = LocalStorage;
