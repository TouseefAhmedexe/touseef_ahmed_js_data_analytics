export const SCENARIOS = Object.freeze({
    basic: {
        title: "Synchronous code, Promise callback, queueMicrotask and setTimeout",
        description: "Synchronous code always finishes first. Then the microtask queue is emptied: Promise callbacks and queueMicrotask callbacks run in the order they were queued. A timer callback is a macrotask, so it runs later, even with a delay of 0.",
        expected: [
            "1. synchronous: start",
            "2. synchronous: end",
            "3. Promise.then callback",
            "4. queueMicrotask callback",
            "5. setTimeout callback"
        ],
        run(log) {
            log("1. synchronous: start");
            setTimeout(() => log("5. setTimeout callback"), 0);
            Promise.resolve().then(() => log("3. Promise.then callback"));
            queueMicrotask(() => log("4. queueMicrotask callback"));
            log("2. synchronous: end");
        }
    },
    timers: {
        title: "A Promise chain and three timers",
        description: "All microtasks of a Promise chain run before the next timer. After each timer callback the microtask queue is emptied again, so a microtask created inside a timer runs before the next timer.",
        expected: [
            "1. synchronous: start",
            "2. synchronous: end",
            "3. Promise then 1",
            "4. Promise then 2 (chained)",
            "5. setTimeout 1",
            "6. setTimeout 2",
            "7. microtask created inside setTimeout 2",
            "8. setTimeout 3"
        ],
        run(log) {
            log("1. synchronous: start");
            setTimeout(() => log("5. setTimeout 1"), 0);
            setTimeout(() => {
                log("6. setTimeout 2");
                Promise.resolve().then(() => log("7. microtask created inside setTimeout 2"));
            }, 0);
            setTimeout(() => log("8. setTimeout 3"), 0);
            Promise.resolve()
                .then(() => log("3. Promise then 1"))
                .then(() => log("4. Promise then 2 (chained)"));
            log("2. synchronous: end");
        }
    },
    awaiting: {
        title: "async functions and await",
        description: "Code before the first await runs synchronously. The rest of an async function runs later, as a microtask. Here the continuation of first() was queued before the Promise.then callback, so it runs first.",
        expected: [
            "1. synchronous: start",
            "2. first(): before await",
            "3. second(): runs synchronously",
            "4. synchronous: end",
            "5. first(): after await",
            "6. Promise.then callback queued after the await"
        ],
        run(log) {
            async function second() {
                log("3. second(): runs synchronously");
            }

            async function first() {
                log("2. first(): before await");
                await second();
                log("5. first(): after await");
            }

            log("1. synchronous: start");
            first();
            Promise.resolve().then(() => log("6. Promise.then callback queued after the await"));
            log("4. synchronous: end");
        }
    }
});