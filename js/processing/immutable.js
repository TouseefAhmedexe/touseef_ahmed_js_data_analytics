import { markEdited } from "../core/symbols.js";
import { checkRecord, toRecord } from "./validation.js";

export function withUpdatedRecord(records, id, changes) {
    const index = records.findIndex((record) => record.id === id);

    if (index === -1) {
        throw new RangeError(`No record has the id ${id}.`);
    }

    const merged = { ...records[index], ...changes };
    const reason = checkRecord(merged);

    if (reason !== "") {
        throw new TypeError(reason);
    }

    const updated = markEdited(toRecord(merged));

    return Object.freeze([...records.slice(0, index), updated, ...records.slice(index + 1)]);
}