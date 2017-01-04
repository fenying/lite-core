
import libEvents = require("events");

class Refer extends libEvents.EventEmitter {

    private _referTimes: number;

    public constructor() {

        super();

        this._referTimes = 0;
    }

    public refer(): Refer {

        this._referTimes++;

        return this;
    }

    public unrefer(): Refer {

        this._referTimes--;

        if (this._referTimes === 0) {

            this.emit("empty");
        }

        return this;
    }

    public get references(): number {

        return this._referTimes;
    }

}

export = Refer;
