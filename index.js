import { fetchJSON, renderProjects } from './global.js';
async function loadLatestProjects() {
    const projects = await fetchJSON('./lib/projects.json');
    const latestProjects = projects.slice(0, 3); // Get first 3 projects

    const projectsContainer = document.querySelector('.projects');

    if (projectsContainer) {
        renderProjects(latestProjects, projectsContainer, 'h2');
    }
}

loadLatestProjects();


import { fetchGitHubData } from './global.js';

const username = 'hsflores7'
async function loadGitHubProfile() {
    const githubData = await fetchGitHubData(username);

    const profileStats = document.querySelector('#profile-stats');

    if (profileStats) {
        profileStats.innerHTML = `
            <img src="${githubData.avatar_url}" alt="GitHub Avatar" width="100">
            <dl>
                <dt>Followers</dt><dd>${githubData.followers}</dd>
                <dt>Following</dt><dd>${githubData.following}</dd>
                <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
                <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
            </dl>
        `;
    }
    
}

loadGitHubProfile();
