import "dotenv/config";
import { Octokit } from "@octokit/rest";
import fs from "fs";
import { getIssues } from "./issues.js";
import { getReleaseMetrics } from "./releases.js";
import { getCommitMetrics } from "./commits.js";
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { addSyntheticLeadingComment } from "typescript";


const args = process.argv.slice(2);
const userIndex = args.indexOf("--user");
const repoIndex = args.indexOf("--repo");

async function readInput(question) {
  const rl = readline.createInterface({ input, output });

  const answer = await rl.question(question);

  rl.close();
  return answer;

}


// if (userIndex === -1 || repoIndex === -1 || !args[userIndex + 1] || !args[repoIndex + 1]) {
//   console.error("Usage: node index.mjs --user <username> --repo <repository> [--pat <token>]");
//   process.exit(1);
// }

console.log(`userI:${userIndex} , repoI:${repoIndex}`);


let username = "";
if (userIndex !== -1) {
  username = args[userIndex + 1];
}
else {
  username = await readInput("user : ");
}
let repository = "";
if (repoIndex !== -1) {
  repository = args[repoIndex + 1];
}
else {
  repository = await readInput("repository : ");
}

const patIndex = args.indexOf("--pat");
const token = (patIndex !== -1 && args[patIndex + 1]) ? args[patIndex + 1] : process.env.GITHUB_TOKEN;
if (!token) {
  console.warn("Warning: No token provided. Unauthenticated requests are limited to 60/hour.");
}

const octokit = new Octokit({ auth: token });

function humanizeHours(hours) {
  if (hours < 1) return "less than an hour";
  if (hours < 24) return `${Math.round(hours)} hour${Math.round(hours) !== 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  if (days < 7) return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} day${days !== 1 ? "s" : ""}`;
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  if (days < 30) return remainingDays > 0 ? `${weeks}w ${remainingDays}d` : `${weeks} week${weeks !== 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  const remainingWeeks = Math.floor((days % 30) / 7);
  return remainingWeeks > 0 ? `${months}mo ${remainingWeeks}w` : `${months} month${months !== 1 ? "s" : ""}`;
}

function humanizeDays(days) {
  if (days < 1) return "less than a day";
  if (days < 7) return `${Math.round(days)} day${Math.round(days) !== 1 ? "s" : ""}`;
  const weeks = Math.floor(days / 7);
  const remainingDays = Math.round(days % 7);
  if (days < 30) return remainingDays > 0 ? `${weeks}w ${remainingDays}d` : `${weeks} week${weeks !== 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  const remainingWeeks = Math.floor((days % 30) / 7);
  if (days < 365) return remainingWeeks > 0 ? `${months}mo ${remainingWeeks}w` : `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  return remainingMonths > 0 ? `${years}y ${remainingMonths}mo` : `${years} year${years !== 1 ? "s" : ""}`;
}



// Compare: https://docs.github.com/en/rest/reference/repos/#list-organization-repositories

  (async () => {

const repo = await octokit.rest.repos.get({owner:username,repo:repository});                                    

const stars = repo.data.stargazers_count;

    const outputFile = `${username}_${repository}.txt`;
    const lines = [];
    const log = (msg = "") => { console.log(msg); lines.push(msg); };

    log(`Analysing data for repository: ${username} / ${repository}`);
log(`stars : ${stars} 🌞`);
    const issuesWithResolutionTime = await getIssues(octokit, username, repository);
    log("Issues with resolution time:");
    //console.log(issuesWithResolutionTime);
    if (issuesWithResolutionTime.length > 0) {
      const avgResolutionTime = issuesWithResolutionTime.reduce((acc, issue) => acc + issue.resolution_time_hours, 0) / issuesWithResolutionTime.length;
      log(`Average resolution time: ${humanizeHours(avgResolutionTime)}`);
    }

    const releaseMetrics = await getReleaseMetrics(octokit, username, repository);
    if (releaseMetrics) {
      log(`Total releases: ${releaseMetrics.total}`);
      log(`Latest release: ${releaseMetrics.latest_tag} (${releaseMetrics.latest_published_at})`);
      if (releaseMetrics.avg_days_between_releases !== null)
        log(`Average time between releases: ${humanizeDays(releaseMetrics.avg_days_between_releases)}`);
      if (releaseMetrics.releases_per_month !== null)
        log(`Releases per month: ${releaseMetrics.releases_per_month.toFixed(2)}`);
    }

    const commitMetrics = await getCommitMetrics(octokit, username, repository);
    if (commitMetrics) {
      log(`Total commits: ${commitMetrics.total}`);
      if (commitMetrics.avg_commits_per_week !== null)
        log(`Average commits per week: ${commitMetrics.avg_commits_per_week.toFixed(1)}`);
      log("Top contributors:");
      for (const c of commitMetrics.top_contributors) {
        log(`  ${c.author}: ${c.commits} commits`);
      }
    }

    let commitAliveHeuristic = true;
    let releaseAliveHeuristic = true;

    const now = Date.now();
    if (commitMetrics.last_commit_date > now - 30 * 24 * 60 * 60 * 1000) {
      commitAliveHeuristic = true;
      log("There have been commits in the last month.");
    } else {
      commitAliveHeuristic = false;
      log("No commits in the last month.");
    }
    if (releaseMetrics  && releaseMetrics.last_release_date > now - 30 * 24 * 60 * 60 * 1000) {
      rleaseAliveHeuristic = true;
      log("There has been a release in the last month.");
    } else {
if (releaseMetrics) {
      releaseAliveHeuristic = false;
      log("No releases in the last month.");
}
else {
log('no release metrics');
releaseAliveHeuristic = true;
}
    }

    if (commitAliveHeuristic && releaseAliveHeuristic) {
      log("The repository appears to be active based on recent commits and releases.");
    }

    fs.writeFileSync(outputFile, lines.join("\n") + "\n");
    console.log(`\nMetrics written to ${outputFile}`);
  
})();
