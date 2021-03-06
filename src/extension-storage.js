export async function getLeaderboard () {
  return new Promise(resolve => {
    chrome.storage.local.get("leaderboard", ({ leaderboard }) => {
      resolve(leaderboard || {});
    });
  });
};

export async function setLeaderboard (leaderboard) {
  return new Promise(resolve => {
    chrome.storage.local.set({ leaderboard }, () => {
      resolve();
    });
  });
}

export async function clearLeaderboard () {
  return new Promise(resolve => {
    chrome.storage.local.clear(() => {
      resolve();
    })
  });
}
