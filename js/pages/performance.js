import { RUNS, SIZES, benchmarkDuplicates, benchmarkLookup } from "../perf/benchmarks.js";
import { fillPairs, makeElement, requireElement } from "../ui/dom.js";

const el = {
    form: requireElement("perf-form"),
    size: requireElement("size-select"),
    run: requireElement("run-button"),
    status: requireElement("perf-status"),
    empty: requireElement("results-empty"),
    lookup: requireElement("lookup-result"),
    duplicate: requireElement("duplicate-result")
};

const nextPaint = () => new Promise((resolve) => window.requestAnimationFrame(() => window.setTimeout(resolve, 0)));

const formatMs = (value) => (value < 0.01 ? "< 0.01" : value.toFixed(2));

function buildConclusion(result) {
    const medians = result.approaches.map((approach) => approach.median);
    const fastest = Math.min(...medians);
    const slowest = Math.max(...medians);

    if (!result.consistent) {
        return "The approaches gave different answers, so this comparison is not valid.";
    }

    if (fastest < 0.01) {
        return "The fastest approach ran too fast to measure reliably at this size, so the ratio is not shown.";
    }

    return `The slowest approach took about ${(slowest / fastest).toFixed(1)} times as long as the fastest one (comparing medians).`;
}

function renderResult(container, result) {
    const fastest = Math.min(...result.approaches.map((approach) => approach.median));
    const table = makeElement("table", "data-table");
    const body = makeElement("tbody");
    const head = makeElement("tr");
    const wrap = makeElement("div", "table-wrap");

    container.textContent = "";
    ["Approach", `Median of ${RUNS} runs (ms)`, "Every run (ms)", "Compared with the fastest"].forEach((label) => {
        const cell = makeElement("th", "", label);

        cell.scope = "col";
        head.append(cell);
    });

    result.approaches.forEach((approach) => {
        const row = makeElement("tr");
        const ratio = fastest < 0.01 ? "not shown" : `${(approach.median / fastest).toFixed(1)}x`;

        row.append(
            makeElement("td", "", approach.name),
            makeElement("td", "num", formatMs(approach.median)),
            makeElement("td", "", approach.runs.map(formatMs).join(", ")),
            makeElement("td", "", ratio)
        );
        body.append(row);
    });

    table.append(makeElement("caption", "visually-hidden", result.title), makeElement("thead"), body);
    table.tHead.append(head);
    wrap.append(table);
    container.append(makeElement("h3", "", result.title), makeElement("p", "", result.description), wrap, makeElement("p", "hint", buildConclusion(result)));
}

async function runComparison() {
    const count = Number(el.size.value);

    el.run.disabled = true;

    try {
        el.status.textContent = `Running the lookup comparison for ${count} records. The page may pause for a moment...`;
        await nextPaint();
        renderResult(el.lookup, benchmarkLookup(count));
        el.empty.hidden = true;

        el.status.textContent = "Running the duplicate-removal comparison...";
        await nextPaint();
        renderResult(el.duplicate, benchmarkDuplicates(count));

        el.status.textContent = "Done. Run it again: the numbers change from run to run.";
    } catch (error) {
        el.status.textContent = `The comparison could not finish: ${error.message}`;
    } finally {
        el.run.disabled = false;
        el.run.focus();
    }
}

fillPairs(el.size, SIZES.map((size) => [String(size), size.toLocaleString("en-US")]));
el.size.value = String(SIZES[1]);
el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    runComparison();
});