import libAsync = require("libasync");

import { Exception } from "../common";

import { Logger, LoggerWriter } from "./logger";

export class ConsoleLogger extends Logger {

    public constructor() {

        super();

        this.registerType("default", function(this: ConsoleLogger, data: string, next: libAsync.AsyncErrorCallback<Exception>): void {

            console.log(this.timeGenerator(), "- Normal -", data);

            next();
        });

        this.registerType("warning", function(this: ConsoleLogger, data: string, next: libAsync.AsyncErrorCallback<Exception>): void {

            console.warn(this.timeGenerator(), "- Warning -", data);

            next();
        });

        this.registerType("info", function(this: ConsoleLogger, data: string, next: libAsync.AsyncErrorCallback<Exception>): void {

            console.info(this.timeGenerator(), "- Info -", data);

            next();
        });

        this.registerType("error", function(this: ConsoleLogger, data: string, next: libAsync.AsyncErrorCallback<Exception>): void {

            console.error(this.timeGenerator(), "- Error -", data);

            next();
        });
    }

}
