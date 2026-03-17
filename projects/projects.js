import { fetchJSON, renderProjects } from "../global.js";

let projects = [];
const projectsContainer = document.querySelector(".projects");

async function init() {
    projects = await fetchJSON("../lib/projects.json");
    renderProjects(projects, projectsContainer, "h2");
}

// Initialize everything
init();