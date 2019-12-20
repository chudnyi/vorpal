"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const autocomplete_1 = __importDefault(require("./autocomplete"));
/**
 * Tracks how many times tab was pressed
 * based on whether the UI changed.
 *
 * @param {AutocompleteMatch} match
 * @param {Boolean} freezeTabs
 * @return {String} result
 * @api private
 */
function handleTabCounts(match, freezeTabs) {
    let result;
    if (lodash_1.default.isArray(match)) {
        this._tabCount += 1;
        if (this._tabCount > 1) {
            result = match.length === 0 ? undefined : match;
        }
    }
    else {
        this._tabCount = freezeTabs === true ? this._tabCount + 1 : 0;
        result = match;
    }
    return result;
}
exports.handleTabCounts = handleTabCounts;
/**
 * Looks for a potential exact match
 * based on given data.
 *
 * @param {String} ctx
 * @param {Array} data
 * @param {Object} options
 * @return {String}
 * @api private
 */
function getMatch(ctx, data, options) {
    // Look for a command match, eliminating and then
    // re-introducing leading spaces.
    const len = ctx.length;
    const trimmed = ctx.trimLeft();
    const match = autocomplete_1.default.match(trimmed, data.slice(), options);
    if (lodash_1.default.isArray(match)) {
        return match;
    }
    const prefix = new Array(len - trimmed.length + 1).join(' ');
    // If we get an autocomplete match on a command, put the leading spaces back in and finish it.
    return match ? prefix + match : undefined;
}
exports.getMatch = getMatch;
/**
 * Takes the input object and assembles
 * the final result to display on the screen.
 *
 * @param {Object} input
 * @return {AutocompleteMatch}
 * @api private
 */
function assembleInput(input) {
    if (lodash_1.default.isArray(input.context)) {
        return input.context;
    }
    const result = (input.prefix || '') + (input.context || '') + (input.suffix || '');
    return strip_ansi_1.default(result);
}
exports.assembleInput = assembleInput;
/**
 * Reduces an array of possible
 * matches to list based on a given
 * string.
 *
 * @param {String} str
 * @param {Array} data
 * @return {Array}
 * @api private
 */
function filterData(str = '', data) {
    data = data || [];
    let ctx = String(str).trim();
    const slashParts = ctx.split('/');
    ctx = slashParts.pop();
    const wordParts = String(ctx)
        .trim()
        .split(' ');
    return data
        .filter(function (item) {
        return strip_ansi_1.default(item).slice(0, ctx.length) === ctx;
    })
        .map(function (item) {
        let parts = String(item)
            .trim()
            .split(' ');
        if (parts.length > 1) {
            parts = parts.slice(wordParts.length);
            return parts.join(' ');
        }
        return item;
    });
}
exports.filterData = filterData;
/**
 * Returns a cleaned up version of the
 * remaining text to the right of the cursor.
 *
 * @param {String} suffix
 * @return {String}
 * @api private
 */
function getSuffix(suffix) {
    suffix = suffix.slice(0, 1) === ' ' ? suffix : suffix.replace(/.+?(?=\s)/, '');
    suffix = suffix.slice(1, suffix.length);
    return suffix;
}
exports.getSuffix = getSuffix;
/**
 * Takes the user's current prompt
 * string and breaks it into its
 * integral parts for analysis and
 * modification.
 *
 * @param {String} str
 * @param {Number} idx
 * @return {Object}
 * @api private
 */
function parseInput(str = '', idx) {
    const raw = String(str);
    const sliced = raw.slice(0, idx);
    const sections = sliced.split('|');
    const prefixParts = sections.slice(0, sections.length - 1) || [];
    prefixParts.push('');
    const prefix = prefixParts.join('|');
    const suffix = getSuffix(raw.slice(idx));
    const context = sections[sections.length - 1];
    return {
        raw,
        prefix,
        suffix,
        context
    };
}
exports.parseInput = parseInput;
/**
 * Takes the context after a
 * matched command and figures
 * out the applicable context,
 * including assigning its role
 * such as being an option
 * parameter, etc.
 *
 * @param {Object} input
 * @return {Object}
 * @api private
 */
function parseMatchSection(input) {
    const parts = (input.context || '').split(' ');
    const last = parts.pop();
    const beforeLast = strip_ansi_1.default(parts[parts.length - 1] || '').trim();
    if (beforeLast.slice(0, 1) === '-') {
        input.option = beforeLast;
    }
    input.context = last;
    input.prefix = (input.prefix || '') + parts.join(' ') + ' ';
    return input;
}
exports.parseMatchSection = parseMatchSection;
/**
 * Compile all available commands and aliases
 * in alphabetical order.
 *
 * @param {Array} cmds
 * @return {Array}
 * @api private
 */
function getCommandNames(cmds) {
    const commands = lodash_1.default.map(cmds, '_name').concat(...lodash_1.default.map(cmds, '_aliases'));
    commands.sort();
    return commands;
}
exports.getCommandNames = getCommandNames;
/**
 * When we know that we've
 * exceeded a known command, grab
 * on to that command and return it,
 * fixing the overall input context
 * at the same time.
 *
 * @param {Object} input
 * @param {Array} commandNames
 * @return {Object}
 * @api private
 */
function getMatchObject(input, commandNames) {
    const len = input.context.length;
    const trimmed = String(input.context).trimLeft();
    let prefix = new Array(len - trimmed.length + 1).join(' ');
    let match;
    let suffix;
    commandNames.forEach(function (cmd) {
        const nextChar = trimmed.substr(cmd.length, 1);
        if (trimmed.substr(0, cmd.length) === cmd && String(cmd).trim() !== '' && nextChar === ' ') {
            match = cmd;
            suffix = trimmed.substr(cmd.length);
            prefix += trimmed.substr(0, cmd.length);
        }
    });
    let matchObject = match
        ? lodash_1.default.find(this.parent.commands, { _name: String(match).trim() })
        : undefined;
    if (!matchObject) {
        this.parent.commands.forEach(function (cmd) {
            if ((cmd._aliases || []).indexOf(String(match).trim()) > -1) {
                matchObject = cmd;
            }
            return;
        });
    }
    if (!matchObject) {
        matchObject = this.parent.commands.find(cmd => !lodash_1.default.isNil(cmd._catch));
        if (matchObject) {
            suffix = input.context;
        }
    }
    if (!matchObject) {
        prefix = input.context;
        suffix = '';
    }
    if (matchObject) {
        input.match = matchObject;
        input.prefix += prefix;
        input.context = suffix;
    }
    return input;
}
exports.getMatchObject = getMatchObject;
function handleDataFormat(str, config, cb) {
    let data = [];
    if (lodash_1.default.isArray(config)) {
        data = config;
    }
    else if (lodash_1.default.isFunction(config)) {
        const cbk = config.length < 2
            ? // eslint-disable-next-line @typescript-eslint/no-empty-function
                function () { }
            : function (err, resp) {
                cb(resp || []);
            };
        const res = config(str, cbk);
        if (res instanceof Promise) {
            res
                .then(function (resp) {
                cb(resp);
            })
                .catch(function (err) {
                cb(err);
            });
        }
        else if (config.length < 2) {
            cb(res);
        }
    }
    else {
        cb(data);
    }
}
/**
 * Takes a known matched command, and reads
 * the applicable data by calling its autocompletion
 * instructions, whether it is the command's
 * autocompletion or one of its options.
 *
 * @param {Object} input
 * @param {Function} cb
 * @return {Array}
 * @api private
 */
function getMatchData(input, cb) {
    const string = input.context;
    const cmd = input.match;
    const midOption = String(string)
        .trim()
        .slice(0, 1) === '-';
    const afterOption = input.option !== undefined;
    if (midOption === true && !cmd._allowUnknownOptions) {
        const results = [];
        for (let i = 0; i < cmd.options.length; ++i) {
            const long = cmd.options[i].long;
            const short = cmd.options[i].short;
            if (!long && short) {
                results.push(short);
            }
            else if (long) {
                results.push(long);
            }
        }
        cb(results);
        return;
    }
    if (afterOption === true) {
        const opt = strip_ansi_1.default(input.option).trim();
        const match = cmd.options.find(o => o.short === opt || o.long === opt);
        if (match) {
            const config = match.autocomplete;
            handleDataFormat(string, config, cb);
            return;
        }
    }
    const conf = cmd._autocomplete;
    const confFn = conf && !lodash_1.default.isArray(conf) && conf.data ? conf.data : conf;
    handleDataFormat(string, confFn, cb);
}
exports.getMatchData = getMatchData;
