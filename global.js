const ARE_WE_HOME = document.documentElement.classList.contains('home');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
    { url: 'hyperfixations/', title: 'Hyperfixations' },
    { url: 'https://github.com/hsflores7', title: 'GitHub' }
];

let nav = document.createElement('nav');
nav.classList.add('navbar');
document.body.prepend(nav);

// Add links to the <nav>
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
