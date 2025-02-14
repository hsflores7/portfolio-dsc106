const ARE_WE_HOME = document.body.classList.contains('home');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
    { url: 'meta/', title: 'Meta'},
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

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    if (!containerElement) {
        console.error('Invalid container element');
        return;
    }

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
            imagePath = ARE_WE_HOME ? `images/${project.image}` : `../images/${project.image}`;
        }

        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${imagePath}" alt="${project.title}">
            <p>${project.description}</p>
            <p class="project-year">c. ${project.year}</p>
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

function renderProject(project) {
    const projectElement = document.createElement("div");
    projectElement.classList.add("project");

    projectElement.innerHTML = `
        <div class="project-content">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <p class="project-year">${project.year}</p>
        </div>
    `;

    return projectElement;
}

// function calculateAge(birthDate) {
//     const now = new Date();
//     const diff = now - birthDate;
//     return diff / (1000 * 60 * 60 * 24 * 365.2425); // Convert milliseconds to years
// }

// function updateAgeDisplay() {
//     const birthDate = new Date(Date.UTC(2002, 9, 30, 23 + 8, 36)); // Replace with actual birth date
//     const ageContainer = document.querySelector(".age-container");

//     function animateAge() {
//         const age = calculateAge(birthDate);
//         const ageStr = age.toFixed(12); // Adjust precision here

//         ageContainer.innerHTML = ""; // Clear previous digits
//         ageStr.split("").forEach((char, index) => {
//             const span = document.createElement("span");
//             span.classList.add("digit");
//             span.style.transform = `translate3d(${index}ch, 0, 0)`;
//             span.textContent = char;
//             ageContainer.appendChild(span);
//         });

//         requestAnimationFrame(animateAge);
//     }

//     animateAge();
// }

// updateAgeDisplay();