import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from "../global.js";

let query = "";
let projects = [];
let selectedYear = null; // Tracks selected year
const searchInput = document.querySelector(".searchBar");
const projectsContainer = document.querySelector(".projects");

async function init() {
    projects = await fetchJSON("../lib/projects.json");
    renderProjects(projects, projectsContainer, "h2");
    renderPieChart(projects); // Initial pie chart
}

// Function to filter projects based on search & pie chart selection
function filterProjects(query, yearFilter = null) {
    return projects.filter((project) => {
        let values = Object.values(project).join(" ").toLowerCase();
        let matchesQuery = values.includes(query.toLowerCase());
        let matchesYear = yearFilter ? project.year.toString() === yearFilter : true;
        return matchesQuery && matchesYear;
    });
}

// Function to render Pie Chart
function renderPieChart(projectsGiven) {
    let svg = d3.select("#projects-pie-plot");
    svg.selectAll("*").remove(); // Clear previous chart

    let legend = d3.select(".legend");
    legend.html(""); // Clear previous legend

    // Group projects by year
    let rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year
    );

    let data = rolledData.map(([year, count]) => ({
        value: count,
        label: year.toString()
    }));

    if (data.length === 0) return;

    const colors = d3.scaleOrdinal(d3.schemeTableau10);

    const arcGenerator = d3.arc()
        .innerRadius(0)
        .outerRadius(50);

    const sliceGenerator = d3.pie().value(d => d.value);
    const arcData = sliceGenerator(data);

    // Append paths (slices) & make them clickable
    let slices = svg.selectAll("path")
        .data(arcData)
        .join("path")
        .attr("d", arcGenerator)
        .attr("fill", (d, i) => colors(i))
        .attr("class", (d) => (d.data.label === selectedYear ? "selected" : "")) // Apply selection class
        .on("click", (event, d) => {
            selectedYear = selectedYear === d.data.label ? null : d.data.label; // Toggle selection
            updateVisualization();
        });

    // Generate dynamic legend (purely visual)
    data.forEach((d, idx) => {
        let legendItem = legend.append("li")
            .attr("class", `legend-item ${d.label === selectedYear ? "selected" : ""}`)
            .attr("style", `--color:${colors(idx)}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on("click", () => {
                selectedYear = selectedYear === d.label ? null : d.label; // Sync legend click with pie chart
                updateVisualization();
            });
    });
}

function updateVisualization() {
    let svg = d3.select("#projects-pie-plot");
    let legend = d3.select(".legend");

    // **Fix:** If both search & pie chart filters are inactive, reset immediately
    if (query === "" && selectedYear === null) {
        renderProjects(projects, projectsContainer, "h2"); // Show all projects
        renderPieChart(projects); // Reset pie chart
        return; // Exit function early
    }

    // Otherwise, apply filters
    let filteredProjects = filterProjects(query, selectedYear);
    renderProjects(filteredProjects, projectsContainer, "h2");

    // Update selected wedge in pie chart
    svg.selectAll("path").attr("class", (d) => (d.data.label === selectedYear ? "selected" : ""));

    // Update legend highlight color
    legend.selectAll("li").attr("class", (d, i, nodes) => {
        let itemLabel = d3.select(nodes[i]).text().split(" ")[0]; // Extract year from legend
        return itemLabel === selectedYear ? "legend-item selected" : "legend-item";
    });
}

searchInput.addEventListener("input", (event) => {
    query = event.target.value.trim();

    // **Fix:** Apply BOTH search AND pie chart filters together
    let filteredProjects = filterProjects(query, selectedYear);

    // **Fix:** If search bar is cleared & no pie slice selected, show all projects
    if (query === "" && selectedYear === null) {
        filteredProjects = projects;
    }

    renderProjects(filteredProjects, projectsContainer, "h2");
    renderPieChart(filteredProjects); // **Fix:** Ensure the pie chart updates correctly
});



// Initialize everything
init();