import libAsync = require("libasync");

export class Exception {

    public message: string;

    public name: string;

    public constructor(name: string, msg?: string) {

        this.name = name;
        this.message = msg;
    }

    public getName(): string {

        return this.name;
    }

    public getMessage(): string {

        return this.message;
    }
}

export type HashMap<T> = libAsync.Dictionary<T>;