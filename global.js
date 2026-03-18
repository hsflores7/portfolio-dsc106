const ARE_WE_HOME = document.body.classList.contains('home');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    // { url: 'hyperfixations/', title: 'Hyperfixations' }
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

const emailLink = document.getElementById('email-link');
if (emailLink) {
    emailLink.addEventListener('click', function (event) {
        event.preventDefault();
        navigator.clipboard.writeText('santiagoflo30@gmail.com').then(() => {
            showToast();
        });
    });
}

function showToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.add('show');         // Fade it in
        setTimeout(() => {
            toast.classList.remove('show');    // Fade it out after 2.5 seconds
        }, 2500);
    }
}

function easeInOutCubic(t) {
    t *= 2
    if (t < 1) return (t * t * t) / 2
    t -= 2
    return (t * t * t + 2) / 2
}

// Code used from sheeptester's portfolio: https://sheeptester.github.io/portfolio/
const BIRTHDAY = 1036013760000 // new Date('2002-10-30T15:36').getTime()
const MS_IN_YR = 1000 * 60 * 60 * 24 * 365.242199
function getAge(now = Date.now()) {
    return ((now - BIRTHDAY) / MS_IN_YR).toFixed(13)
}
const ANIM_LENGTH = 500 // ms
const ALPHA = 0.8

const ageSpan = document.getElementById('age')
// ageSpan.title = 'Click to see me age in real time'
if (ageSpan) {
    ageSpan.textContent = Math.floor((Date.now() - BIRTHDAY) / MS_IN_YR)
    ageSpan.classList.add('age-clickable')
    ageSpan.tabIndex = 0
    ageSpan.addEventListener('click', startAgeAnim, { once: true })
}

function startAgeAnim() {
    const ageWrapper = document.createElement('code')
    ageWrapper.classList.add('age')
    ageWrapper.role = 'text'
    const age = getAge()
    ageWrapper.style.width = age.length + 'ch'
    const decimal = age.indexOf('.')
    const digits = new Array(age.length)
    let sigfigs = Math.floor((Date.now() - BIRTHDAY) / 10000).toString().length
    for (let i = 0; i < age.length; i++) {
        const digit = document.createElement('span')
        digits[i] = {
            elem: digit,
            exponent:
                i === decimal ? null : i < decimal ? decimal - i - 1 : decimal - i
        }
        if (age[i] !== '.') {
            if (sigfigs <= 0) {
                digit.classList.add('insignificant')
                digit.title = 'This digit is purely an estimation.'
            }
            sigfigs--
        } else {
            digit.textContent = '.'
            digit.style.transform = `translate3d(${i}ch, 0, 0)`
        }
        ageWrapper.append(digit)
    }
    ageWrapper.append('\xa0') // nbsp
    ageSpan.replaceWith(ageWrapper)
    function display() {
        const now = Date.now()
        const age = getAge(now)
        for (let i = 0; i < age.length; i++) {
            const digit = digits[i]
            if (digit.exponent !== null) {
                const interval = 10 ** digit.exponent * MS_IN_YR
                const animationTime = Math.min(interval, ANIM_LENGTH)
                const time = (now - BIRTHDAY) % interval
                if (digit.elem.textContent !== age[i]) {
                    digit.elem.textContent = age[i]
                }
                if (time < animationTime) {
                    const interp = easeInOutCubic(time / animationTime)
                    digit.elem.style.transform = `translate3d(${i}ch, ${interp - 1}em, 0)`
                    const currentScheme = document.documentElement.getAttribute('data-color-scheme');
                    if (currentScheme === 'dark') {
                        digit.elem.style.color = `rgba(255, 255, 255, ${interp * ALPHA})`
                        digit.elem.style.setProperty(
                            '--text-color',
                            `rgba(255, 255, 255, ${(1 - interp) * ALPHA})`
                        )
                    } else {
                        digit.elem.style.color = `rgba(0, 0, 0, ${interp * ALPHA})`
                        digit.elem.style.setProperty(
                            '--text-color',
                            `rgba(0, 0, 0, ${(1 - interp) * ALPHA})`
                        )
                    }
                    digit.elem.dataset.last = (+age[i] + 9) % 10
                    digit.wasStatic = false
                } else if (!digit.wasStatic) {
                    digit.elem.style.transform = `translate3d(${i}ch, 0, 0)`
                    digit.elem.style.color = null
                    digit.elem.style.removeProperty('--text-color')
                    delete digit.elem.dataset.last
                    digit.wasStatic = true
                }
            }
        }
        window.requestAnimationFrame(display)
    }
    display()
}