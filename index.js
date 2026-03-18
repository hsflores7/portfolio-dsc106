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
