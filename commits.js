/**
 * Metrics for GitHub commits
 * - Total number of commits
 * - Commits per contributor (top 10)
 * - Commits per month
 * - Average commits per week
 */
export async function getCommitMetrics(octokit, owner, repo) {
    const commits = await octokit.paginate("GET /repos/{owner}/{repo}/commits", {
        owner,
        repo,
        per_page: 100,
    });

    if (!commits || commits.length === 0) {
        console.log("No commits found.");
        return null;
    }


const first = commits.sort((a,b) => (a.commit.author.date > b.commit.author.date) ? 1 : ((b.commit.author.date >  a.commit.author.date ) ? -1 : 0))[0]




    console.log(`analysing ${commits.length} commits for frequency and contributors...`);

    const total = commits.length;

    // Commits per contributor
    const perContributor = {};
    for (const commit of commits) {
        const login = commit.author?.login ?? commit.commit?.author?.name ?? "unknown";
        perContributor[login] = (perContributor[login] ?? 0) + 1;
    }
    const topContributors = Object.entries(perContributor)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([author, count]) => ({ author, commits: count }));

    // Commits per month
    const perMonth = {};
    for (const commit of commits) {
        const date = commit.commit?.author?.date;
        if (date) {
            const key = date.slice(0, 7); // "YYYY-MM"
            perMonth[key] = (perMonth[key] ?? 0) + 1;
        }
    }
    const commitsPerMonth = Object.entries(perMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, commits: count }));

    // Average commits per week over the full period
    const dates = commits
        .map(c => c.commit?.author?.date)
        .filter(Boolean)
        .map(d => new Date(d))
        .sort((a, b) => a - b);

    let avgCommitsPerWeek = null;
    if (dates.length > 1) {
        const spanWeeks = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24 * 7);
        avgCommitsPerWeek = spanWeeks > 0 ? total / spanWeeks : null;
    }

    return {
start:first.commit.author.date,
        total,
        avg_commits_per_week: avgCommitsPerWeek,
        top_contributors: topContributors,
        commits_per_month: commitsPerMonth,
        last_commit_date: dates[dates.length - 1],
    };
}
