export const EDITED = Symbol("edited");

export function markEdited(record) {
    return Object.freeze({ ...record, [EDITED]: true });
}

export function isEdited(record) {
    return record[EDITED] === true;
}