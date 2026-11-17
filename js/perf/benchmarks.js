export const SIZES = Object.freeze([1000, 5000, 10000]);
export const RUNS = 5;
export const LOOKUPS = 1000;

export function createSyntheticRecords(count) {
    const groups = Math.max(1, Math.floor(count / 2));

    return Array.from({ length: count }, (_, index) => ({ id: index + 1, group: `G${index % groups}` }));
}

export function median(values) {
    const sorted = [...values].sort((first, second) => first - second);
    const middle = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function timeRuns(task) {
    const runs = [];
    let checksum = 0;

    for (let run = 0; run < RUNS; run += 1) {
        const start = performance.now();

        checksum = task();
        runs.push(performance.now() - start);
    }

    return { runs, median: median(runs), checksum };
}

function lookupIds(count) {
    return Array.from({ length: LOOKUPS }, (_, step) => ((step * 7919) % count) + 1);
}

export function benchmarkLookup(count) {
    const records = createSyntheticRecords(count);
    const ids = lookupIds(count);
    const prebuilt = new Map(records.map((record) => [record.id, record]));

    const arrayFind = timeRuns(() => ids.reduce((sum, id) => sum + records.find((record) => record.id === id).id, 0));
    const mapPrebuilt = timeRuns(() => ids.reduce((sum, id) => sum + prebuilt.get(id).id, 0));
    const mapWithBuild = timeRuns(() => {
        const index = new Map(records.map((record) => [record.id, record]));

        return ids.reduce((sum, id) => sum + index.get(id).id, 0);
    });

    return {
        title: "Finding records by id",
        description: `${LOOKUPS} lookups among ${count} records.`,
        approaches: [
            { name: "Array.find for each id", ...arrayFind },
            { name: "Map.get (the Map is already built)", ...mapPrebuilt },
            { name: "Map.get (including the time to build the Map)", ...mapWithBuild }
        ],
        consistent: new Set([arrayFind.checksum, mapPrebuilt.checksum, mapWithBuild.checksum]).size === 1
    };
}

export function benchmarkDuplicates(count) {
    const values = createSyntheticRecords(count).map((record) => record.group);

    const withIndexOf = timeRuns(() => values.filter((value, index) => values.indexOf(value) === index).length);
    const withSet = timeRuns(() => [...new Set(values)].length);

    return {
        title: "Removing repeated values",
        description: `A list of ${count} values where about half of them repeat.`,
        approaches: [
            { name: "filter with indexOf", ...withIndexOf },
            { name: "Set", ...withSet }
        ],
        consistent: withIndexOf.checksum === withSet.checksum
    };
}