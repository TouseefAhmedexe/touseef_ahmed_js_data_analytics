import { SCENARIOS } from "../order/scenarios.js";
import { fillPairs, makeElement, requireElement } from "../ui/dom.js";

const el = {
    form: requireElement("order-form"),
    select: requireElement("scenario-select"),
    run: requireElement("run-scenario"),
    description: requireElement("scenario-description"),
    code: requireElement("scenario-code"),
    expected: requireElement("expected-list"),
    actual: requireElement("actual-list"),
    actualEmpty: requireElement("actual-empty"),
    verdict: requireElement("verdict")
};

function showScenario(key) {
    const scenario = SCENARIOS[key];

    el.description.textContent = scenario.description;
    el.code.textContent = scenario.run.toString();
    el.expected.textContent = "";
    scenario.expected.forEach((line) => el.expected.append(makeElement("li", "", line)));
    el.actual.textContent = "";
    el.actualEmpty.hidden = false;
    el.verdict.textContent = "";
}

function record(scenario) {
    return new Promise((resolve) => {
        const actual = [];

        scenario.run((message) => actual.push(message));
        window.setTimeout(() => resolve(actual), 0);
    });
}

function showActual(scenario, actual) {
    const same = actual.length === scenario.expected.length
        && actual.every((line, index) => line === scenario.expected[index]);

    el.actual.textContent = "";
    actual.forEach((line, index) => {
        const matches = line === scenario.expected[index];
        const text = matches ? line : `${line} (expected here: ${scenario.expected[index] ?? "nothing"})`;

        el.actual.append(makeElement("li", matches ? "is-match" : "is-different", text));
    });
    el.actualEmpty.hidden = true;
    el.verdict.textContent = same
        ? "The recorded order matches the expected order."
        : "The recorded order is different from the expected order. Compare the two lists.";
}

async function runScenario() {
    const scenario = SCENARIOS[el.select.value];

    el.run.disabled = true;
    el.verdict.textContent = "Running...";

    try {
        showActual(scenario, await record(scenario));
    } finally {
        el.run.disabled = false;
    }
}

fillPairs(el.select, Object.entries(SCENARIOS).map(([key, scenario]) => [key, scenario.title]));
el.select.addEventListener("change", () => showScenario(el.select.value));
el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    runScenario();
});
showScenario(el.select.value);