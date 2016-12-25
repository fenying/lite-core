
import { HashMap } from "../common";
import { IEventEmitter, EventListenerConfig } from "./base";

export interface SyncEventListener {

    (this: SyncEventEmitter, ...args: any[]): any;
}

export interface SyncEventListenerConfig extends EventListenerConfig<SyncEventListener> {

    /**
     * This must be a function.
     */
    "listener": SyncEventListener;
}

/**
 * This class is a based-class for event emitter.
 * All classes based on this class could obtain the events handling engine, in
 * synchronous way.
 */
export class SyncEventEmitter extends IEventEmitter<SyncEventListener> {

    protected _events: HashMap<SyncEventListenerConfig[]>;

    public constructor() {

        super();

        this._events = {};

    }

    /**
     * Register a listener to specific event.
     * The new listener will be prepend at the begin of listeners queue.
     */
    public listen(name: string, fn: SyncEventListener): SyncEventEmitter {

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
    public listenOnce(name: string, fn: SyncEventListener): SyncEventEmitter {

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
    public on(name: string, fn: SyncEventListener): SyncEventEmitter {

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
    public once(name: string, fn: SyncEventListener): SyncEventEmitter {

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
    public emit(name: string, args?: any[]): void {

        let listenerConfigs: SyncEventListenerConfig[] = this._events[name];

        if (listenerConfigs === undefined) {

            return;
        }

        for (let i: number = 0; i < listenerConfigs.length; i++) {

            let result = listenerConfigs[i].listener.apply(this, args);

            if (listenerConfigs[i].once) {

                listenerConfigs.splice(i--, 1);
            }

            if (result === false) {

                return;
            }
        }
    }

}
