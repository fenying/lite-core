import { HashMap } from "../common";
import * as Results from "./result";
import libAsync = require("async");
import Refer = require("./reference");

export interface EventNextCallback {

    (error?: Error): void;
}

enum OnceListenerStatus {
    NOT_USED,
    EMITTED,
    NOT_EMITTED
}

export interface EventListener<T> {

    once?: number;

    callback: EventCallback<T>;
}

export interface EventCallback<T> {

    (this: T, next: EventNextCallback, ...args: any[]): void;
}

export abstract class EventEmitter<T> {

    private _emitRefer: HashMap<Refer>;

    private _events: HashMap<EventListener<T>[]>;

    private _maxListeners: number;

    public static defaultMaxListeners: number = 10;

    public addListener: (name: string, cb: EventCallback<T>) => T;

    public getMaxListeners(): number {

        return this._maxListeners === null ? EventEmitter.defaultMaxListeners : this._maxListeners;
    }

    public setMaxListeners(n: number): void {

        this._maxListeners = n;
    }

    public constructor() {

        this._maxListeners = null;
        this._events = {};
        this._emitRefer = {};
    }

    public on(name: string, cb: EventCallback<T>): T {

        let events: EventListener<T>[] = this._events[name] || (this._events[name] = []);

        if (this.getMaxListeners() <= 0 || events.length === this.getMaxListeners()) {

            throw new Error("Too many listeners registered.");
        }

        events.push({
            "callback": cb
        });

        this.initCleaner(name);

        return <T><any>this;
    }

    public prependListener(name: string, cb: EventCallback<T>): T {

        let events: EventListener<T>[] = this._events[name] || (this._events[name] = []);

        if (this.getMaxListeners() <= 0 || events.length === this.getMaxListeners()) {

            throw new Error("Too many listeners registered.");
        }

        events.unshift({
            "callback": cb
        });

        this.initCleaner(name);

        return <T><any>this;
    }

    public once(name: string, cb: EventCallback<T>): T {

        let events: EventListener<T>[] = this._events[name] || (this._events[name] = []);

        if (this.getMaxListeners() <= 0 || events.length === this.getMaxListeners()) {

            throw new Error("Too many listeners registered.");
        }

        events.push({
            "callback": cb,
            "once": OnceListenerStatus.NOT_EMITTED
        });

        this.initCleaner(name);

        return <T><any>this;
    }

    public prependOnceListener(name: string, cb: EventCallback<T>): T {

        let evQueue: EventListener<T>[] = this._events[name] || (this._events[name] = []);

        if (this.getMaxListeners() <= 0 || evQueue.length === this.getMaxListeners()) {

            throw new Error("Too many listeners registered.");
        }

        evQueue.unshift({
            "callback": cb,
            "once": OnceListenerStatus.NOT_EMITTED
        });

        this.initCleaner(name);

        return <T><any>this;
    }

    public emit(name: string, ...args: any[]): Promise<any> {

        let ret: Results.Result<void, Error> = new Results.Result<any, Error>();

        let evQueue: EventListener<T>[] = this._events[name];

        if (evQueue && evQueue.length) {

            let refer: Refer = this._emitRefer[name];

            let _this = this;

            refer.refer();

            libAsync.eachOfSeries<EventListener<T>, Error>(

                evQueue,

                function(listener: EventListener<T>, index: number, next: EventNextCallback) {

                    if (!listener) {

                        return next();
                    }

                    if (listener.once !== undefined) {

                        if (listener.once === OnceListenerStatus.NOT_EMITTED) {

                            listener.once = OnceListenerStatus.EMITTED;
                        }
                        else {

                            return next();
                        }
                    }

                    listener.callback.call(_this, next, ...args);
                },
                function(err?: Error) {

                    refer.unrefer();

                    if (err) {

                        ret.reject(err);
                    }
                    else {

                        ret.resolve();
                    }
                }
            );
        }
        else {

            ret.resolve();
        }

        return ret.promise;
    }

    protected initCleaner(name: string): void {

        let refer: Refer = this._emitRefer[name];

        if (!refer) {

            refer = this._emitRefer[name] = new Refer();

            let evQueue: EventListener<T>[] = this._events[name];

            refer.on("empty", function() {

                evQueue.forEach(function(listener: EventListener<T>, index: number): void {

                    if (listener.once === OnceListenerStatus.EMITTED) {

                        evQueue.splice(index, 1);
                    }
                });
            });
        }
    }

    public eventNames(): string[] {

        let ret: string[] = [];

        for (let key in this._events) {

            ret.push(key);
        }

        return ret;
    }

    public listeners(eventName: string): EventCallback<T>[] {

        let ret: EventCallback<T>[] = [];

        if (this._events[eventName]) {

            for (let listener of this._events[eventName]) {

                ret.push(listener.callback);
            }
        }

        return ret;
    }

    public listenerCount(eventName: string): number {

        if (this._events[eventName]) {

            return this._events[eventName].length;
        }

        return 0;
    }

    public removeAllListeners(eventName?: string): T {

        if (eventName) {

            this._events[eventName] = [];
        }
        else {

            this._events = {};
        }

        return <T><any>this;
    }

    public removeListener(eventName: string, cb: EventCallback<T>): T {

        let evQueue: EventListener<T>[] = this._events[eventName];

        if (evQueue) {

            for (let i: number = 0; i < evQueue.length; i++) {

                if (evQueue[i].callback === cb) {

                    evQueue.splice(i, 1);
                    break;
                }
            }
        }

        return <T><any>this;
    }
}

EventEmitter.prototype.addListener = EventEmitter.prototype.on;
