
export class Exception {

    protected msg: string;

    protected num: number;

    public constructor(msg: string, code?: number) {

        this.num = code;
        this.msg = msg;
    }

    public get code(): number {

        return this.num;
    }

    public getCode(): number {

        return this.num;
    }

    public get message(): string {

        return this.msg;
    }

    public getMessage(): string {

        return this.msg;
    }
}

export interface HashMap<T> {

    [key: string]: T;
}

export interface StdAsyncCallback {
    (error?: Exception): void;
}
