import { getLeaderboard, clearLeaderboard } from "./extension-storage";

const modal = createModal();
document.body.appendChild(modal);
addKeyboardListener();

export async function showModal () {
    const leaderboard = await getLeaderboard();
    const header = document.createElement("h2");
          header.style.marginBottom = "0.5rem";
          header.innerHTML = `Leaderboard (ESC to toggle, CMD+ESC to clear):`
    modal.innerHTML = ``;
    modal.appendChild(header);
    modal.appendChild(createLeaderboardHtml(leaderboard));
    modal.style.display = "block";
}

export function hideModal () {
    document.querySelector(".soundcloud-radar-modal").style.display = "none";
}

function createLeaderboardHtml (leaderboard) {
    return Object.entries(leaderboard)
        .sort(([urlA, countA], [urlB, countB]) => countB - countA)
        .reduce((container, [url, count]) => {
            const color = ({ 1: "black", 2: "darkgoldenrod", 3: "fuchsia", 4: "teal" })[count] || "teal";
            const countSpan = document.createElement("span");
                  countSpan.innerText = `${count}: `;
                  countSpan.style.color = color;
                  countSpan.style.fontWeight = "bold";
            const link = document.createElement("a");
                  link.innerText = `${url}`;
                  link.style.color = color;
                  link.style.fontWeight = "bold";
                  link.href = url;
                  link.target = "_blank";
            const listItem = document.createElement("div");
                  listItem.appendChild(countSpan);
                  listItem.appendChild(link);
            container.appendChild(listItem);
            return container;
        }, document.createElement("div"))
}

function createModal () {
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
    return modal;
}

function addKeyboardListener () {
    window.addEventListener("keydown", async e => {
        if (e.key === "Escape") {
            if (modal.style.display === "block") {
                if (!e.metaKey && !e.ctrlKey) {
                    hideModal();
                } else {
                    clearLeaderboard();
                    await showModal();
                }
            } else {
                await showModal();
            }
        }
    })
}

