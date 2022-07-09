if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectButtonsAndObserve);
} else {
    injectButtonsAndObserve();
}

const gatherLimit = 200; // this seems to be the current maximum

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
        return window.location.href;
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

const leaderboard = {};
async function aggregateTrack (trackUrl) {
    const track = await apiResolve(trackUrl);
    const reposters = await apiGetReposters(track.id, { limit: gatherLimit });

    reposters.forEach(r => {
        leaderboard[r.permalink_url] = (leaderboard[r.permalink_url] || 0) + 1;
    });

    showModal();
}

const modal = document.createElement("div");
modal.className = "soundcloud-radar-modal";
modal.style.position = "fixed";
modal.style.top = "10vh";
modal.style.maxHeight = "80vh";
modal.style.zIndex = "999999";
modal.style.overflow = "auto";
modal.style.left = "50%";
modal.style.transform = "translate(-50%, 0px)";
modal.style.background = "#3cf"
modal.style.display = "none";
modal.style.whiteSpace = "pre-wrap";
document.body.appendChild(modal);

window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        if (modal.style.display === "block") {
            hideModal();
        } else {
            showModal();
        }
    }
})
function showModal () {
    modal.innerHTML = "Leaderboard (Press ESC to toggle):";
    modal.appendChild(
        Object.entries(leaderboard)
            .sort(([urlA, countA], [urlB, countB]) => countB - countA)
            .reduce((container, [url, count]) => {
                const listItem = document.createElement("div");
                const span = document.createElement("span");
                span.innerText = `${count}: `;
                listItem.appendChild(span);
                const link = document.createElement("a");
                link.innerText = `${url}`;
                link.style.color = "initial";
                link.href = url;
                link.target = "_blank";
                listItem.appendChild(link);
                container.appendChild(listItem);
                return container;
            }, document.createElement("div"))
        );
    modal.style.display = "block";
}

function hideModal () {
    document.querySelector(".soundcloud-radar-modal").style.display = "none";
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
    if (response.next_href && window.confirm(`Gathered ${gatherLimit}; continue?`)) {
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
            if (window.confirm(`Gathered another ${gatherLimit}; continue?`)) {
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