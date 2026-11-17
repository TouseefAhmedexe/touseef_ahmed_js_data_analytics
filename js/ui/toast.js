import { makeElement, requireElement } from "./dom.js";

const TOAST_MS = 4000;
const MAX_TOASTS = 3;

export function showToast(message, kind = "info") {
    const area = requireElement("toast-area");
    const toast = makeElement("p", `toast toast--${kind}`, message);

    area.append(toast);

    if (area.children.length > MAX_TOASTS) {
        area.firstElementChild.remove();
    }

    window.setTimeout(() => toast.remove(), TOAST_MS);
}