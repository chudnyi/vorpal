'use strict';

import _ from 'lodash';
import {LocalStorage} from 'node-localstorage';
import os from 'os';
import {normalize, join} from 'path';

// Number of command histories kept in persistent storage
const HISTORY_SIZE = 500;

const temp = normalize(join(os.tmpdir(), '/.local_storage'));
const DEFAULT_STORAGE_PATH = temp;

export default class History {
  public _localStorage?: LocalStorage;
  public _inMode?: boolean;

  public _storageKey = undefined;

  // Prompt Command History
  // Histctr moves based on number of times 'up' (+= ctr)
  //  or 'down' (-= ctr) was pressed in traversing
  // command history.
  public _hist = [];
  public _histCtr = 0;

  // When in a 'mode', we reset the
  // history and store it in a cache until
  // exiting the 'mode', at which point we
  // resume the original history.
  public _histCache = [];
  public _histCtrCache = 0;

  /**
   * Initialize the history with local storage data
   * Called from setId when history id is set
   */
  public _init() {
    if (!this._storageKey) {
      return;
    }

    // Load history from local storage
    const persistedHistory = JSON.parse(this._localStorage.getItem(this._storageKey));
    if (_.isArray(persistedHistory)) {
      Array.prototype.push.apply(this._hist, persistedHistory);
    }
  }

  /**
   * Set id for this history instance.
   * Calls init internally to initialize
   * the history with the id.
   */
  public setId(id) {
    // Initialize a localStorage instance with default
    // path if it is not initialized
    if (!this._localStorage) {
      this._localStorage = new LocalStorage(DEFAULT_STORAGE_PATH);
    }
    this._storageKey = 'cmd_history_' + id;
    this._init();
  }

  /**
   * Initialize a local storage instance with
   * the path if not already initialized.
   *
   * @param path
   */
  public setStoragePath(path) {
    if (!this._localStorage) {
      this._localStorage = new LocalStorage(path);
    }
  }

  /**
   * Get previous history. Called when up is pressed.
   *
   * @return {String}
   */
  public getPreviousHistory() {
    this._histCtr++;
    this._histCtr = this._histCtr > this._hist.length ? this._hist.length : this._histCtr;
    return this._hist[this._hist.length - this._histCtr];
  }

  /**
   * Get next history. Called when down is pressed.
   *
   * @return {String}
   */
  public getNextHistory() {
    this._histCtr--;

    // Return empty prompt if the we dont have any history to show
    if (this._histCtr < 1) {
      this._histCtr = 0;
      return '';
    }

    return this._hist[this._hist.length - this._histCtr];
  }

  /**
   * Peek into history, without changing state
   *
   * @return {String}
   */
  public peek(depth = 0) {
    return this._hist[this._hist.length - 1 - depth];
  }

  /**
   * A new command was submitted. Called when enter is pressed and the prompt is not empty.
   *
   * @param cmd
   */
  public newCommand(cmd) {
    // Always reset history when new command is executed.
    this._histCtr = 0;

    // Don't store command in history if it's a duplicate.
    if (this._hist[this._hist.length - 1] === cmd) {
      return;
    }

    // Push into history.
    this._hist.push(cmd);

    // Only persist history when not in mode
    if (this._storageKey && !this._inMode) {
      let persistedHistory = this._hist;
      const historyLen = this._hist.length;
      if (historyLen > HISTORY_SIZE) {
        persistedHistory = this._hist.slice(historyLen - HISTORY_SIZE - 1, historyLen - 1);
      }

      // Add to local storage
      this._localStorage.setItem(this._storageKey, JSON.stringify(persistedHistory));
    }
  }

  /**
   * Called when entering a mode
   */
  public enterMode() {
    // Reassign the command history to a
    // cache, replacing it with a blank
    // history for the mode.
    this._histCache = _.clone(this._hist);
    this._histCtrCache = parseFloat(this._histCtr.toString());
    this._hist = [];
    this._histCtr = 0;
    this._inMode = true;
  }

  /**
   * Called when exiting a mode
   */
  public exitMode() {
    this._hist = this._histCache;
    this._histCtr = this._histCtrCache;
    this._histCache = [];
    this._histCtrCache = 0;
    this._inMode = false;
  }

  /**
   * Clears the command history
   * (Currently only used in unit test)
   */
  public clear() {
    if (this._storageKey) {
      this._localStorage.removeItem(this._storageKey);
    }
  }
}
