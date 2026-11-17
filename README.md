# Data Analytics Dashboard

A data processing and analytics application built with advanced JavaScript: Map, Set, WeakMap,
WeakSet, Symbol, iterators, generators, functional programming and memoization.
Task 22 of my Bloomrix internship. No framework is used. All records are sample data made by a
fixed rule, and nothing is saved when the page is reloaded.

## Pages
- index.html - the analytics dashboard
- performance.html - compares arrays with a Map and a Set, measured with performance.now()
- order.html - shows the order of synchronous code, Promise callbacks, queueMicrotask and
  setTimeout. The order is recorded while the code runs.

## Modules
- data/records-data.js - creates 120 records by a fixed rule, plus 4 deliberately broken entries
- js/core/functional.js - pipe, compose, curry, debounce and memoize
- js/core/symbols.js - the Symbol that marks an edited record
- js/core/iteration.js - RecordCollection (a custom iterable) and the inBatches generator
- js/processing/validation.js - checks each raw record and freezes the valid ones
- js/processing/calculations.js - pure functions: totals, averages, completion, counts, summaries
- js/processing/grouping.js - Map grouping, Set unique values and duplicate removal
- js/processing/immutable.js - updates that return a new record and a new array
- js/processing/query.js - curried filter, sort and page functions, and the sort strategies
- js/processing/metadata.js - WeakMap and WeakSet metadata attached to record objects
- js/processing/store.js - the data store: original data, current data, id index, grouped Maps
- js/processing/reports.js - the memoized analysis service
- js/ui - DOM helpers, formatting, toasts and render functions. They contain no data rules.
- js/pages - one script for each page
- js/perf and js/order - the benchmark and the execution order scenarios

## Data structures
- Map: an index of the records by id, the records grouped by category, status, priority and
  user, the category summary, and the counts. A filter by category or user starts from that
  group, not from all the records. When several of these filters are used together, the
  shortest group is used. The text search still scans the remaining records, because a
  substring search cannot use a Map.
- Set: the unique categories and users for the filters, the ids already seen while the data is
  checked (a repeated id is rejected), and the values already seen while duplicates are
  removed. Duplicate removal keeps the first record for each value of the chosen property.
- WeakMap and WeakSet: the number of times a record was opened, and a "viewed" mark. They are
  attached to the record object and never written into it, so the frozen data stays clean. The
  keys are held weakly, so metadata cannot keep a discarded record in memory. They cannot be
  iterated and have no size. An edited record is a new object, so it starts with no views.
- Symbol: EDITED is a Symbol property added to edited records. It cannot clash with a data
  field, and it stays out of Object.keys, for...in and JSON.stringify.

## Iterator and generator
- RecordCollection has a Symbol.iterator method that returns an iterator object with next().
  Every call creates its own position, so two loops do not interfere. The calculation
  functions use for...of or spread, so they accept arrays and RecordCollection.
- inBatches is a generator (function*). It yields the records in groups, and pauses at each
  yield. The Batch processing panel asks the same generator for one more batch on each click.

## Functional programming
- Pure functions: totalRecords, totalValue, averageValue, completionPercentage, countBy and
  summarizeByCategory read only their arguments and change nothing.
- Currying and composition: filterBy, sortBy and pageOf are curried. pipe joins them into one
  operation: pipe(sortBy(key), pageOf(page, size)). formatMoney uses compose.
- Memoization: the analysis of a set of filters is cached. The data version is part of the cache
  key, and the cache is also cleared when the data changes. Sorting and changing page reuse
  the cached analysis. The page shows the hits and misses.
- Immutability: records are frozen. withUpdatedRecord returns a new record and a new array that
  shares all the other records. The original data is kept and never changes, and Reset
  restores it.

## Execution order
Each scenario runs real code and records the order in which its lines run. The expected order
is written from the rules: synchronous code first, then all microtasks (Promise callbacks and
queueMicrotask), then one timer callback at a time, with the microtasks emptied after each.

## Performance comparison
Two operations are timed with performance.now(): finding 1,000 records by id (Array.find
against Map.get, with and without the time to build the Map) and removing repeated values
(filter with indexOf against a Set). Each approach runs 5 times and the median is shown.
Limits: the numbers change from run to run and from computer to computer. Browsers can round
the timer, so very fast operations show as "< 0.01". The records are simple synthetic
objects, only two operations are measured, and a Map costs time to build. With a few records
the difference does not matter.

## Handling bad data
Each raw entry is checked before use. An entry that is not a record, or has a missing title, an
unknown status or priority, a bad date, a negative or non-numeric value, or a repeated id, is
skipped and listed on the page with its reason. A dataset that is not a list shows an error. An
empty dataset shows empty states and zeros.

## Limits
- The dataset has only 120 records, so most operations are fast either way.
- Changes are kept in memory only, and reloading the page restores the original data.
- The WeakMap and WeakSet effect on memory cannot be seen directly, because garbage collection
  runs when the engine decides.

## Tested
Phone 375px, tablet 768px and desktop 1280px, in light and dark mode, with the keyboard only.

## How to run
Open the folder in Visual Studio Code and use Live Server. Modules do not work when an HTML
file is opened by double-clicking it.