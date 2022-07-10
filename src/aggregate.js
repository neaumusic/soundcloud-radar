import { apiGetTrackByUrl, apiGetReposters, gatherLimitPerRequest } from "./api";
import { getLeaderboard, setLeaderboard, clearLeaderboard } from "./extension-storage";

const modal = document.createElement("div");
      modal.className = "soundcloud-radar-modal";
      modal.style.position = "fixed";
      modal.style.padding = "1rem";
      modal.style.borderRadius = "0.5rem";
      modal.style.boxShadow = "0 0 0.5rem lightgrey"
      modal.style.top = "10vh";
      modal.style.maxHeight = "80vh";
      modal.style.boxSizing = "border-box";
      modal.style.zIndex = "999999";
      modal.style.overflow = "auto";
      modal.style.left = "50%";
      modal.style.transform = "translate(-50%, 0px)";
      modal.style.backgroundColor = "white"
      modal.style.display = "none";
document.body.appendChild(modal);

window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        if (modal.style.display === "block") {
            if (!e.metaKey) {
                hideModal();
            } else {
                clearLeaderboard();
                showModal();
            }
        } else {
            showModal();
        }
    }
})

export async function aggregateRepostersByTrackUrl (trackUrl) {
    const track = await apiGetTrackByUrl(trackUrl);
    const shouldContinue = await new Promise(resolve => {
        if (track.reposts_count > 200) {
            if (window.confirm(`
                Track has ${track.reposts_count} reposters.
                This will consume ${Math.ceil(track.reposts_count/gatherLimitPerRequest)} network requests.
                Use with caution.
                Would you like to continue?
            `)) { resolve(true); } else { resolve(false); }
        } else { resolve(true); }
    });
    if (!shouldContinue) return;

    const reposters = await apiGetReposters(track.id, { limit: gatherLimitPerRequest });

    const leaderboard = await getLeaderboard();
    reposters.forEach(r => {
        leaderboard[r.permalink_url] = (leaderboard[r.permalink_url] || 0) + 1;
    });
    await setLeaderboard(leaderboard);

    showModal();
}


async function showModal () {
    const leaderboard = await getLeaderboard();
    modal.innerHTML = ``;
    const header = document.createElement("h2");
    header.style.marginBottom = "0.5rem";
    header.innerHTML = `Leaderboard (ESC to toggle, CMD+ESC to clear):`
    modal.appendChild(header);
    modal.appendChild(
        Object.entries(leaderboard)
            .sort(([urlA, countA], [urlB, countB]) => countB - countA)
            .reduce((container, [url, count]) => {
                const color = ({ 1: "black", 2: "darkgoldenrod", 3: "teal", 4: "fuchsia" })[count] || "fuchsia";
                const listItem = document.createElement("div");
                const span = document.createElement("span");
                span.innerText = `${count}: `;
                span.style.color = color;
                span.style.fontWeight = "bold";
                listItem.appendChild(span);
                const link = document.createElement("a");
                link.innerText = `${url}`;
                link.style.color = color;
                link.style.fontWeight = "bold";
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

