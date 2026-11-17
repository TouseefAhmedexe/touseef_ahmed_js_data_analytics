import { makeButton, makeElement } from "./dom.js";
import { formatDate, formatMoney, pluralize } from "./format.js";

const STATUS_KINDS = Object.freeze({ "To do": "todo", "In progress": "progress", Review: "review", Done: "done" });
const PRIORITY_KINDS = Object.freeze({ Low: "low", Medium: "medium", High: "high" });

function makeBadge(text, kind) {
    return makeElement("span", `badge badge--${kind}`, text);
}

export function renderDataNotice(parts, loadedCount, receivedCount, problems) {
    const skipped = problems.length;
    const verb = skipped === 1 ? "was" : "were";
    const skippedText = skipped === 0
        ? ""
        : ` ${pluralize(skipped, "entry", "entries")} could not be used and ${verb} skipped.`;

    parts.summary.textContent = `Loaded ${pluralize(loadedCount, "record")} from ${pluralize(receivedCount, "raw entry", "raw entries")}.${skippedText}`;
    parts.details.hidden = skipped === 0;
    parts.detailsSummary.textContent = `Show the skipped entries (${skipped})`;
    parts.list.textContent = "";
    problems.forEach(({ position, reason }) => {
        parts.list.append(makeElement("li", "", `Entry ${position}: ${reason}`));
    });
}

export function renderSummary(container, report) {
    const items = [
        { label: "Records", value: String(report.total) },
        { label: "Total value", value: formatMoney(report.totalValue) },
        { label: "Average value", value: formatMoney(report.averageValue) },
        { label: "Completed", value: `${report.completion}%` }
    ];

    container.textContent = "";
    items.forEach(({ label, value }) => {
        const card = makeElement("div", "stat");

        card.append(makeElement("span", "stat__value", value), makeElement("span", "stat__label", label));
        container.append(card);
    });
}

export function renderCategoryStats(body, byCategory) {
    body.textContent = "";

    if (byCategory.size === 0) {
        const row = makeElement("tr");
        const cell = makeElement("td", "hint", "No records to summarize.");

        cell.colSpan = 4;
        row.append(cell);
        body.append(row);
        return;
    }

    byCategory.forEach((summary, category) => {
        const row = makeElement("tr");

        row.append(
            makeElement("td", "", category),
            makeElement("td", "num", String(summary.count)),
            makeElement("td", "num", formatMoney(summary.totalValue)),
            makeElement("td", "num", formatMoney(summary.averageValue))
        );
        body.append(row);
    });
}

export function renderDistribution(list, entries, total) {
    list.textContent = "";

    if (entries.length === 0) {
        list.append(makeElement("li", "hint", "No data."));
        return;
    }

    entries.forEach(([label, count]) => {
        const item = makeElement("li", "bar-list__item");
        const bar = makeElement("progress");
        const percent = total === 0 ? 0 : Math.round((count / total) * 100);

        bar.max = Math.max(total, 1);
        bar.value = count;
        bar.textContent = `${percent}%`;
        bar.setAttribute("aria-label", `${label}: ${count} of ${total}`);
        item.append(makeElement("span", "bar-list__label", label), bar, makeElement("span", "bar-list__count", `${count} (${percent}%)`));
        list.append(item);
    });
}

function buildRow(record, marks) {
    const row = makeElement("tr");
    const title = makeElement("td", "", record.title);
    const priority = makeElement("td");
    const status = makeElement("td");
    const actions = makeElement("td");
    const detailsButton = makeButton("Details", "details", "btn btn--small btn--secondary", { id: record.id });
    const statusButton = record.status === "Done"
        ? makeButton("Reopen", "reopen", "btn btn--small btn--secondary", { id: record.id })
        : makeButton("Mark done", "done", "btn btn--small btn--success", { id: record.id });

    if (marks.edited(record)) {
        title.append(" ", makeBadge("Edited", "edited"));
    }

    if (marks.viewed(record)) {
        title.append(" ", makeBadge("Viewed", "viewed"));
    }

    priority.append(makeBadge(record.priority, PRIORITY_KINDS[record.priority]));
    status.append(makeBadge(record.status, STATUS_KINDS[record.status]));

    detailsButton.setAttribute("aria-label", `Details of ${record.title}, ID ${record.id}`);
    statusButton.setAttribute("aria-label", `${record.status === "Done" ? "Reopen" : "Mark done"}: ${record.title}, ID ${record.id}`);
    actions.append(detailsButton, " ", statusButton);

    row.append(
        makeElement("td", "num", String(record.id)),
        title,
        makeElement("td", "", record.category),
        makeElement("td", "", record.assignedTo),
        priority,
        status,
        makeElement("td", "", formatDate(record.date)),
        makeElement("td", "num", formatMoney(record.value)),
        actions
    );
    return row;
}

export function renderTable(body, records, marks) {
    body.textContent = "";
    body.append(...records.map((record) => buildRow(record, marks)));
}

function visiblePages(current, count) {
    const pages = [];

    for (let number = 1; number <= count; number += 1) {
        if (number === 1 || number === count || Math.abs(number - current) <= 2) {
            pages.push(number);
        } else if (pages[pages.length - 1] !== "...") {
            pages.push("...");
        }
    }

    return pages;
}

function buildPageItem(label, page, { disabled = false, current = false, name = label } = {}) {
    const item = makeElement("li");
    const button = makeButton(label, "page", "pagination__button", { page });

    button.disabled = disabled;
    button.setAttribute("aria-label", name);

    if (current) {
        button.setAttribute("aria-current", "page");
    }

    item.append(button);
    return item;
}

export function renderPagination(nav, list, view) {
    list.textContent = "";
    nav.hidden = view.pageCount <= 1;

    if (view.pageCount <= 1) {
        return;
    }

    list.append(buildPageItem("Previous", view.page - 1, { disabled: view.page === 1, name: "Previous page" }));

    visiblePages(view.page, view.pageCount).forEach((entry) => {
        if (entry === "...") {
            list.append(makeElement("li", "pagination__gap", "..."));
            return;
        }

        list.append(buildPageItem(String(entry), entry, { current: entry === view.page, name: `Page ${entry}` }));
    });

    list.append(buildPageItem("Next", view.page + 1, { disabled: view.page === view.pageCount, name: "Next page" }));
}

export function renderDetails(container, record, info) {
    container.textContent = "";

    if (record === undefined) {
        container.append(makeElement("p", "hint", "Choose a record from the table to see its details."));
        return;
    }

    const facts = [
        ["ID", String(record.id)],
        ["Category", record.category],
        ["Assigned to", record.assignedTo],
        ["Priority", record.priority],
        ["Status", record.status],
        ["Date", formatDate(record.date)],
        ["Value", formatMoney(record.value)]
    ];
    const list = makeElement("dl", "fact-list");
    const about = makeElement("ul", "plain-list");
    const lines = [
        `Times this exact record object was opened: ${info.views} (kept in a WeakMap).`,
        `Edited in this session: ${info.edited ? "yes" : "no"} (kept under a Symbol property).`,
        `Visible properties: ${info.keys.join(", ")}.`,
        `Hidden symbol properties: ${info.symbols}.`
    ];

    facts.forEach(([label, value]) => list.append(makeElement("dt", "", label), makeElement("dd", "", value)));
    lines.forEach((line) => about.append(makeElement("li", "", line)));
    container.append(makeElement("h3", "", record.title), list, makeElement("h4", "details__heading", "About this object"), about);
}

export function renderDataFacts(list, facts) {
    list.textContent = "";
    facts.forEach(([label, value]) => list.append(makeElement("dt", "", label), makeElement("dd", "", value)));
}

export function renderBatches(body, rows) {
    body.textContent = "";
    rows.forEach((row) => {
        const tr = makeElement("tr");

        tr.append(
            makeElement("td", "num", String(row.number)),
            makeElement("td", "", `${row.from}-${row.to}`),
            makeElement("td", "num", String(row.count)),
            makeElement("td", "num", formatMoney(row.totalValue)),
            makeElement("td", "num", String(row.done))
        );
        body.append(tr);
    });
}