import fs from "fs";

export async function getIssues(octokit, user, repo) {
    let issuesWithResolutionTime = [];
let opened =0;
    let issues = await octokit
        .paginate("GET /repos/{owner}/{repo}/issues", {
            owner: user,
            repo: repo,
            state: "all",
        });
    if (issues && issues.length > 0) {
		 opened = issues.filter(i => i.state=="open").length;
        issues = issues.filter(issue => !issue.pull_request); // Exclude pull requests
        console.log(`analysing ${issues.length} issues for resolution time...`);
        for (let i = 0; i < issues.length; i++) {
            const filename = `issues/issue_${issues[i].number}.json`;
            const issue = issues[i];
            if (issue.hasOwnProperty("pull_request")) {
                //console.log(`Skipping pull request #${issue.number}: ${issue.title}`);
                continue;
            }            
            fs.writeFileSync(filename, JSON.stringify(issue, null, 2));
            const resolutionTime = await getIssueResolutionTime(octokit, issue);
//            console.log(`Resolution time for issue #${issue.number}: ${resolutionTime !== null ? resolutionTime.toFixed(2) + " hours" : "N/A"}`);
            if (resolutionTime !== null) {
                issuesWithResolutionTime.push({							
                    issue_number: issue.number,
                    title: issue.title,
                    resolution_time_hours: resolutionTime
                });
            }
        }
    } else {
        console.log("No issues found.");
    }
    return {issuesWithResolutionTime,opened};
}

async function getIssueResolutionTime(octokit, issue) {
    const timelineUrl = issue.timeline_url;
    const events = await octokit.request(timelineUrl);
    const closedEvent = events.data.find(event => event.event === "closed");
    if (closedEvent) {
        const closedAt = new Date(closedEvent.created_at);
        const createdAt = new Date(issue.created_at);
        const resolutionTime = (closedAt - createdAt) / (1000 * 60 * 60);
        return resolutionTime;
    } else {
        return null;
    }
}   