if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectButtonsAndObserve);
} else {
    injectButtonsAndObserve();
}

window.users = {};
window.runningTally = {};
window.leaderBoard = {};

async function injectButtonsAndObserve () {
    injectButtons();

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
    const toolbars = Array.from(document.querySelectorAll(".soundActions"))
        .filter(toolbar => toolbar.querySelector(".aggregate-button") === null);

    toolbars.forEach(toolbar => {
        const favoriteButton = toolbar.querySelector(".sc-button-like");
        if (!favoriteButton) return;

        const trackUrl = getTrackUrlFromToolbar(toolbar);
        if (!trackUrl) return;

        const aggregateButton = document.createElement("button");
        aggregateButton.className = favoriteButton.className.replace("sc-button-like", "aggregate-button");
        aggregateButton.classList.remove("sc-button-selected");
        aggregateButton.innerText = "Aggregate";
        aggregateButton.title = "Aggregate";
        aggregateButton.addEventListener("click", async () => {
            aggregateButton.classList.add("sc-button-selected");
            await aggregateTrack(trackUrl);
            aggregateButton.classList.remove("sc-button-selected");
        });

        favoriteButton.parentNode.appendChild(aggregateButton);
    });
}

function getTrackUrlFromToolbar (toolbar) {
    const trackContainer = (
        toolbar.closest(".sound") || // Search
        toolbar.closest(".soundList__item") ||  // Stream
        toolbar.closest(".trackList__item") ||  // Sets
        toolbar.closest(".soundBadgeList__item") ||  // Likes sidebar
        toolbar.closest(".historicalPlays__item") // History sidebar

    );
    if (!trackContainer) {
        console.log("defaulting to href");
        return window.location.href;
        // console.error("found no track container for toolbar", toolbar);
        // return;
    }

    const trackLink = (
        trackContainer.querySelector(".soundTitle__title") ||
        trackContainer.querySelector(".trackItem__trackTitle")
    );
    if (!trackLink || trackLink.tagName !== "A") {
        console.error("found no track link for track container", trackContainer);
        return;
    }

    return trackLink.href;
}

// --- aggregation --->

async function aggregateTrack (trackUrl) {
    const track = await apiResolve(trackUrl);
    const reposters = await apiGetReposters(track.id, { limit: 200 });

    const users = {};

    reposters.forEach(r => {
        users[r.id] = r;
        window.runningTally[r.id] = (window.runningTally[r.id] || 0) + 1;
    });

    window.users = {
        ...window.users,
        ...users,
    };

    window.leaderBoard = Object.entries(window.runningTally).reduce((leaderBoard, [id, count]) => {
        if (!leaderBoard[count]) leaderBoard[count] = [];
        leaderBoard[count].push(window.users[id]);
        return leaderBoard
    }, {});
    console.log(leaderBoard);
}

// --- auth --->

function getOAuthToken () {
    const cookies = Object.fromEntries(new URLSearchParams(document.cookie.replace("; ", "&")));
    return cookies.oauth_token;
}

function getClientId () {
    const entry = performance.getEntriesByType("resource").find(entry => (
        entry.initiatorType === "xmlhttprequest" &&
        entry.name.startsWith("https://api-v2.soundcloud.com") &&
        entry.name.includes("client_id=")
    ));
    const searchParams = Object.fromEntries(new URL(entry.name).searchParams);
    return searchParams.client_id;
}

// --- endpoints --->

async function apiResolve (trackUrl) {
    return await apiGetPathname("/resolve", { url: trackUrl });
}

async function apiGetReposters (trackId, params) {
    const response = await apiGetPathname(`/tracks/${trackId}/reposters`, params);
    const collection = response.collection;
    if (response.next_href && window.confirm("Continue?")) {
        await getAdditionalReposters(response, collection);
    }
    return collection.map(r => r);

    async function getAdditionalReposters (response, collection) {
        const url = new URL(response.next_href);
        const pathname = url.pathname;
        const searchParams = Object.fromEntries(new URLSearchParams(url.search));
        const additionalResponse = await apiGetPathname(pathname, searchParams);
        collection.push(...additionalResponse.collection);
        if (additionalResponse.next_href) {
            if (window.confirm("Continue?")) {
                await getAdditionalReposters(additionalResponse, collection);
            }
        };
    }
}

async function apiGetPathname (pathname, params) {
    const baseUrl = "https://api-v2.soundcloud.com";
    const searchParams = new URLSearchParams({ client_id: getClientId(), ...params }).toString();
    return await apiGet(baseUrl + pathname + "?" + searchParams, params);
}

async function apiGet (url) {
    const headers = { "Authorization": "OAuth " + getOAuthToken() };
    const response = await fetch(url, headers);
    return JSON.parse(await response.text());
}