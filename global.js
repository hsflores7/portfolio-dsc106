const ARE_WE_HOME = document.body.classList.contains('home');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    // { url: 'meta/', title: 'Meta'}//,
    { url: 'hyperfixations/', title: 'Hyperfixations' }
];

let nav = document.createElement('nav');
nav.classList.add('navbar');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    // Adjust URL if not on the home page and not an absolute URL
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;

    // Create and configure the <a> element
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    // Highlight the current page
    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname
    );

    // Open external links in a new tab
    a.toggleAttribute('target', a.host !== location.host);

    nav.append(a);
}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <div class="theme-container">
        <label class="color-scheme">
            <span></span>
            <select id="theme-switcher">
                <option value="light dark">Auto</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        </label>
    </div>
    `
);

function setColorScheme(colorScheme) {
    if (colorScheme === 'light dark') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', systemTheme);
    } else {
        document.documentElement.setAttribute('data-color-scheme', colorScheme);
    }
}



const getDefaultColorScheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};


const select = document.querySelector('#theme-switcher');

select.addEventListener('input', function (event) {
    const colorScheme = event.target.value;
    setColorScheme(colorScheme);

    // Save the preference to localStorage
    localStorage.colorScheme = colorScheme;
});

const savedColorScheme = localStorage.colorScheme || 'light dark';
setColorScheme(savedColorScheme === 'light dark' ? getDefaultColorScheme() : savedColorScheme);

// Update the dropdown to reflect the saved preference
select.value = savedColorScheme;


export async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
        return [];
    }
}

export function renderProjects(projects, container, headingTag = "h2") {
    container.innerHTML = "";
    projects.forEach(project => {
        const article = document.createElement("article");

        // Add a link icon if site exists
        if (project.site && project.site.trim() !== "") {
            const link = document.createElement("a");
            link.href = project.site;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.className = "project-link-icon";
            link.title = "Open project site";
            // SVG link icon (accessible)
            link.innerHTML = `<svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path d="M14.59 2.59a2 2 0 0 1 2.82 2.82l-6.3 6.3a2 2 0 0 1-2.82-2.82l1.3-1.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 6V2h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            article.appendChild(link);
        }

        // Check if the image is an online URL (starts with http or https)
        let imagePath;
        if (project.image.startsWith('http')) {
            imagePath = project.image; // Online image, use as is
        } else {
            // Local image: Adjust path based on current page
            imagePath = ARE_WE_HOME ? `images/${project.image}` : `../images/${project.image}`;
        }

        if (project.image) {
            const img = document.createElement("img");
            img.src = imagePath;
            img.alt = project.title;
            article.appendChild(img);
        }

        const title = document.createElement(headingTag);
        title.textContent = project.title;
        article.appendChild(title);

        if (project.year) {
            const year = document.createElement("span");
            year.className = "project-year";
            year.textContent = project.year;
            article.appendChild(year);
        }

        if (project.description) {
            const desc = document.createElement("p");
            desc.textContent = project.description;
            article.appendChild(desc);
        }

        container.appendChild(article);
    });

    // If no projects exist, display a placeholder message
    if (projects.length === 0) {
        container.innerHTML = '<p>No projects found.</p>';
    }
}

export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
}

function renderProject(project) {
    const projectElement = document.createElement("div");
    projectElement.classList.add("project");

    projectElement.innerHTML = `
        <div class="project-content">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <p class="project-year">${project.year}</p>
        </div>
        ${project.site ? `
            <a class="project-link-icon" href="${project.site}" target="_blank" rel="noopener noreferrer" title="Visit project site">
                <!-- SVG link icon -->
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M14 3h7v7m-1.5-5.5L10 14m-4 0v7h7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </a>
        ` : ""}
    `;

    return projectElement;
}