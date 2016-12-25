
import { HashMap, Exception, StdAsyncCallback } from "../common";
import { IEventEmitter, EventListenerConfig } from "./base";

import async = require("async");

/**
 * Signature for an asynchronous listener callback.
 */
export interface AsyncEventListener {

    (this: AsyncEventEmitter, ...args: any[]): void;
}

/**
 * Signature for listeners chaining callback.
 */
export interface AsyncEventChainCallback {

    (err?: Exception, breaked?: boolean): void;
}

export interface AsyncEventListenerConfig extends EventListenerConfig<AsyncEventListener> {

    /**
     * This must be a function.
     */
    "listener": AsyncEventListener;
}

/**
 * This class is a based-class for event emitter.
 * All classes based on this class could obtain the events handling engine, in
 * asynchronous way.
 */
export class AsyncEventEmitter extends IEventEmitter<AsyncEventListener> {

    protected _events: HashMap<AsyncEventListenerConfig[]>;

    public constructor() {

        super();

        this._events = {};

    }

    /**
     * Register a listener to specific event.
     * The new listener will be prepend at the begin of listeners queue.
     */
    public listen(name: string, fn: AsyncEventListener): AsyncEventEmitter {

        if (this._events[name] === undefined) {

            this._events[name] = [];
        }

        this._events[name].unshift({
            "listener": fn
        });

        return this;
    }

    /**
     * Register a once-listener to specific event.
     * The new listener will be prepend at the begin of listeners queue.
     */
    public listenOnce(name: string, fn: AsyncEventListener): AsyncEventEmitter {

        if (this._events[name] === undefined) {

            this._events[name] = [];
        }

        this._events[name].unshift({
            "once": true,
            "listener": fn
        });

        return this;
    }

    /**
     * Register a listener to specific event.
     */
    public on(name: string, fn: AsyncEventListener): AsyncEventEmitter {

        if (this._events[name] === undefined) {

            this._events[name] = [];
        }

        this._events[name].push({
            "listener": fn
        });

        return this;
    }

    /**
     * Register a once-listener to specific event.
     */
    public once(name: string, fn: AsyncEventListener): AsyncEventEmitter {

        if (this._events[name] === undefined) {

            this._events[name] = [];
        }

        this._events[name].push({
            "once": true,
            "listener": fn
        });

        return this;
    }

    /**
     * Trigger/Emit a event.
     */
    public emit(name: string, args: any[] = [], callback?: StdAsyncCallback): void {

        let listenerConfigs: AsyncEventListenerConfig[] = this._events[name];

        if (listenerConfigs === undefined) {

            callback && setImmediate(callback, ...args);

            return;
        }

        let i: number = 0;

        async.whilst(function(): boolean {

            return i < listenerConfigs.length;

        }, function(next: ErrorCallback<Exception>): void {

            let listener: AsyncEventListener = listenerConfigs[i].listener;

            if (listenerConfigs[i].once) {

                listenerConfigs.splice(i--, 1);
            }

            args.push(function(err?: Exception, breaked?: boolean) {

                if (err) {

                    return next(err);
                }

                if (breaked) {

                    i = listenerConfigs.length;
                }

                args.pop();

                i++;

                next();
            });

            setImmediate(listener.bind(this), ...args);

        }.bind(this), function(err?: Exception): void {

            callback && callback(err);

        });

    }

}
