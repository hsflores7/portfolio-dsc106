const ARE_WE_HOME = document.body.classList.contains('home');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
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
    <label class="color-scheme">
        Theme:
        <select id="theme-switcher">
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>
    `
);

function setColorScheme(colorScheme) {
    if (colorScheme === 'light dark') {
        document.documentElement.removeAttribute('data-color-scheme');
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

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    if (!containerElement) {
        console.error('Invalid container element');
        return;
    }

    // Detect if we're on the home page or projects page
    const isHomePage = window.location.pathname.includes('index.html') || window.location.pathname === '/';

    // Clear existing content
    containerElement.innerHTML = '';

    // Iterate through projects and create HTML structure
    projects.forEach((project) => {
        const article = document.createElement('article');

        // Check if the image is an online URL (starts with http or https)
        let imagePath;
        if (project.image.startsWith('http')) {
            imagePath = project.image; // Online image, use as is
        } else {
            // Local image: Adjust path based on current page
            imagePath = isHomePage ? `lib/${project.image}` : `../lib/${project.image}`;
        }

        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${imagePath}" alt="${project.title}">
            <p>${project.description}</p>
        `;
        containerElement.appendChild(article);
    });

    // If no projects exist, display a placeholder message
    if (projects.length === 0) {
        containerElement.innerHTML = '<p>No projects found.</p>';
    }
}





export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
}
