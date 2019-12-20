"use strict";
/**
 * Module dependencies.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const lodash_1 = __importDefault(require("lodash"));
const option_1 = __importDefault(require("./option"));
const util_1 = __importDefault(require("./util"));
class Command extends events_1.EventEmitter {
    /**
     * Initialize a new `Command` instance.
     *
     * @param {String} name
     * @param {Vorpal} parent
     * @return {Command}
     * @api public
     */
    constructor(name, parent) {
        super();
        this.commands = [];
        this.commands = [];
        this.options = [];
        this._args = [];
        this._aliases = [];
        this._name = name;
        this._relay = false;
        this._hidden = false;
        this._parent = parent;
        this._mode = false;
        this._catch = false;
        this._help = undefined;
        this._init = undefined;
        this._after = undefined;
        this._allowUnknownOptions = false;
    }
    /**
     * Registers an option for given command.
     *
     * @param {String} flags
     * @param {String} description
     * @param {Function} fn
     * @param {String} defaultValue
     * @return {Command}
     * @api public
     */
    option(flags, description, autocomplete) {
        const option = new option_1.default(flags, description, autocomplete);
        const oname = option.name();
        const name = lodash_1.default.camelCase(oname);
        let defaultValue;
        // preassign default value only for --no-*, [optional], or <required>
        if (option.bool === false || option.optional || option.required) {
            // when --no-* we make sure default is true
            if (option.bool === false) {
                defaultValue = true;
            }
            // preassign only if we have a default
            if (defaultValue !== undefined) {
                this[name] = defaultValue;
            }
        }
        // register the option
        this.options.push(option);
        // when it's passed assign the value
        // and conditionally invoke the callback
        this.on(oname, val => {
            // unassigned or bool
            if (lodash_1.default.isBoolean(this[name]) && lodash_1.default.isUndefined(this[name])) {
                // if no value, bool true, and we have a default, then use it!
                if (val === null) {
                    this[name] = option.bool ? defaultValue || true : false;
                }
                else {
                    this[name] = val;
                }
            }
            else if (val !== null) {
                // reassign
                this[name] = val;
            }
        });
        return this;
    }
    /**
     * Defines an action for a given command.
     *
     * @param {Function} fn
     * @return {Command}
     * @api public
     */
    action(fn) {
        this._fn = fn;
        return this;
    }
    /**
     * Let's you compose other funtions to extend the command.
     *
     * @param {Function} fn
     * @return {Command}
     * @api public
     */
    use(fn) {
        return fn(this);
    }
    /**
     * Defines a function to validate arguments
     * before action is performed. Arguments
     * are valid if no errors are thrown from
     * the function.
     *
     * @param fn
     * @returns {Command}
     * @api public
     */
    validate(fn) {
        this._validate = fn;
        return this;
    }
    /**
     * Defines a function to be called when the
     * command is canceled.
     *
     * @param fn
     * @returns {Command}
     * @api public
     */ cancel(fn) {
        this._cancel = fn;
        return this;
    }
    /**
     * Defines a method to be called when
     * the command set has completed.
     *
     * @param {Function} fn
     * @return {Command}
     * @api public
     */
    done(fn) {
        this._done = fn;
        return this;
    }
    /**
     * Defines tabbed auto-completion
     * for the given command. Favored over
     * deprecated command.autocompletion.
     *
     * @param {IAutocompleteConfig} conf
     * @return {Command}
     * @api public
     */
    autocomplete(conf) {
        this._autocomplete = conf;
        return this;
    }
    /**
     * Defines an init action for a mode command.
     *
     * @param {Function} fn
     * @return {Command}
     * @api public
     */
    init(fn) {
        if (this._mode !== true) {
            throw Error('Cannot call init from a non-mode action.');
        }
        this._init = fn;
        return this;
    }
    /**
     * Defines a prompt delimiter for a
     * mode once entered.
     *
     * @param {String} delimiter
     * @return {Command}
     * @api public
     */
    delimiter(delimiter) {
        this._delimiter = delimiter;
        return this;
    }
    /**
     * Sets args for static typing of options
     * using minimist.
     *
     * @param {Object} types
     * @return {Command}
     * @api public
     */
    types(types) {
        const supported = ['string', 'boolean'];
        for (const item of Object.keys(types)) {
            if (supported.indexOf(item) === -1) {
                throw new Error('An invalid type was passed into command.types(): ' + item);
            }
            types[item] = !lodash_1.default.isArray(types[item]) ? [types[item]] : types[item];
        }
        this._types = types;
        return this;
    }
    /**
     * Defines an alias for a given command.
     *
     * @param {String} alias
     * @return {Command}
     * @api public
     */
    alias(...aliases) {
        for (const alias of aliases) {
            if (lodash_1.default.isArray(alias)) {
                for (const subalias of alias) {
                    this.alias(subalias);
                }
                return this;
            }
            this._parent.commands.forEach(cmd => {
                if (!lodash_1.default.isEmpty(cmd._aliases)) {
                    if (lodash_1.default.includes(cmd._aliases, alias)) {
                        const msg = 'Duplicate alias "' +
                            alias +
                            '" for command "' +
                            this._name +
                            '" detected. Was first reserved by command "' +
                            cmd._name +
                            '".';
                        throw new Error(msg);
                    }
                }
            });
            this._aliases.push(alias);
        }
        return this;
    }
    /**
     * Defines description for given command.
     *
     * @param {String} str
     * @return {Command}
     * @api public
     */
    description(str) {
        if (arguments.length === 0) {
            return this._description;
        }
        this._description = str;
        return this;
    }
    /**
     * Removes self from Vorpal instance.
     *
     * @return {Command}
     * @api public
     */
    remove() {
        const self = this;
        this._parent.commands = lodash_1.default.reject(this._parent.commands, function (command) {
            if (command._name === self._name) {
                return true;
            }
        });
        return this;
    }
    /**
     * Returns the commands arguments as string.
     *
     * @param {String} description
     * @return {String}
     * @api public
     */
    arguments(description) {
        return this._parseExpectedArgs(description.split(/ +/));
    }
    /**
     * Returns the help info for given command.
     *
     * @return {String}
     * @api public
     */
    helpInformation() {
        let description = [];
        const cmdName = this._name;
        let alias = '';
        if (this._description) {
            description = [`  ${this._description}`, ''];
        }
        if (this._aliases.length > 0) {
            alias = `  Alias: ${this._aliases.join(' | ')}\n`;
        }
        const usage = ['', `  Usage:  ${cmdName} ${this.usage()}`, ''];
        const cmds = [];
        const help = String(this.optionHelp().replace(/^/gm, '    '));
        const options = ['  Options:', '', help, ''];
        return usage
            .concat(cmds)
            .concat(alias)
            .concat(description)
            .concat(options)
            .join('\n')
            .replace(/\n\n\n/g, '\n\n');
    }
    /**
     * Doesn't show command in the help menu.
     *
     * @return {Command}
     * @api public
     */
    hidden() {
        this._hidden = true;
        return this;
    }
    /**
     * Allows undeclared options to be passed in with the command.
     *
     * @param {Boolean} [allowUnknownOptions=true]
     * @return {Command}
     * @api public
     */
    allowUnknownOptions(allowUnknownOptions = true) {
        this._allowUnknownOptions = !!allowUnknownOptions;
        return this;
    }
    /**
     * Returns the command usage string for help.
     *
     * @param {String} str
     * @return {String}
     * @api public
     */
    usage(str) {
        const args = this._args.map(arg => util_1.default.humanReadableArgName(arg));
        const usage = '[options]' +
            (this.commands.length ? ' [command]' : '') +
            (this._args.length ? ` ${args.join(' ')}` : '');
        if (lodash_1.default.isNil(str)) {
            return this._usage || usage;
        }
        this._usage = str;
        return this;
    }
    /**
     * Returns the help string for the command's options.
     *
     * @return {String}
     * @api public
     */
    optionHelp() {
        const width = this._largestOptionLength();
        // Prepend the help information
        return [util_1.default.pad('--help', width) + '  output usage information']
            .concat(this.options.map(option => `${util_1.default.pad(option.flags, width)}  ${option.description}`))
            .join('\n');
    }
    /**
     * Returns the length of the longest option.
     *
     * @return {Number}
     * @api private
     */
    _largestOptionLength() {
        return this.options.reduce((max, option) => Math.max(max, option.flags.length), 0);
    }
    /**
     * Adds a custom handling for the --help flag.
     *
     * @param {Function} fn
     * @return {Command}
     * @api public
     */
    help(fn) {
        if (lodash_1.default.isFunction(fn)) {
            this._help = fn;
        }
        return this;
    }
    /**
     * Edits the raw command string before it
     * is executed.
     *
     * @param {String} str
     * @return {String} str
     * @api public
     */
    parse(fn) {
        if (lodash_1.default.isFunction(fn)) {
            this._parse = fn;
        }
        return this;
    }
    /**
     * Adds a command to be executed after command completion.
     *
     * @param {Function} fn
     * @return {Command}
     * @api public
     */
    after(fn) {
        if (lodash_1.default.isFunction(fn)) {
            this._after = fn;
        }
        return this;
    }
    /**
     * Parses and returns expected command arguments.
     *
     * @param {String} args
     * @return {Array}
     * @api private
     */
    _parseExpectedArgs(args) {
        if (!args.length) {
            return;
        }
        const self = this;
        args.forEach(arg => {
            const argDetails = {
                required: false,
                name: '',
                variadic: false
            };
            if (arg.startsWith('<')) {
                argDetails.required = true;
                argDetails.name = arg.slice(1, -1);
            }
            else if (arg.startsWith('[')) {
                argDetails.name = arg.slice(1, -1);
            }
            if (argDetails.name.length > 3 && argDetails.name.slice(-3) === '...') {
                argDetails.variadic = true;
                argDetails.name = argDetails.name.slice(0, -3);
            }
            if (argDetails.name) {
                self._args.push(argDetails);
            }
        });
        // If the user entered args in a weird order,
        // properly sequence them.
        if (self._args.length > 1) {
            self._args = self._args.sort(function (argu1, argu2) {
                if (argu1.required && !argu2.required) {
                    return -1;
                }
                else if (argu2.required && !argu1.required) {
                    return 1;
                }
                else if (argu1.variadic && !argu2.variadic) {
                    return 1;
                }
                else if (argu2.variadic && !argu1.variadic) {
                    return -1;
                }
                return 0;
            });
        }
        return;
    }
}
exports.default = Command;
