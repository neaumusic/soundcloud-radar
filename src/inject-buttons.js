import { aggregateRepostersByTrackUrl } from "./aggregate";

export async function injectButtonsAndObserve () {
    // injectButtons();
    observe();
}

function observe () {
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

function injectButtons () {
    const toolbarData = getToolbarData();

    toolbarData.forEach(({ toolbar, trackUrl }) => {
        const favoriteButton = toolbar.querySelector(".sc-button-like");
        if (!favoriteButton) return;

        const aggregateButton = favoriteButton.cloneNode(false);
              aggregateButton.classList.remove("sc-button-like");
              aggregateButton.classList.remove("sc-button-selected");
              aggregateButton.classList.add("aggregate-button")
              aggregateButton.innerText = "Aggregate";
              aggregateButton.title = "Aggregate";
              aggregateButton.addEventListener("click", async () => {
                  aggregateButton.classList.add("sc-button-selected");
                  await aggregateRepostersByTrackUrl(trackUrl);
                  aggregateButton.classList.remove("sc-button-selected");
              });

        favoriteButton.parentNode.appendChild(aggregateButton);
    });
}

function getToolbarData () {
    return Array.from(document.querySelectorAll(".soundActions"))
        .filter(toolbar => toolbar.querySelector(".aggregate-button") === null)
        .reduce((toolbars, toolbar) => {
            // search
            const searchItem = toolbar.closest(".searchItem");
            if (searchItem) {
                const trackLink = searchItem.querySelector(".track a.soundTitle__title");
                if (!trackLink) return toolbars;
                const trackUrl = trackLink.href;
                if (!trackUrl) return toolbars;

                toolbars.push({ toolbar, trackUrl });
                return toolbars;
            }

            // stream
            const soundListItem = toolbar.closest(".soundList__item");
            if (soundListItem) {
                const trackLink = soundListItem.querySelector("a.soundTitle__title");
                if (!trackLink) return toolbars;
                const trackUrl = trackLink.href;
                if (!trackUrl) return toolbars;

                toolbars.push({ toolbar, trackUrl });
                return toolbars;
            }

            // likes & related
            const soundBadgeListItem = toolbar.closest(".soundBadgeList__item");
            if (soundBadgeListItem) {
                const trackLink = soundBadgeListItem.querySelector("a.soundTitle__title");
                if (!trackLink) return toolbars;
                const trackUrl = trackLink.href;
                if (!trackUrl) return toolbars;

                toolbars.push({ toolbar, trackUrl });
                return toolbars;
            }

            // history
            const historicalPlays = toolbar.closest(".historicalPlays__item");
            if (historicalPlays) {
                const trackLink = historicalPlays.querySelector("a.soundTitle__title");
                if (!trackLink) return toolbars;
                const trackUrl = trackLink.href;
                if (!trackUrl) return toolbars;

                toolbars.push({ toolbar, trackUrl });
                return toolbars;
            }

            // hero
            const content = toolbar.closest("#content");
            if (content) {
                const hero = content.querySelector(".l-listen-hero");
                if (!hero) return toolbars;

                const trackUrl = window.location.href;
                toolbars.push({ toolbar, trackUrl });
                return toolbars;
            }

            return toolbars;
        }, []);
}