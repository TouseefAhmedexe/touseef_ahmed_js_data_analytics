# Data Analytics Dashboard

A data processing and analytics application built with advanced JavaScript: Map, Set, WeakMap,
WeakSet, Symbol, iterators, generators, functional programming and memoization.
Task 22 of my Bloomrix internship. No framework is used. All records are sample data made by
a fixed rule, and nothing is saved when the page is reloaded.

## Pages
- index.html - the analytics dashboard
- performance.html - compares an array with a Map and a Set, measured with performance.now()
- order.html - shows the order of synchronous code, Promise callbacks, queueMicrotask and
  setTimeout, recorded while the code runs

## Modules
- data/records-data.js - creates 120 records by a rule, plus 4 deliberately broken entries
- js/core/functional.js - pipe, compose, curry, debounce and memoize
- js/core/symbols.js - the Symbol that marks an edited record
- js/core/iteration.js - RecordCollection (a custom iterable) and the inBatches generator
- js/processing/validation.js - checks each raw record and freezes the valid ones
- js/processing/calculations.js - pure functions: totals, averages, completion, counts, summaries
- js/processing/grouping.js - Map grouping, Set unique values and duplicate removal
- js/processing/immutable.js - updates that return new records and a new array
- js/processing/query.js - curried filter, sort and page functions, and the sort strategies
- js/processing/metadata.js - WeakMap and WeakSet metadata attached to record objects
- js/processing/store.js - the data store: original data, current data, id index, grouped Maps
- js/processing/reports.js - the memoized analysis
- js/ui - DOM helpers, formatting, toasts and render functions (no data rules)
- js/pages - one script for each page
- js/perf, js/order - the benchmark and the scenarios

## Data structures
- Map: an index of the records by id, records grouped by category, status, priority and user,
  the category summary and the counts. A filter by category starts from that group and not