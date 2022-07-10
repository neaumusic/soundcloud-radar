import { injectButtons } from "./inject-buttons";

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeAndInjectButtons);
} else {
    observeAndInjectButtons();
}

function observeAndInjectButtons () {
    const observer = new MutationObserver((mutations, observer) => {
        one: for (let mutation of mutations) {
            two: for (let elem of mutation.addedNodes) {
                injectButtons();
                break one;
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}
