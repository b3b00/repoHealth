import { Octokit } from "@octokit/rest";
import fs from "fs";
import { getIssues } from "./issues.js";
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


  
})();
