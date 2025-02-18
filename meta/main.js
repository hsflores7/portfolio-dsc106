let data = [];
let commits = [];

const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 30, left: 50 };

let isTooltipPinned = false;

let xScale, yScale; // Declare globally so they can be accessed in brushed()
let brushSelection = null; // Stores current brush selection


async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: +row.line,
        depth: +row.depth,
        length: +row.length,
        date: row.date ? new Date(row.date + 'T00:00' + row.timezone) : null,
        datetime: row.datetime ? new Date(row.datetime) : null,
    }));

    processCommits();
    displayStats();
    createScatterplot();
}

function displayStats() {
    processCommits(); // Ensure commits are processed

    console.log("Displaying Stats...");

    // Select the stats container and clear previous content
    const statsContainer = d3.select('#stats').html('');

    // Create a flex container for horizontal layout
    const statsRow = statsContainer.append('div').attr('class', 'stats-row');

    // Helper function to append stat blocks
    function addStat(label, value) {
        const statBlock = statsRow.append('div').attr('class', 'stat-block');
        statBlock.append('span').attr('class', 'stat-label').text(label + ": ");
        statBlock.append('span').attr('class', 'stat-value').text(value);
    }

    // Add stats
    addStat('Total LOC', data.length || "N/A");
    addStat('Total Commits', commits.length || "N/A");
    addStat('Longest File (Lines)', d3.max(data, (d) => d.length) || 0);
    addStat('Average File Length', d3.mean(data, (d) => d.length)?.toFixed(2) || "N/A");
    addStat('Maximum Depth', d3.max(data, (d) => d.depth) || 0);
    addStat('Most Active Time', d3.greatest(
        d3.rollups(data, v => v.length, d => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })),
        d => d[1]
    )?.[0] || "N/A");
}



function processCommits() {
    commits = d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;

        let commitData = {
            id: commit,
            url: `https://github.com/hsflores7/portfolio-dsc106/commit/${commit}`,
            author,
            date,
            time,
            timezone,
            datetime,
            hourFrac: datetime ? datetime.getHours() + datetime.getMinutes() / 60 : 0,
            totalLines: lines.length,
        };

        Object.defineProperty(commitData, 'lines', {
            value: lines,
            enumerable: false,
        });

        return commitData;
    });
}

function createScatterplot() {
    if (commits.length === 0) {
        console.error("No commits data available!");
        return;
    }

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    // Define scales
    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain([8, 24])
        .range([usableArea.bottom, usableArea.top]);

    // Create SVG container
    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    // Add gridlines
    svg.append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(d3.axisBottom(xScale).tickSize(-usableArea.height).tickFormat(''));

    svg.append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(d3.axisLeft(yScale).tickSize(-usableArea.width).tickFormat(''));

    // Define x-axis with readable labels
    const xAxis = d3.axisBottom(xScale)
        .ticks(6) // Reduce label clutter
        .tickFormat(d3.timeFormat('%b %d, %Y')); // Format: Jan 01, 2024

    // Define y-axis with AM/PM formatting
    const yAxis = d3.axisLeft(yScale)
        .tickFormat((d) => {
            let hour = d % 24;
            let period = hour >= 12 ? "PM" : "AM";
            hour = hour % 12 || 12;
            return `${hour} ${period}`;
        });

    // Add x-axis to SVG
    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis)
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('transform', 'rotate(-30)') // Rotate for better readability
        .attr('dx', '-0.8em')
        .attr('dy', '0.15em');

    // Add y-axis to SVG
    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    // Sort commits for better visualization
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    
    // Define dot size scale (square root for balanced sizing)
    const rScale = d3.scaleSqrt()
        .domain([minLines, maxLines])
        .range([6, 20]);

    // Create dots group
    const dots = svg.append('g').attr('class', 'dots');

    // Plot commit dots
    dots.selectAll('circle')
        .data(sortedCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', (d) => (d.datetime.getHours() < 7 || d.datetime.getHours() > 16 ? 'steelblue' : 'orange'))
        .style('fill-opacity', 0.7)
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .on('mouseenter', function (event, commit) {
            d3.select(event.currentTarget).style('fill-opacity', 1); // Increase opacity on hover
            updateTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mousemove', (event) => {
            if (!isTooltipPinned) {
                updateTooltipPosition(event);
            }
        })
        .on('mouseleave', function () {
            if (!isTooltipPinned) {
                d3.select(this).style('fill-opacity', 0.7);
                updateTooltipContent({});
                updateTooltipVisibility(false);
            }
        })
        .on('click', (event, commit) => {
            isTooltipPinned = true;
            updateTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        });

    brushSelector(); // Enable brushing

    // Allow clicking outside to unpin tooltip
    document.addEventListener('click', (event) => {
        const tooltip = document.getElementById('commit-tooltip');
        if (!tooltip.contains(event.target) && !event.target.matches('circle')) {
            isTooltipPinned = false;
            updateTooltipContent({});
            updateTooltipVisibility(false);
        }
    });
}


function updateTooltipContent(commit) {
    const tooltip = document.getElementById('commit-tooltip');
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');

    if (!commit.id) {
        tooltip.style.display = 'none';
        return;
    }

    tooltip.style.display = 'block';
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleDateString('en', { dateStyle: 'full' });
    time.textContent = commit.datetime?.toLocaleTimeString('en', { timeStyle: 'short' });
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    const offsetX = 15;
    const offsetY = 15;
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = event.clientX + offsetX;
    let top = event.clientY + offsetY;

    // Adjust if tooltip goes out of bounds
    if (left + tooltipWidth > windowWidth) {
        left = event.clientX - tooltipWidth - offsetX;
    }
    if (top + tooltipHeight > windowHeight) {
        top = event.clientY - tooltipHeight - offsetY;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}


function brushSelector() {
    const svg = document.querySelector('svg');
    const brush = d3.brush()
        .extent([[0, 0], [width, height]]) // Define brushing area
        .on('brush end', brushed); // Attach brushed event handler

    d3.select(svg).call(brush);

    // Raise dots so they appear above the overlay
    d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
}

function isCommitSelected(commit) {
    if (!brushSelection) return false;

    const min = { x: brushSelection[0][0], y: brushSelection[0][1] };
    const max = { x: brushSelection[1][0], y: brushSelection[1][1] };

    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
}

let previousSelection = null; // Store previous selection to prevent unnecessary updates

function brushed(event) {
    const newSelection = event.selection;

    // If the selection hasn't changed, do nothing (prevents flickering)
    if (JSON.stringify(newSelection) === JSON.stringify(previousSelection)) {
        return;
    }

    previousSelection = newSelection; // Update stored selection

    brushSelection = newSelection;

    if (!brushSelection) {
        updateSelectionCount();
        updateLanguageBreakdown();
        updateSelection();
        return;
    }

    updateSelection();
    updateSelectionCount();
    updateLanguageBreakdown();
}




function updateSelection() {
    d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

let selectionCountTimeout;

function updateSelectionCount() {
    clearTimeout(selectionCountTimeout);
    selectionCountTimeout = setTimeout(() => {
        const selectedCommits = brushSelection
            ? commits.filter(isCommitSelected)
            : [];

        const countElement = document.getElementById('selection-count');
        countElement.textContent = `${selectedCommits.length || 'No'
            } commits selected`;

    }, 100); // Add small delay (100ms)
}


let languageBreakdownTimeout;
function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
        ? commits.filter(isCommitSelected)
        : [];

    const container = d3.select('#language-breakdown-container');

    // Keep container visible at all times
    container.style('opacity', 1).style('height', 'auto');

    if (selectedCommits.length === 0) {
        container.selectAll('.language-box').remove();
        return;
    }

    const lines = selectedCommits.flatMap((d) => d.lines);
    let breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type
    );

    // Convert Map to Array and sort by highest to lowest count
    breakdown = Array.from(breakdown).sort((a, b) => b[1] - a[1]); // Sort descending

    // Ensure the breakdown row exists
    let breakdownRow = container.select('.language-breakdown-row');
    if (breakdownRow.empty()) {
        breakdownRow = container.append('div').attr('class', 'language-breakdown-row');
    }

    // Bind data to language boxes, ensuring correct order
    const languageBoxes = breakdownRow
        .selectAll('.language-box')
        .data(breakdown, (d) => d[0]);

    // ENTER: Add new elements in the correct order
    languageBoxes.enter()
        .append('div')
        .attr('class', 'language-box')
        .merge(languageBoxes)
        .style('flex', '1') // Ensure equal spacing
        .order() // Ensure correct order in the DOM
        .html((d) => `
            <span class="language-name">${d[0]}</span>
            <span class="language-lines">${d[1]} lines</span>
            <span class="language-percent">(${d3.format('.1~%')(d[1] / lines.length)})</span>
        `);

    // EXIT: Remove old elements not in the new selection
    languageBoxes.exit().remove();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});
