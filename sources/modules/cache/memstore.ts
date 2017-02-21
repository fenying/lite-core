import { HashMap } from "../common";
import libAsync = require("libasync");


export interface IMemoryTable<T> {

    /**
     * Add a value if the specific key if not existing.
     * 
     * Params:
     * 
     * - `EXPIRES: Date|number`
     * 
     * If EXPIRES is typeof Date, the new key will be expired
     * at that time.
     *
     * Or if EXPIRES is less then milliseconds of one year, 
     * the new key will be expired in EXPIRES ms; if EXPIRES
     * is larger then milliseconds of one year, it will be
     * considered as a Unix timestamp (ms), and the new key
     * will be expired at that time.
     */
    add(key: string, value: T, expires?: any): boolean;

    /**
     * Replace a value of specific key if existing.
     */
    replace(key: string, value: T, expires?: any): boolean;

    /**
     * Set the value for a specific key.
     */
    set(key: string, value: T, expires?: any): IMemoryTable<T>;

    /**
     * Get the time-to-live of a key.
     * If specific key will not expire, return -1.
     * If specific key doesn't exist, return undefined.
     */
    ttl(key: string): number;

    /**
     * Set the new value for time-to-live of a key.
     * If newTTL === null, the key will be keep forever.
     */
    ttl(key: string, newTTL: number): boolean;

    /**
     * Get the value of a specific key.
     */
    get(key: string): T;

    /**
     * Get the values of specific keys.
     */
    get(key: string[]): HashMap<T>;

    /**
     * Get the value of a specific key, and remove it after fetch.
     */
    fetch(key: string): T;

    /**
     * Get the values of specific keys, and remove them after fetch.
     */
    fetch(key: string[]): HashMap<T>;

    /**
     * Check if a key exists in this table.
     */
    exist(key: string): boolean;

    /**
     * Check if specific keys exists in this table.
     * Return true only when all specific keys exist.
     */
    exist(key: string[]): boolean;

    /**
     * Delete a key from this table.
     */
    delete(key: string): IMemoryTable<T>;

    /**
     * Delete multi-keys from this table.
     */
    delete(key: string[]): IMemoryTable<T>;

    /**
     * Delete all data from this table.
     */
    truncate(): IMemoryTable<T>;

    /**
     * Number of keys in this table.
     */
    readonly length: number;

    /**
     * Get all keys in this table.
     */
    readonly keys: string[];

    /**
     * Execute the garbage collector.
     */
    gc(asyncCallback?: libAsync.AsyncErrorCallback<Error>): void;
}

interface MemoryNode<T> {

    "value": T;

    "expires"?: number;
}

class MemoryTable<T> implements IMemoryTable<T> {

    private spaces: HashMap<MemoryNode<T>>;

    private count: number;

    public constructor() {

        this.spaces = {};

        this.count = 0;
    }

    public get length(): number {

        return this.count;
    }

    public get keys(): string[] {

        let ret: string[] = [];

        for (let k in this.spaces) {

            ret.push(k);
        }

        return ret;
    }

    private getExpires(expires: any): number {

        if (expires instanceof Date) {

            return expires.getTime();

        } else if (typeof expires === "number") {

            if (expires <= 31536000000) {

                expires = new Date().getTime() + expires;
            }

            return expires;

        } else {

            return undefined;
        }

    }

    public get(key: string | string[]): any {

        let node: MemoryNode<T>;
        let now: number = new Date().getTime();

        if (key instanceof Array) {

            let rtn: HashMap<T> = {};

            for (let x of key) {

                if (node = this.spaces[x]) {

                    if (node.expires !== undefined && node.expires <= now) {

                        delete this.spaces[x];

                        this.count--;

                        continue;
                    }

                    rtn[x] = node.value;
                }
            }

            return rtn;

        } else {

            if (node = this.spaces[key]) {

                if (node.expires !== undefined && node.expires <= now) {

                    delete this.spaces[key];

                    this.count--;

                    return undefined;
                }

                return node.value;

            } else {

                return undefined;
            }
        }

    }

    public fetch(key: string | string[]): any {

        let node: MemoryNode<T>;
        let now: number = new Date().getTime();

        if (key instanceof Array) {

            let rtn: HashMap<T> = {};

            for (let x of key) {

                if (node = this.spaces[x]) {

                    if (node.expires === undefined || node.expires > now) {

                        rtn[x] = node.value;
                    }

                    delete this.spaces[x];

                    this.count--;
                }

            }

            return rtn;

        } else {

            if (node = this.spaces[key]) {

                delete this.spaces[key];

                this.count--;

                if (node.expires !== undefined && node.expires <= now) {

                    return undefined;
                }

                return node.value;

            } else {

                return undefined;
            }
        }

    }

    public ttl(key: string, newTTL?: number): any {

        let node: MemoryNode<T> = this.spaces[key];

        if (newTTL !== undefined) {

            if (node) {

                node.expires = newTTL + new Date().getTime();

                return true;
            }

            return false;

        } else {

            if (node) {

                if (node.expires !== undefined) {

                    if (node.expires <= new Date().getTime()) {

                        delete this.spaces[key];

                        this.count--;

                        return undefined;

                    } else {

                        return node.expires - new Date().getTime();
                    }
                }

                return -1;

            } else {

                return undefined;
            }

        }

    }

    public exist(key: string|string[]): boolean {

        let node: MemoryNode<T>;
        let now: number = new Date().getTime();

        if (key instanceof Array) {

            for (let x of key) {

                if (node = this.spaces[x]) {

                    if (node.expires !== undefined && node.expires <= now) {

                        delete this.spaces[x];

                        this.count--;

                        return false;
                    }

                } else {

                    return false;
                }
            }

            return true;

        } else {

            if (node = this.spaces[key]) {

                if (node.expires !== undefined && node.expires <= now) {

                    delete this.spaces[key];

                    this.count--;

                    return false;
                }

                return true;
            }

            return false;
        }
    }

    public add(key: string, value: T, expires?: any): boolean {

        if (this.spaces[key] !== undefined) {

            return false;
        }

        this.count++;

        this.spaces[key] = {

            "value": value,

            "expires": this.getExpires(expires)
        };

        return true;
    }

    public replace(key: string, value: T, expires?: any): boolean {

        if (this.spaces[key] === undefined) {

            return false;
        }

        this.spaces[key] = {

            "value": value,

            "expires": this.getExpires(expires)
        };

        return true;
    }

    public set(key: string, value: T, expires?: any): IMemoryTable<T> {

        if (!this.spaces[key]) {

            this.count++;
        }

        this.spaces[key] = {

            "value": value,

            "expires": this.getExpires(expires)
        };

        return this;
    }

    public delete(key: string|string[]): IMemoryTable<T> {

        if (key instanceof Array) {

            for (let x of key) {

                delete this.spaces[x];

                this.count--;

            }

        } else {

            delete this.spaces[key];

            this.count--;

        }

        return this;
    }

    public gc<E>(asyncCallback?: libAsync.AsyncErrorCallback<E>): void {

        if (asyncCallback) {

            this.gcAsync(asyncCallback);

        } else {

            this.gcSync();
        }
    }

    protected gcSync(): void {

        let now: number = new Date().getTime();

        for (let key in this.spaces) {

            let item: MemoryNode<T> = this.spaces[key];

            if (item.expires !== undefined && item.expires < now) {

                delete this.spaces[key];
                this.count--;
            }

        }
    }

    protected gcAsync<E>(asyncCallback: libAsync.AsyncErrorCallback<E>): void {

        let now: number = new Date().getTime();

        libAsync.forEach.series(this.spaces, function(item: MemoryNode<T>, key: string, next: libAsync.AsyncErrorCallback<E>): void {

            if (item && item.expires !== undefined && item.expires < now) {

                delete this.spaces[key];
                this.count--;
            }

            setImmediate(next);

        }.bind(this), asyncCallback);
    }

    public truncate(): IMemoryTable<T> {

        this.spaces = {};

        this.count = 0;

        return this;
    }
}

export interface IMemoryStorage {

    /**
     * Get a typed-table by name.
     */
    get<T>(name: string): IMemoryTable<T>;

    /**
     * Get a table by name.
     */
    get(name: string): IMemoryTable<any>;

    /**
     * Create a table of specific type.
     */
    create<T>(name: string): boolean;

    /**
     * Create a table.
     */
    create(name: string): boolean;

    /**
     * Destroy a table.
     */
    drop(name: string): boolean;
}

class MemoryStorage implements IMemoryStorage {

    private tables: HashMap<IMemoryTable<any>>;

    public constructor() {

        this.tables = {};
    }

    public get<T>(name: string): IMemoryTable<T> {

        return this.tables[name];
    }

    public drop(name: string): boolean {

        if (this.tables[name]) {

            delete this.tables[name];

            return true;
        }

        return false;
    }

    public create<T>(name: string): boolean {

        if (this.tables[name]) {

            return false;
        }

        this.tables[name] = new MemoryTable<T>();

        return true;
    }
}

/**
 * Memory Stroage Manager
 */
export let memory: IMemoryStorage = new MemoryStorage();
