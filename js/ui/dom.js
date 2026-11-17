export function requireElement(id) {
    const element = document.getElementById(id);

    if (element === null) {
        throw new Error(`The element #${id} is missing from the page.`);
    }

    return element;
}

export function makeElement(tag, className = "", text = "") {
    const element = document.createElement(tag);

    element.className = className;
    element.textContent = text;
    return element;
}

export function makeButton(label, action, className = "btn btn--small", data = {}) {
    const button = makeElement("button", className, label);

    button.type = "button";
    button.dataset.action = action;
    Object.entries(data).forEach(([key, value]) => {
        button.dataset[key] = String(value);
    });
    return button;
}

export function fillPairs(select, pairs) {
    select.textContent = "";
    pairs.forEach(([value, label]) => {
        const option = document.createElement("option");

        option.value = value;
        option.textContent = label;
        select.append(option);
    });
}

export function fillOptions(select, allLabel, values) {
    const current = select.value;

    fillPairs(select, [["all", allLabel], ...values.map((value) => [value, value])]);
    select.value = values.includes(current) ? current : "all";
}