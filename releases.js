/**
 * Metrics for GitHub releases
 * - Total number of releases
 * - Average time between releases (days)
 * - Release frequency (releases per month)
 * - Latest release info
 */
export async function getReleaseMetrics(octokit, owner, repo) {
    const releases = await octokit.paginate("GET /repos/{owner}/{repo}/releases", {
        owner,
        repo,
        per_page: 100,
    });

    if (!releases || releases.length === 0) {
        console.log("No releases found.");
        return null;
    }

    // Sort by published date ascending
    const sorted = releases
        .filter(r => r.published_at)
        .sort((a, b) => new Date(a.published_at) - new Date(b.published_at));

    const total = sorted.length;
    const latest = sorted[sorted.length - 1];
    const oldest = sorted[0];

    // Average time between releases
    let avgDaysBetweenReleases = null;
    if (total > 1) {
        let totalGap = 0;
        for (let i = 1; i < sorted.length; i++) {
            const gap = new Date(sorted[i].published_at) - new Date(sorted[i - 1].published_at);
            totalGap += gap;
        }
        avgDaysBetweenReleases = totalGap / (total - 1) / (1000 * 60 * 60 * 24);
    }

    // Release frequency: releases per month over the full period
    const spanMs = new Date(latest.published_at) - new Date(oldest.published_at);
    const spanMonths = spanMs / (1000 * 60 * 60 * 24 * 30.44);
    const releasesPerMonth = spanMonths > 0 ? total / spanMonths : null;

    return {
        total,
        latest_tag: latest.tag_name,
        latest_published_at: latest.published_at,
        avg_days_between_releases: avgDaysBetweenReleases,
        releases_per_month: releasesPerMonth,
        last_release_date: latest.published_at,
    };
}
