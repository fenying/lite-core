
export interface Resolver<T> {

    (val?: T): void;
}

export interface Rejector<E> {

    (val?: E): void;
}

export class Result<T, E> {

    public reject: Rejector<E>;

    public resolve: Resolver<T>;

    public promise: Promise<T>;

    public constructor() {

        let _this: Result<T, E> = this;

        this.promise = new Promise(function(resolver: Resolver<T>, reject: Rejector<E>): void {

            _this.reject = reject;
            _this.resolve = resolver;
        });
    }
}
