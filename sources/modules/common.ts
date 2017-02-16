import libAsync = require("libasync");

export class Exception {

    protected _msg: string;

    protected _name: string;

    public constructor(name: string, msg?: string) {

        this._name = name;
        this._msg = msg;
    }

    public get name(): string {

        return this._name;
    }

    public getName(): string {

        return this._name;
    }

    public get message(): string {

        return this._msg;
    }

    public getMessage(): string {

        return this._msg;
    }
}

export interface HashMap<T> {

    [key: string]: T;
}
