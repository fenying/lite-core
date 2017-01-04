
import { HashMap } from "../common";

import * as libResults from "./result";
import libEvents = require("events");

export enum Status {

    READY,
    RUNING,
    CANCELLED,
    PAUSED,
    COMPLETED,
    PRE_CANCEL,
    PRE_PAUSE
}

export interface WorkerNextCallback {

    (...args: any[]): void;
}

export interface WorkerCallback {

    (this: Task, next: WorkerNextCallback, ...args: any[]): void;
}

export class Task extends libEvents.EventEmitter {

    private _status: Status;

    protected _workers: WorkerCallback[];

    protected _cursor: number;

    public get status(): Status {

        return this._status;
    }

    public constructor() {

        super();

        this._status = Status.READY;

        this._workers = [];

        this._cursor = 0;
    }

    public cancel(): Promise<void> {

        let ret: libResults.Result<void, Error> = new libResults.Result<void, Error>();

        switch (this._status) {
        case Status.READY:
        case Status.CANCELLED:
        case Status.COMPLETED:

            ret.reject(new Error("The task is not running."));
            break;

        case Status.PAUSED:


            this._status = Status.CANCELLED;
            ret.resolve();
            break;

        case Status.RUNING:
        case Status.PRE_CANCEL:
        case Status.PRE_PAUSE:

            this._status = Status.PRE_CANCEL;

            this.once("cancel-result", function(this: Task, err?: Error) {

                if (err) {

                    ret.reject(err);
                }
                else {

                    ret.resolve();
                }
            });

            break;

        }

        return ret.promise;
    }

    public resume(): Promise<void> {

        let ret: libResults.Result<void, Error> = new libResults.Result<void, Error>();

        switch (this._status) {
        case Status.READY:
        case Status.CANCELLED:
        case Status.COMPLETED:
        case Status.PRE_CANCEL:

            ret.reject(new Error("The task is not running."));
            break;

        case Status.PRE_PAUSE:

            this._status = Status.RUNING;
            this.emit("pause-result", new Error("The pause action was interrupted."));

            ret.resolve();

            break;

        case Status.PAUSED:

            this._status = Status.RUNING;

            ret.resolve();

            this.mainLoop();

            break;

        case Status.RUNING:

            ret.resolve();
            break;
        }

        return ret.promise;
    }

    public pause(): Promise<void> {

        let ret: libResults.Result<void, Error> = new libResults.Result<void, Error>();

        switch (this._status) {
        case Status.READY:
        case Status.CANCELLED:
        case Status.COMPLETED:
        case Status.PRE_CANCEL:

            ret.reject(new Error("The task is not running."));
            break;

        case Status.RUNING:
        case Status.PRE_PAUSE:

            this._status = Status.PRE_PAUSE;

            this.once("pause-result", function(this: Task, err?: Error) {

                if (err) {

                    ret.reject(err);
                }
                else {

                    ret.resolve();
                }
            });

            break;

        case Status.PAUSED:

            ret.resolve();
            break;
        }

        return ret.promise;
    }

    public chain(worker: WorkerCallback): Task {

        this._workers.push(worker);

        return this;
    }

    public start(): Task {

        switch (this._status) {
        case Status.READY:
        case Status.COMPLETED:

            this._status = Status.RUNING;

            this._cursor = 0;

            this.mainLoop();

            break;

        default:

            this.emit("error", new Error("Task only can be started under READY/COMPLETED status."));
        }

        return this;
    }

    protected mainLoop(...args: any[]): void {

        switch (this._status) {
        case Status.READY:
        case Status.COMPLETED:

            this.emit("error", new Error("This task cannot be run."));
            break;

        case Status.RUNING:

            let worker: WorkerCallback = this._workers[this._cursor];

            if (worker) {

                let called: boolean = false;
                worker.call(this, (function(this: Task, ...args: any[]): void {

                    if (!called) {

                        called = true;

                        this._cursor++;

                        this.mainLoop(...args);
                    }
                    else {

                        this.emit("error", new Error("The next callback could be called only once."));
                    }

                }).bind(this), ...args);
            }
            else {

                this._status = Status.COMPLETED;

                this.emit("done");
            }

            break;

        case Status.PAUSED:

            this.emit("error", new Error("This task has been paused."));

        case Status.CANCELLED:

            this.emit("error", new Error("A cancelled task cannot be run."));
            break;

        case Status.PRE_PAUSE:

            this._status = Status.PAUSED;

            this.emit("pause-result");

            break;

        case Status.PRE_CANCEL:

            this.emit("pause-result", new Error("This task is being cancelled."));

            this.emit("cancel-result");
            break;
        }

    }
}
