import libAsync = require("libasync");
import NodeFS = require("fs");

import { Exception } from "../common";

import { Logger, LoggerWriter } from "./logger";

export class FileLogger extends Logger {

    protected filePointer: number;

    public static create(fileName: string, callback: (err?: Exception, obj?: Logger) => void): void {

        NodeFS.exists(fileName, function(exists: boolean): void {

            NodeFS.open(fileName, exists ? "a+" : "w", function(err?: Error, fd?: number): void {

                if (err) {

                    callback(new Exception(err.name, err.message));

                } else {

                    let lgr: Logger = new FileLogger(fd);

                    callback(null, lgr);
                }

            });

        });

    }

    private static generateBuiltInWriter(level: string): LoggerWriter {

        return function(this: FileLogger, text: string, next: libAsync.AsyncErrorCallback<Exception>): void {

            NodeFS.write(
                this.filePointer,
                `${this.timeGenerator()} - ${level} - ${text}\n`,
                function(err: Error, written: number): void {

                    if (err) {

                        return next(new Exception(err.name, err.message));
                    }

                    next();
                }
            );
        };
    }

    private constructor(fd: number) {

        super();

        this.filePointer = fd;

        this.registerType("default", FileLogger.generateBuiltInWriter("Normal"));

        this.registerType("warning", FileLogger.generateBuiltInWriter("Warning"));

        this.registerType("info", FileLogger.generateBuiltInWriter("Info"));

        this.registerType("error", FileLogger.generateBuiltInWriter("Error"));

    }

}
