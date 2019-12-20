"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const autocomplete_utils_1 = require("./autocomplete-utils");
const autocomplete = {
    /**
     * Handles tabbed autocompletion.
     *
     * - Initial tabbing lists all registered commands.
     * - Completes a command halfway typed.
     * - Recognizes options and lists all possible options.
     * - Recognizes option arguments and lists them.
     * - Supports cursor positions anywhere in the string.
     * - Supports piping.
     *
     * @param {String} str
     * @param {Function} cb
     * @return {String} cb
     * @api public
     */
    exec(str, cb) {
        let input = autocomplete_utils_1.parseInput(str, this.parent.ui._activePrompt.screen.rl.cursor);
        const commands = autocomplete_utils_1.getCommandNames(this.parent.commands);
        const vorpalMatch = autocomplete_utils_1.getMatch(input.context, commands, { ignoreSlashes: true });
        let freezeTabs = false;
        const end = (innerStr) => {
            const res = autocomplete_utils_1.handleTabCounts.call(this, innerStr, freezeTabs);
            cb(undefined, res);
        };
        const evaluateTabs = (innerInput) => {
            if (innerInput.context && innerInput.context[innerInput.context.length - 1] === '/') {
                freezeTabs = true;
            }
        };
        if (vorpalMatch) {
            input.context = vorpalMatch;
            evaluateTabs(input);
            end(autocomplete_utils_1.assembleInput(input));
            return;
        }
        input = autocomplete_utils_1.getMatchObject.call(this, input, commands);
        if (input.match) {
            input = autocomplete_utils_1.parseMatchSection.call(this, input);
            autocomplete_utils_1.getMatchData.call(this, input, function (data) {
                const dataMatch = autocomplete_utils_1.getMatch(input.context, data);
                if (dataMatch) {
                    input.context = dataMatch;
                    evaluateTabs(input);
                    end(autocomplete_utils_1.assembleInput(input));
                }
                else {
                    end(autocomplete_utils_1.filterData(input.context, data));
                }
            });
        }
        else {
            end(autocomplete_utils_1.filterData(input.context, commands));
        }
    },
    /**
     * Independent / stateless auto-complete function.
     * Parses an array of strings for the best match.
     *
     * @param {String} str
     * @param {Array} arr
     * @param {Object} options
     * @return {String}
     * @api private
     */
    match(str, arr, options) {
        arr = arr || [];
        options = options || {};
        arr.sort();
        const arrX = lodash_1.clone(arr);
        let strX = String(str);
        let prefix = '';
        if (options.ignoreSlashes !== true) {
            const parts = strX.split('/');
            strX = parts.pop();
            prefix = parts.join('/');
            prefix = parts.length > 0 ? prefix + '/' : prefix;
        }
        const matches = [];
        for (let i = 0; i < arrX.length; i++) {
            if (strip_ansi_1.default(arrX[i]).slice(0, strX.length) === strX) {
                matches.push(arrX[i]);
            }
        }
        if (matches.length === 1) {
            // If we have a slash, don't add a space after match.
            const space = String(strip_ansi_1.default(matches[0])).slice(strip_ansi_1.default(matches[0]).length - 1) === '/' ? '' : ' ';
            return prefix + matches[0] + space;
        }
        else if (matches.length === 0) {
            return undefined;
        }
        else if (strX.length === 0) {
            return matches;
        }
        const longestMatchLength = matches.reduce(function (previous, current) {
            for (let i = 0; i < current.length; i++) {
                if (previous[i] && current[i] !== previous[i]) {
                    return current.substr(0, i);
                }
            }
            return previous;
        }).length;
        // couldn't resolve any further, return all matches
        if (longestMatchLength === strX.length) {
            return matches;
        }
        // return the longest matching portion along with the prefix
        return prefix + matches[0].substr(0, longestMatchLength);
    }
};
exports.default = autocomplete;
