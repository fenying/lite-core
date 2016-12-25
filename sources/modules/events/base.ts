
import { HashMap } from "../common";

export interface EventListenerConfig<T> {

    /**
     * Specify whether this listener will be called only once.
     */
    "once"?: boolean;

    /**
     * This must be a function.
     */
    "listener": T;
}

export abstract class IEventEmitter<T> {

    protected _events: HashMap<EventListenerConfig<T>[]>;

    /**
     * Aka method `on`, this is an alias， for the compatibilities.
     */
    public addEventListener: (name: string, fn: T) => IEventEmitter<T>;

    public constructor() {

        this.addEventListener = this.on;
    }

    /**
     * Get the names list of events.
     */
    public get events(): string[] {

        let rtn: string[] = [];

        for (let name in this._events) {

            rtn.push(name);
        }

        return rtn;
    }

    /**
     * Get the number of listeners to an event.
     */
    public countListeners(name: string): number {

        if (this._events[name] === undefined) {

            return 0;
        }

        return this._events[name].length;
    }

    /**
     * Unbind a listener to a specific event.
     * If no listener is specified, all listeners to that event will be removed.
     */
    public unbind(name: string, fn?: T): number {

        let lst: EventListenerConfig<T>[] = this._events[name];

        if (lst === undefined) {

            return 0;
        }

        if (fn) {

            for (let x: number; x < lst.length; x++) {

                if (lst[x].listener === fn) {

                    lst.splice(x, 1);

                    return 1;
                }
            }

        } else {

            let deleted: number;

            deleted = this._events[name].length;

            delete this._events[name];

            return deleted;
        }
    }

    /**
     * Register a listener to specific event.
     */
    public abstract on(name: string, fn: T): IEventEmitter<T>;

    /**
     * Register a once-listener to specific event.
     */
    public abstract once(name: string, fn: T): IEventEmitter<T>;

    /**
     * Register a listener to specific event.
     * The new listener will be prepend at the begin of listeners queue.
     */
    public abstract listen(name: string, fn: T): IEventEmitter<T>;

    /**
     * Register a once-listener to specific event.
     * The new listener will be prepend at the begin of listeners queue.
     */
    public abstract listenOnce(name: string, fn: T): IEventEmitter<T>;

}
