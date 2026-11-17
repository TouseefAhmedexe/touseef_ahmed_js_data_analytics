import { curry } from "../core/functional.js";
import { PRIORITIES, STATUSES } from "./validation.js";

const getTime = (record) => new Date(record.date).getTime();

export const SORTERS = Object.freeze({
    "date-desc": { label: "Date (newest first)", compare: (first, second) => getTime(second) - getTime(first) },
    "date-asc": { label: "Date (oldest first)", compare: (first, second) => getTime(first) - getTime(second) },
    "value-desc": { label: "Value (highest first)", compare: (first, second) => second.value - first.value },
    "value-asc": { label: "Value (lowest first)", compare: (first, second) => first.value - second.value },
    title: { label: "Title (A to Z)", compare: (first, second) => first.title.localeCompare(second.title) },
    priority: {
        label: "Priority (high first)",
        compare: (first, second) => PRIORITIES.indexOf(second.priority) - PRIORITIES.indexOf(first.priority)
    },
    status: {
        label: "Status (to do first)",
        compare: (first, second) => STATUSES.indexOf(first.status) - STATUSES.indexOf(second.status)
    }
});

export function matchesFilters({ query, category, status, priority, user }) {
    const text = query.trim().toLowerCase();

    return (record) => {
        if (category !== "all" && record.category !== category) {
            return false;
        }

        if (status !== "all" && record.status !== status) {
            return false;
        }

        if (priority !== "all" && record.priority !== priority) {
            return false;
        }

        if (user !== "all" && record.assignedTo !== user) {
            return false;
        }

        if (text === "") {
            return true;
        }

        return `${record.id} ${record.title} ${record.category} ${record.assignedTo} ${record.status}`
            .toLowerCase()
            .includes(text);
    };
}

export const filterBy = curry((filters, records) => records.filter(matchesFilters(filters)));

export const sortBy = curry((sortKey, records) => {
    const sorter = SORTERS[sortKey] ?? SORTERS["date-desc"];

    return [...records].sort(sorter.compare);
});

export const pageOf = curry((page, pageSize, records) => {
    const total = records.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(Math.max(page, 1), pageCount);
    const start = (current - 1) * pageSize;

    return {
        items: records.slice(start, start + pageSize),
        page: current,
        pageCount,
        total,
        from: total === 0 ? 0 : start + 1,
        to: Math.min(start + pageSize, total)
    };
});