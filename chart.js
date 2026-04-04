const margin = { top: 70, right: 30, bottom: 40, left: 80 };
const width = 1200 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
let animationSpeed = 100000;
let animationFlow = true;

const x = d3.scaleLinear()
  .domain(d3.extent(data, d => d.t))
  .range([0, width]);                   

const y = d3.scaleLinear()
  .domain(d3.extent(data, d => d.hz))
  .range([height, 0]);                        

const svg = d3.select("#chart-container")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x).tickFormat(d => d.toFixed(2) + "s"));

svg.append("g")
  .call(d3.axisLeft(y).tickFormat(d => d.toFixed(0) + " Hz"));

const line = d3.line()
  .x(d => x(d.t))
  .y(d => y(d.hz))
  .curve(d3.curveCatmullRom.alpha(0.5));

const path = svg.append("path")
  .datum(data)
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 1.2)
  .attr("d", line);

const length = path.node().getTotalLength();

function standardAnimation() {
    const currentOffset = +path.attr("stroke-dashoffset");
    const distance = currentOffset;
    const scaledDuration = 30000 * (distance / length);

    path.attr("stroke-dasharray", length + " " + length)
        .transition()
        .ease(d3.easeLinear)
        .duration(scaledDuration)
        .attr("stroke-dashoffset", 0)
        .on("end", () => setTimeout(standardAnimation, 1000));
};

function forwardAnimation() {
    const currentOffset = +path.attr("stroke-dashoffset");
    const distance = currentOffset;
    const scaledDuration = 10000 * (distance / length);

    path.attr("stroke-dasharray", length + " " + length)
        .transition()
        .ease(d3.easeLinear)
        .duration(scaledDuration)
        .attr("stroke-dashoffset", 0)
        .on("end", () => setTimeout(forwardAnimation, 1000));

    console.log(length);
};

function backAnimation() {
    const currentOffset = +path.attr("stroke-dashoffset");
    const distance = length - currentOffset;
    const scaledDuration = 10000 * (distance / length);

    path.attr("stroke-dasharray", length + " " + length)
        .transition()
        .ease(d3.easeLinear)
        .duration(scaledDuration)
        .attr("stroke-dashoffset", length)
        .on("end", () => setTimeout(backAnimation, 1000));
};

document.onkeydown = function(event) {
    const key = event.key;
    if (key === "ArrowLeft") backAnimation();
    else if (key === "ArrowRight") forwardAnimation();
};

document.onkeyup = function(event) {
    const key = event.key;
    if (key === "ArrowLeft" || key === "ArrowRight") standardAnimation();
};

standardAnimation();

