import { groupBy } from "./grouping.js";

export const totalRecords = (records) => [...records].length;

export function totalValue(records) {
    let sum = 0;

    for (const record of records) {
        sum += record.value;
    }

    return Math.round(sum * 100) / 100;
}

export function averageValue(records) {
    const list = [...records];

    if (list.length === 0) {
        return 0;
    }

    return Math.round((totalValue(list) / list.length) * 100) / 100;
}

export function completionPercentage(records) {
    const list = [...records];

    if (list.length === 0) {
        return 0;
    }

    const done = list.filter((record) => record.status === "Done").length;

    return Math.round((done / list.length) * 1000) / 10;
}

export function countBy(records, getKey) {
    const counts = new Map();

    for (const record of records) {
        const key = getKey(record);

        counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return counts;
}

export function summarizeByCategory(records) {
    const groups = groupBy(records, (record) => record.category);
    const entries = [...groups].map(([category, items]) => [
        category,
        { count: items.length, totalValue: totalValue(items), averageValue: averageValue(items) }
    ]);

    return new Map(entries.sort((first, second) => first[0].localeCompare(second[0])));
}

export function summarizeBatch(batch) {
    return {
        count: batch.length,
        totalValue: totalValue(batch),
        done: batch.filter((record) => record.status === "Done").length
    };
}