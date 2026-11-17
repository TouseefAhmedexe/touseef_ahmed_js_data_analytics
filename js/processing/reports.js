import { memoize } from "../core/functional.js";
import { RecordCollection } from "../core/iteration.js";
import {
    averageValue,
    completionPercentage,
    countBy,
    summarizeByCategory,
    totalRecords,
    totalValue
} from "./calculations.js";
import { filterBy } from "./query.js";

export function buildReport(records) {
    const collection = new RecordCollection(records);

    return Object.freeze({
        total: totalRecords(collection),
        totalValue: totalValue(collection),
        averageValue: averageValue(collection),
        completion: completionPercentage(collection),
        byCategory: summarizeByCategory(collection),
        byStatus: countBy(collection, (record) => record.status),
        byPriority: countBy(collection, (record) => record.priority),
        byUser: countBy(collection, (record) => record.assignedTo)
    });
}

export function createQueryService(store) {
    const analyze = memoize(
        (version, filters) => {
            const matches = Object.freeze(filterBy(filters, store.candidates(filters)));

            return Object.freeze({ matches, report: buildReport(matches) });
        },
        {
            makeKey: (version, filters) => JSON.stringify([version, filters.query, filters.category, filters.status, filters.priority, filters.user]),
            maxEntries: 40
        }
    );

    store.subscribe(() => analyze.clear());

    return {
        analyze: (filters) => analyze(store.version, filters),
        stats: () => analyze.stats()
    };
}