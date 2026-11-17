export class RecordCollection {
    #records;

    constructor(records) {
        if (!Array.isArray(records)) {
            throw new TypeError("A RecordCollection needs an array of records.");
        }

        this.#records = records;
    }

    get size() {
        return this.#records.length;
    }

    [Symbol.iterator]() {
        const records = this.#records;
        let position = 0;

        return {
            next() {
                if (position < records.length) {
                    const value = records[position];

                    position += 1;
                    return { value, done: false };
                }

                return { value: undefined, done: true };
            },
            [Symbol.iterator]() {
                return this;
            }
        };
    }

    batches(size) {
        return inBatches(this, size);
    }
}

export function* inBatches(iterable, size) {
    if (!Number.isInteger(size) || size < 1) {
        throw new RangeError("The batch size must be a whole number above zero.");
    }

    let batch = [];

    for (const item of iterable) {
        batch.push(item);

        if (batch.length === size) {
            yield batch;
            batch = [];
        }
    }

    if (batch.length > 0) {
        yield batch;
    }
}