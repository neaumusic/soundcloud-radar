import { injectButtonsAndObserve } from "./inject-buttons";

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectButtonsAndObserve);
} else {
    injectButtonsAndObserve();
}
