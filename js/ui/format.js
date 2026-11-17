import { compose } from "../core/functional.js";

export const formatMoney = compose(
    (text) => `$${text}`,
    (number) => number.toLocaleString("en-US", { maximumFractionDigits: 2 })
);

export function formatDate(isoDate) {
    return new Date(isoDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC"
    });
}

export function pluralize(count, word, plural = `${word}s`) {
    return `${count} ${count === 1 ? word : plural}`;
}