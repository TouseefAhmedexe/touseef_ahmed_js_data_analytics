const viewCounts = new WeakMap();
const viewedRecords = new WeakSet();

export function recordView(record) {
    const count = (viewCounts.get(record) ?? 0) + 1;

    viewCounts.set(record, count);
    viewedRecords.add(record);
    return count;
}

export function getViews(record) {
    return viewCounts.get(record) ?? 0;
}

export function wasViewed(record) {
    return viewedRecords.has(record);
}