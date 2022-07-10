import { apiGetTrackByUrl, apiGetReposters, gatherLimitPerRequest } from "./api";
import { getLeaderboard, setLeaderboard } from "./extension-storage";

export async function aggregate (trackUrl) {
    const track = await apiGetTrackByUrl(trackUrl);

    const shouldContinue = await new Promise(resolve => {
        if (track.reposts_count > 200) {
            if (window.confirm(`
                Track has ${track.reposts_count} reposters.
                This will consume ${Math.ceil(track.reposts_count/gatherLimitPerRequest)} network requests.
                Use with caution.
                Would you like to continue?
            `)) {
                resolve(true);
            } else {
                resolve(false);
            }
        } else {
            resolve(true);
        }
    });
    if (!shouldContinue) return;

    const reposters = await apiGetReposters(track.id, { limit: gatherLimitPerRequest });
    const leaderboard = await getLeaderboard();
    reposters.forEach(r => {
        leaderboard[r.permalink_url] = (leaderboard[r.permalink_url] || 0) + 1;
    });
    await setLeaderboard(leaderboard);
}
