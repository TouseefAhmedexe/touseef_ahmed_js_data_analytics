export const pipe = (...functions) => (input) => functions.reduce((result, step) => step(result), input);

export const compose = (...functions) => pipe(...[...functions].reverse());

export function curry(fn) {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn(...args);
        }

        return (...more) => curried(...args, ...more);
    };
}

export function debounce(callback, delay) {
    let timerId = null;

    return function (...args) {
        window.clearTimeout(timerId);
        timerId = window.setTimeout(() => callback(...args), delay);
    };
}

export function memoize(fn, { makeKey = (...args) => JSON.stringify(args), maxEntries = 50 } = {}) {
    const cache = new Map();
    let hits = 0;
    let misses = 0;

    function memoized(...args) {
        const key = makeKey(...args);

        if (cache.has(key)) {
            hits += 1;
            return cache.get(key);
        }

        misses += 1;

        const result = fn(...args);

        if (cache.size >= maxEntries) {
            cache.delete(cache.keys().next().value);
        }

        cache.set(key, result);
        return result;
    }

    memoized.clear = () => cache.clear();
    memoized.stats = () => ({ hits, misses, size: cache.size });

    return memoized;
}