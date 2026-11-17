export const STATUSES = Object.freeze(["To do", "In progress", "Review", "Done"]);
export const PRIORITIES = Object.freeze(["Low", "Medium", "High"]);

function isText(value) {
    return typeof value === "string" && value.trim() !== "";
}

function isIsoDate(value) {
    return typeof value === "string" && value.length === 10 && !Number.isNaN(new Date(value).getTime());
}

export function checkRecord(raw) {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        return "It is not a record.";
    }

    if (!Number.isInteger(raw.id) || raw.id < 1) {
        return "The id must be a whole number above zero.";
    }

    if (!isText(raw.title)) {
        return "The title is required.";
    }

    if (raw.title.trim().length > 100) {
        return "The title is longer than 100 characters.";
    }

    if (!isText(raw.category)) {
        return "The category is required.";
    }

    if (!STATUSES.includes(raw.status)) {
        return `The status must be one of: ${STATUSES.join(", ")}.`;
    }

    if (!isText(raw.assignedTo)) {
        return "The assigned user is required.";
    }

    if (!PRIORITIES.includes(raw.priority)) {
        return `The priority must be one of: ${PRIORITIES.join(", ")}.`;
    }

    if (!isIsoDate(raw.date)) {
        return "The date must look like 2026-03-15.";
    }

    const value = typeof raw.value === "string" && raw.value.trim() !== "" ? Number(raw.value) : raw.value;

    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        return "The value must be a number that is not negative.";
    }

    return "";
}

export function toRecord(raw) {
    return Object.freeze({
        id: raw.id,
        title: raw.title.trim(),
        category: raw.category.trim(),
        status: raw.status,
        assignedTo: raw.assignedTo.trim(),
        priority: raw.priority,
        date: raw.date,
        value: Number(raw.value)
    });
}

export function normalizeRecords(rawList) {
    if (!Array.isArray(rawList)) {
        throw new TypeError("The data must be a list of records.");
    }

    const seenIds = new Set();
    const records = [];
    const problems = [];

    rawList.forEach((raw, index) => {
        const reason = checkRecord(raw);

        if (reason !== "") {
            problems.push({ position: index + 1, reason });
            return;
        }

        if (seenIds.has(raw.id)) {
            problems.push({ position: index + 1, reason: `The id ${raw.id} is used twice.` });
            return;
        }

        seenIds.add(raw.id);
        records.push(toRecord(raw));
    });

    return { records: Object.freeze(records), problems };
}