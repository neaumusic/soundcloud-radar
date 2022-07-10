export const gatherLimitPerRequest = 200;

// --- auth --->

function getOAuthToken () {
    const cookies = Object.fromEntries(new URLSearchParams(document.cookie.replace(/; /g, "&")));
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

export async function apiGetTrackByUrl (trackUrl) {
    return await apiGetWithAuth("/resolve", { url: trackUrl });
}

export async function apiGetReposters (trackId) {
    const response = await apiGetWithAuth(`/tracks/${trackId}/reposters`, { limit: gatherLimitPerRequest });
    const collection = response.collection;
    if (response.next_href) {
        await getAdditionalReposters(response, collection);
    }
    return collection.map(r => r);
}

async function getAdditionalReposters (response, collection) {
    const url = new URL(response.next_href);
    const pathname = url.pathname;
    const searchParams = Object.fromEntries(new URLSearchParams(url.search));
    const additionalResponse = await apiGetWithAuth(pathname, searchParams);
    collection.push(...additionalResponse.collection);
    if (additionalResponse.next_href) {
        await getAdditionalReposters(additionalResponse, collection);
    };
}

async function apiGetWithAuth (pathname, params) {
    const baseUrl = "https://api-v2.soundcloud.com";
    const searchParams = new URLSearchParams({ client_id: getClientId(), ...params }).toString();
    const url = baseUrl + pathname + "?" + searchParams;
    const headers = { "Authorization": "OAuth " + getOAuthToken() };
    const response = await fetch(url, headers);
    return JSON.parse(await response.text());
}

