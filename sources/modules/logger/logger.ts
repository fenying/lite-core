import libAsync = require("libasync");

import { Exception, HashMap } from "../common";

export interface LoggerWriter {

    (this: Logger, data: string, next: libAsync.AsyncErrorCallback<Exception>): void;
}

export interface LoggerTimeGenerator {

    (): string;
}

export abstract class Logger {

    protected writers: HashMap<LoggerWriter>;

    protected timeGenerator: LoggerTimeGenerator = function(): string {

        return new Date().toUTCString();
    };

    public constructor() {

        this.writers = {};
    }

    /**
     * Set the formatter of time.
     */
    public set timeFormatter(newVal: LoggerTimeGenerator) {

        this.timeGenerator = newVal;
    }

    public get timeFormatter(): LoggerTimeGenerator {

        return this.timeGenerator;
    }

    /**
     * Register a new type of logging method.
     *
     * If a one existed, the old one will be overwritten.
     */
    public registerType(type: string, writer: LoggerWriter): Logger {

        this.writers[type] = writer;

        return this;
    }

    /**
     * Write a piece of log, and get the result in async way, if necessary.
     */
    public write(data: any, type?: string, next?: libAsync.AsyncErrorCallback<Exception>): Logger {

        let writer: LoggerWriter = this.writers[type ? type : "default"];

        if (writer) {

            writer.call(this, data, function(err?: Exception) {

                next && setImmediate(next, err);

            });

        } else {

            next && setImmediate(next, new Exception(
                "BAD-LOGGER",
                "The writer of default type doesn't exist."
            ));
        }

        return this;
    }

}
