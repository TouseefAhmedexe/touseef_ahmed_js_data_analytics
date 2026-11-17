import { rawRecords } from "../../data/records-data.js";
import { debounce, pipe } from "../core/functional.js";
import { RecordCollection } from "../core/iteration.js";
import { isEdited } from "../core/symbols.js";
import { completionPercentage, summarizeBatch, totalRecords } from "../processing/calculations.js";
import { DEDUPE_OPTIONS } from "../processing/grouping.js";
import { getViews, recordView, wasViewed } from "../processing/metadata.js";
import { SORTERS, pageOf, sortBy } from "../processing/query.js";
import { createQueryService } from "../processing/reports.js";
import { DataStore } from "../processing/store.js";
import { PRIORITIES, STATUSES, normalizeRecords } from "../processing/validation.js";
import { fillOptions, fillPairs, requireElement } from "../ui/dom.js";
import { pluralize } from "../ui/format.js";
import {
    renderBatches,
    renderCategoryStats,
    renderDataFacts,
    renderDataNotice,
    renderDetails,
    renderDistribution,
    renderPagination,
    renderSummary,
    renderTable
} from "../ui/render.js";
import { showToast } from "../ui/toast.js";

const PAGE_SIZE = 10;
const BATCH_SIZE = 10;
const SEARCH_DELAY_MS = 300;
const DEFAULT_FILTERS = Object.freeze({ query: "", category: "all", status: "all", priority: "all", user: "all" });

const el = {
    error: requireElement("app-error"),
    dataSummary: requireElement("data-summary"),
    problemDetails: requireElement("problem-details"),
    problemSummary: requireElement("problem-summary"),
    problemList: requireElement("problem-list"),
    summaryNote: requireElement("summary-note"),
    summaryGrid: requireElement("summary-grid"),
    filterForm: requireElement("filter-form"),
    search: requireElement("search-input"),
    category: requireElement("category-select"),
    status: requireElement("status-select"),
    priority: requireElement("priority-select"),
    user: requireElement("user-select"),
    sort: requireElement("sort-select"),
    clear: requireElement("clear-filters"),
    categoryBody: requireElement("category-body"),
    statusList: requireElement("status-list"),
    priorityList: requireElement("priority-list"),
    userList: requireElement("user-list"),
    recordsTitle: requireElement("records-title"),
    resultCount: requireElement("result-count"),
    emptyState: requireElement("empty-state"),
    emptyText: requireElement("empty-text"),
    emptyClear: requireElement("empty-clear"),
    tableWrap: requireElement("table-wrap"),
    recordBody: requireElement("record-body"),
    paginationNav: requireElement("pagination-nav"),
    pagination: requireElement("pagination"),
    detailsTitle: requireElement("details-title"),
    detailsContent: requireElement("details-content"),
    dedupeForm: requireElement("dedupe-form"),
    dedupeProperty: requireElement("dedupe-property"),
    resetData: requireElement("reset-data"),
    dataFacts: requireElement("data-facts"),
    nextBatch: requireElement("next-batch"),
    restartBatches: requireElement("restart-batches"),
    batchStatus: requireElement("batch-status"),
    batchBody: requireElement("batch-body")
};

let store = null;
let queries = null;
let filters = { ...DEFAULT_FILTERS };
let sortKey = "date-desc";
let page = 1;
let selectedId = null;
let batchRun = null;

const hasActiveFilters = () => Object.keys(DEFAULT_FILTERS).some((key) => filters[key] !== DEFAULT_FILTERS[key]);

function showFatalError(message) {
    el.error.textContent = message;
    el.error.hidden = false;
}

function fillFilterOptions() {
    fillOptions(el.category, "All categories", store.values("category"));
    fillOptions(el.status, "All statuses", STATUSES);
    fillOptions(el.priority, "All priorities", PRIORITIES);
    fillOptions(el.user, "All users", store.values("user"));
}

function describeScope(total) {
    if (store.size === 0) {
        return "The dataset has no records.";
    }

    if (!hasActiveFilters()) {
        return `Summary of all ${pluralize(total, "record")}.`;
    }

    return `Summary of the ${pluralize(total, "record")} that match your filters, out of ${store.size}.`;
}

function renderStatistics(report) {
    const total = report.total;
    const users = [...report.byUser].sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]));

    el.summaryNote.textContent = describeScope(total);
    renderSummary(el.summaryGrid, report);
    renderCategoryStats(el.categoryBody, report.byCategory);
    renderDistribution(el.statusList, STATUSES.map((status) => [status, report.byStatus.get(status) ?? 0]), total);
    renderDistribution(el.priorityList, PRIORITIES.map((priority) => [priority, report.byPriority.get(priority) ?? 0]), total);
    renderDistribution(el.userList, users, total);
}

function render() {
    const analysis = queries.analyze(filters);
    const view = pipe(sortBy(sortKey), pageOf(page, PAGE_SIZE))(analysis.matches);

    page = view.page;
    renderStatistics(analysis.report);
    renderRecords(view);
    renderDetailsPanel();
    renderFacts();
}

function start() {
    let parsed = null;

    try {
        parsed = normalizeRecords(rawRecords);
    } catch (error) {
        showFatalError(`The data could not be used: ${error.message}`);
        return;
    }

    store = new DataStore(parsed.records);
    queries = createQueryService(store);
    store.subscribe(handleStoreChange);

    renderDataNotice(
        { summary: el.dataSummary, details: el.problemDetails, detailsSummary: el.problemSummary, list: el.problemList },
        parsed.records.length,
        rawRecords.length,
        parsed.problems
    );
    fillPairs(el.sort, Object.entries(SORTERS).map(([value, sorter]) => [value, sorter.label]));
    fillPairs(el.dedupeProperty, DEDUPE_OPTIONS.map(({ value, label }) => [value, label]));
    el.sort.value = sortKey;
    fillFilterOptions();
    bindFilterEvents();
    bindTableEvents();
    bindToolEvents();
    bindBatchEvents();
    startBatchRun();
    render();
    renderBatchPanel();
}

function readFilters() {
    return {
        query: el.search.value.trim(),
        category: el.category.value,
        status: el.status.value,
        priority: el.priority.value,
        user: el.user.value
    };
}

function renderRecords(view) {
    const hasRows = view.total > 0;

    el.tableWrap.hidden = !hasRows;
    el.emptyState.hidden = hasRows;
    el.resultCount.textContent = hasRows ? `Showing ${view.from}-${view.to} of ${pluralize(view.total, "record")}.` : "";
    el.emptyText.textContent = store.size === 0 ? "The dataset has no records." : "No records match your filters.";
    el.emptyClear.hidden = store.size === 0;
    renderTable(el.recordBody, view.items, { viewed: wasViewed, edited: isEdited });
    renderPagination(el.paginationNav, el.pagination, view);
}

function handleFilterChange() {
    filters = readFilters();
    page = 1;
    render();
}

function handleSortChange() {
    sortKey = el.sort.value;
    page = 1;
    render();
}

function handleClear() {
    el.search.value = "";
    el.category.value = "all";
    el.status.value = "all";
    el.priority.value = "all";
    el.user.value = "all";
    filters = readFilters();
    page = 1;
    render();
    el.search.focus();
}

function handlePaginationClick(event) {
    const button = event.target.closest("[data-page]");

    if (button === null || button.disabled) {
        return;
    }

    page = Number(button.dataset.page);
    render();

    const current = el.pagination.querySelector('[aria-current="page"]');

    if (current !== null) {
        current.focus();
    }
}

function bindFilterEvents() {
    el.filterForm.addEventListener("submit", (event) => event.preventDefault());
    el.search.addEventListener("input", debounce(handleFilterChange, SEARCH_DELAY_MS));
    [el.category, el.status, el.priority, el.user].forEach((select) => {
        select.addEventListener("change", handleFilterChange);
    });
    el.sort.addEventListener("change", handleSortChange);
    el.clear.addEventListener("click", handleClear);
    el.emptyClear.addEventListener("click", handleClear);
    el.pagination.addEventListener("click", handlePaginationClick);
}
function renderDetailsPanel() {
    const record = selectedId === null ? undefined : store.getById(selectedId);

    if (record === undefined) {
        selectedId = null;
        renderDetails(el.detailsContent, undefined, null);
        return;
    }

    renderDetails(el.detailsContent, record, {
        views: getViews(record),
        edited: isEdited(record),
        keys: Object.keys(record),
        symbols: Object.getOwnPropertySymbols(record).length
    });
}

function changeStatus(record, status) {
    try {
        store.update(record.id, { status });
    } catch (error) {
        showToast(error.message, "error");
        return;
    }

    const nextAction = status === "Done" ? "reopen" : "done";
    const next = el.recordBody.querySelector(`[data-id="${record.id}"][data-action="${nextAction}"]`);

    showToast(`"${record.title}" (ID ${record.id}) is now ${status}.`, "success");
    (next ?? el.recordsTitle).focus();
}

function handleTableClick(event) {
    const button = event.target.closest("[data-action]");

    if (button === null) {
        return;
    }

    const id = Number(button.dataset.id);
    const record = store.getById(id);

    if (record === undefined) {
        showToast("That record could not be found.", "error");
        return;
    }

    switch (button.dataset.action) {
        case "details":
            selectedId = id;
            recordView(record);
            render();
            el.detailsTitle.focus();
            break;
        case "done":
            changeStatus(record, "Done");
            break;
        case "reopen":
            changeStatus(record, "In progress");
            break;
        default:
            break;
    }
}

function handleStoreChange() {
    fillFilterOptions();
    filters = readFilters();
    startBatchRun();
    renderBatchPanel();
    render();
}

function bindTableEvents() {
    el.recordBody.addEventListener("click", handleTableClick);
}
function renderFacts() {
    const current = store.records;
    const original = store.original;
    const stats = queries.stats();

    renderDataFacts(el.dataFacts, [
        ["Current data", `${pluralize(totalRecords(current), "record")}, ${completionPercentage(current)}% done`],
        ["Original data (never changed)", `${pluralize(original.length, "record")}, ${completionPercentage(original)}% done`],
        ["Data version", String(store.version)],
        ["Analysis cache", `${pluralize(stats.size, "entry", "entries")}, ${pluralize(stats.hits, "hit")}, ${pluralize(stats.misses, "miss", "misses")}`]
    ]);
}

function handleDedupe(event) {
    event.preventDefault();

    const property = el.dedupeProperty.value;
    const option = DEDUPE_OPTIONS.find((item) => item.value === property);

    try {
        const removed = store.dedupe(property);
        const label = option.label.toLowerCase();

        showToast(
            removed === 0
                ? `No duplicate ${label} values were found.`
                : `Removed ${pluralize(removed, "record")} with a repeated ${label}. The first record for each ${label} was kept.`,
            removed === 0 ? "info" : "success"
        );
    } catch (error) {
        showToast(error.message, "error");
    }
}

function handleReset() {
    const changed = store.reset();

    showToast(changed ? "Restored the original data." : "The data is already the original data.", changed ? "success" : "info");
}

function bindToolEvents() {
    el.dedupeForm.addEventListener("submit", handleDedupe);
    el.resetData.addEventListener("click", handleReset);
}
function startBatchRun() {
    batchRun = {
        generator: new RecordCollection(store.records).batches(BATCH_SIZE),
        processed: 0,
        rows: [],
        finished: store.size === 0
    };
}

function renderBatchPanel() {
    const total = store.size;
    const batchCount = pluralize(batchRun.rows.length, "batch", "batches");

    renderBatches(el.batchBody, batchRun.rows);
    el.nextBatch.disabled = batchRun.finished;

    if (total === 0) {
        el.batchStatus.textContent = "There are no records to process.";
    } else if (batchRun.finished) {
        el.batchStatus.textContent = `All ${pluralize(total, "record")} were processed in ${batchCount}.`;
    } else if (batchRun.rows.length === 0) {
        el.batchStatus.textContent = `Ready: ${pluralize(total, "record")} will be handed out ${BATCH_SIZE} at a time.`;
    } else {
        el.batchStatus.textContent = `Processed ${batchRun.processed} of ${total} records in ${batchCount}.`;
    }
}

function processNextBatch() {
    const step = batchRun.generator.next();

    if (step.done) {
        batchRun.finished = true;
    } else {
        const summary = summarizeBatch(step.value);
        const from = batchRun.processed + 1;

        batchRun.processed += summary.count;
        batchRun.rows.push({ number: batchRun.rows.length + 1, from, to: batchRun.processed, ...summary });
        batchRun.finished = batchRun.processed >= store.size;
    }

    renderBatchPanel();
}

function handleRestartBatches() {
    startBatchRun();
    renderBatchPanel();
}

function bindBatchEvents() {
    el.nextBatch.addEventListener("click", processNextBatch);
    el.restartBatches.addEventListener("click", handleRestartBatches);
}
start();