import { Octokit } from "@octokit/rest";
import fs from "fs";
import { getIssues } from "./issues.js";
import { getReleaseMetrics } from "./releases.js";
import { getCommitMetrics } from "./commits.js";
const octokit = new Octokit();



// Compare: https://docs.github.com/en/rest/reference/repos/#list-organization-repositories
console.log("List repositories for a user:");
  (async () => {
    // const repos = await octokit.rest.repos
    // .listForUser({
    //   username: "b3b00",      
    // });

    // if (repos.status === 200) {
    //   console.log(repos.data.map(repo => repo.name));
    // }

  
    // const contributors = await octokit.rest.repos.listContributors({
    //   owner: "b3b00",
    //   repo: "csly"
    // });
    // if (contributors.status === 200) {
    //   if (contributors.data.length === 0) {
    //     console.log("No contributors found.");
    //   } else {
    //     console.log(contributors.data.map(contributor => contributor.login));
    //   }
    // }

    const issuesWithResolutionTime = await getIssues(octokit, "b3b00", "csly");
    console.log("Issues with resolution time:");
    //console.log(issuesWithResolutionTime);
    if (issuesWithResolutionTime.length > 0) {
      const avgResolutionTime = issuesWithResolutionTime.reduce((acc, issue) => acc + issue.resolution_time_hours, 0) / issuesWithResolutionTime.length;
      console.log(`Average resolution time: ${avgResolutionTime.toFixed(2)} hours`);
    }

    const releaseMetrics = await getReleaseMetrics(octokit, "b3b00", "csly");
    if (releaseMetrics) {
      console.log(`Total releases: ${releaseMetrics.total}`);
      console.log(`Latest release: ${releaseMetrics.latest_tag} (${releaseMetrics.latest_published_at})`);
      if (releaseMetrics.avg_days_between_releases !== null)
        console.log(`Average days between releases: ${releaseMetrics.avg_days_between_releases.toFixed(1)}`);
      if (releaseMetrics.releases_per_month !== null)
        console.log(`Releases per month: ${releaseMetrics.releases_per_month.toFixed(2)}`);
    }

    const commitMetrics = await getCommitMetrics(octokit, "b3b00", "csly");
    if (commitMetrics) {
      console.log(`Total commits: ${commitMetrics.total}`);
      if (commitMetrics.avg_commits_per_week !== null)
        console.log(`Average commits per week: ${commitMetrics.avg_commits_per_week.toFixed(1)}`);
      console.log("Top contributors:");
      for (const c of commitMetrics.top_contributors) {
        console.log(`  ${c.author}: ${c.commits} commits`);
      }
    }

    let commitAliveHeuristic = true;
    let releaseAliveHeuristic = true;

    const now = Date.now();
    if (commitMetrics.last_commit_date > now - 30 * 24 * 60 * 60 * 1000) {
      commitAliveHeuristic = true;
      console.log("There have been commits in the last month.");
    } else {
      commitAliveHeuristic = false;
      console.log("No commits in the last month.");
    }
    if (releaseMetrics.last_release_date > now - 30 * 24 * 60 * 60 * 1000) {
      rleaseAliveHeuristic = true;
      console.log("There has been a release in the last month.");
    } else {
      rleaseAliveHeuristic = false;
      console.log("No releases in the last month.");
    }

    if (comitAliveHeuristic && rleaseAliveHeuristic) {
      console.log("The repository appears to be active based on recent commits and releases.");
    }
  
})();
