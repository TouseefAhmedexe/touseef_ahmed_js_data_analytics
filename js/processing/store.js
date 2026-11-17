import { groupBy, removeDuplicates, uniqueValues } from "./grouping.js";
import { withUpdatedRecord } from "./immutable.js";

const GROUPERS = Object.freeze({
    category: (record) => record.category,
    status: (record) => record.status,
    priority: (record) => record.priority,
    user: (record) => record.assignedTo
});

const buildIndex = (records) => new Map(records.map((record) => [record.id, record]));

export class DataStore {
    #original;
    #records;
    #version = 1;
    #index;
    #groups = new Map();
    #listeners = [];

    constructor(records) {
        if (!Array.isArray(records)) {
            throw new TypeError("A DataStore needs an array of records.");
        }

        this.#original = Object.freeze([...records]);
        this.#records = this.#original;
        this.#index = buildIndex(this.#records);
    }

    get original() {
        return this.#original;
    }

    get records() {
        return this.#records;
    }

    get version() {
        return this.#version;
    }

    get size() {
        return this.#records.length;
    }

    getById(id) {
        return this.#index.get(id);
    }

    group(name) {
        const getKey = GROUPERS[name];

        if (getKey === undefined) {
            throw new RangeError(`Unknown grouping: ${name}.`);
        }

        if (!this.#groups.has(name)) {
            this.#groups.set(name, groupBy(this.#records, getKey));
        }

        return this.#groups.get(name);
    }

    values(name) {
        const getValue = GROUPERS[name];

        if (getValue === undefined) {
            throw new RangeError(`Unknown grouping: ${name}.`);
        }

        return uniqueValues(this.#records, getValue);
    }

    candidates(filters) {
        const lists = [];

        if (filters.category !== "all") {
            lists.push(this.group("category").get(filters.category) ?? []);
        }

        if (filters.status !== "all") {
            lists.push(this.group("status").get(filters.status) ?? []);
        }

        if (filters.priority !== "all") {
            lists.push(this.group("priority").get(filters.priority) ?? []);
        }

        if (filters.user !== "all") {
            lists.push(this.group("user").get(filters.user) ?? []);
        }

        if (lists.length === 0) {
            return this.#records;
        }

        return lists.reduce((shortest, list) => (list.length < shortest.length ? list : shortest));
    }

    update(id, changes) {
        this.#commit(withUpdatedRecord(this.#records, id, changes));
        return this.getById(id);
    }

    dedupe(property) {
        const result = removeDuplicates(this.#records, property);

        if (result.removed > 0) {
            this.#commit(result.records);
        }

        return result.removed;
    }

    reset() {
        if (this.#records === this.#original) {
            return false;
        }

        this.#commit(this.#original);
        return true;
    }

    subscribe(listener) {
        this.#listeners.push(listener);

        return () => {
            this.#listeners = this.#listeners.filter((item) => item !== listener);
        };
    }

    #commit(records) {
        this.#records = records;
        this.#version += 1;
        this.#index = buildIndex(records);
        this.#groups = new Map();
        this.#listeners.forEach((listener) => listener({ version: this.#version, size: records.length }));
    }
}