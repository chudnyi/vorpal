"use strict";
/**
 * Module dependencies.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
class CommandInstance {
    /**
     * Initialize a new `CommandInstance` instance.
     *
     * @param {Object} params
     * @return {CommandInstance}
     * @api public
     */
    constructor(params = {}) {
        const { command, commandObject, args, commandWrapper, callback, downstream } = params;
        this.command = command;
        this.commandObject = commandObject;
        this.args = args;
        this.commandWrapper = commandWrapper;
        this.session = commandWrapper.session;
        this.parent = this.session.parent;
        this.callback = callback;
        this.downstream = downstream;
    }
    /**
     * Cancel running command.
     */
    cancel() {
        this.session.emit('vorpal_command_cancel');
    }
    /**
     * Route stdout either through a piped command, or the session's stdout.
     */
    log(...args) {
        if (this.downstream) {
            const fn = this.downstream.commandObject._fn || lodash_1.default.noop;
            this.session.registerCommand();
            this.downstream.args.stdin = args;
            const onComplete = (err) => {
                if (this.session.isLocal() && err) {
                    this.session.log(err.stack || err);
                    this.session.parent.emit('client_command_error', {
                        command: this.downstream.command,
                        error: err
                    });
                }
                this.session.completeCommand();
            };
            const validate = this.downstream.commandObject._validate;
            if (lodash_1.default.isFunction(validate)) {
                try {
                    validate.call(this.downstream, this.downstream.args);
                }
                catch (e) {
                    // Log error without piping to downstream on validation error.
                    this.session.log(e.toString());
                    onComplete(null);
                    return;
                }
            }
            const res = fn.call(this.downstream, this.downstream.args, onComplete);
            if (res && lodash_1.default.isFunction(res.then)) {
                res.then(onComplete, onComplete);
            }
        }
        else {
            this.session.log(...args);
        }
    }
    prompt(a, b, c) {
        return this.session.prompt(a, b, c);
    }
    delimiter(a, b, c) {
        return this.session.delimiter(a, b, c);
    }
    help(a, b, c) {
        return this.session.help(a, b, c);
    }
    match(a, b, c) {
        return this.session.match(a, b, c);
    }
}
exports.CommandInstance = CommandInstance;
