"use strict";
/**
 * Function library for Vorpal's out-of-the-box
 * API commands. Imported into a Vorpal server
 * through vorpal.use(module).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies.
 */
const lodash_1 = __importDefault(require("lodash"));
function default_1(vorpal) {
    /**
     * Help for a particular command.
     */
    vorpal
        .command('help [command...]')
        .description('Provides help for a given command.')
        .action(function (args, cb) {
        if (args.command) {
            args.command = args.command.join(' ');
            const commandWithName = lodash_1.default.find(this.parent.commands, {
                _name: String(args.command).trim()
            });
            if (commandWithName && !commandWithName._hidden) {
                if (lodash_1.default.isFunction(commandWithName._help)) {
                    commandWithName._help(args.command, str => {
                        this.log(str);
                        cb();
                    });
                    return;
                }
                this.log(commandWithName.helpInformation());
            }
            else {
                this.log(this.parent._commandHelp(args.command));
            }
        }
        else {
            this.log(this.parent._commandHelp(args.command));
        }
        cb();
    });
    /**
     * Exits Vorpal.
     */
    vorpal
        .command('exit')
        .alias('quit')
        .description('Exits application.')
        .action(function (args) {
        args.options = args.options || {};
        args.options.sessionId = this.session.id;
        this.parent.exit(args.options);
    });
}
exports.default = default_1;
