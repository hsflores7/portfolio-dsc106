let data = [];
let commits = [];

const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 30, left: 50 };

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

    const xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    const yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => {
        let hour = d % 24; // Ensure hour stays in 0-23 range
        let period = hour >= 12 ? "PM" : "AM"; // Determine AM/PM
        hour = hour % 12 || 12; // Convert 0 to 12 and adjust 12-hour format
        return `${hour} ${period}`;
    });
    

    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    const dots = svg.append('g').attr('class', 'dots');

    dots.selectAll('circle')
        .data(commits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', 8)
        .attr('fill', (d) => (d.datetime.getHours() < 6 || d.datetime.getHours() > 18 ? 'steelblue' : 'orange'))
        .attr('opacity', 0.8);
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});
