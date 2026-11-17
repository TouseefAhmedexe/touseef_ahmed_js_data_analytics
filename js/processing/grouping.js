export const DEDUPE_OPTIONS = Object.freeze([
    { value: "title", label: "Title" },
    { value: "category", label: "Category" },
    { value: "assignedTo", label: "Assigned user" }
]);

export function groupBy(records, getKey) {
    const groups = new Map();

    for (const record of records) {
        const key = getKey(record);
        const group = groups.get(key);

        if (group === undefined) {
            groups.set(key, [record]);
        } else {
            group.push(record);
        }
    }

    return groups;
}

export function uniqueValues(records, getValue) {
    return [...new Set(Array.from(records, getValue))]
        .sort((first, second) => String(first).localeCompare(String(second)));
}

export function removeDuplicates(records, property) {
    if (!DEDUPE_OPTIONS.some((option) => option.value === property)) {
        throw new RangeError(`Duplicates cannot be removed by "${property}".`);
    }

    const seen = new Set();
    const unique = [];

    for (const record of records) {
        const value = record[property];

        if (seen.has(value)) {
            continue;
        }

        seen.add(value);
        unique.push(record);
    }

    return { records: Object.freeze(unique), removed: records.length - unique.length };
}