import { fetchJSON, renderProjects } from '../global.js';

async function loadProjects() {
    const projects = await fetchJSON('../lib/projects.json');
    const projectsContainer = document.querySelector('.projects');
    const projectsTitle = document.querySelector('.projects-title');

    if (projectsTitle) {
        projectsTitle.textContent = `${projects.length} Projects`;
    }

    if (projectsContainer) {
        renderProjects(projects, projectsContainer, 'h2');
    }
}

loadProjects();
