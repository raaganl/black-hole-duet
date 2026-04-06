const margin = { top: 100, right: 100, bottom: 100, left: 100};
const width = 864
const height = 400;
let animationSpeed = 100000;
let animationFlow = true;

const x = d3.scaleLinear()
  .domain(d3.extent(data, d => d.t))
  .range([0, width]);                   

const y = d3.scaleLinear()
  .domain(d3.extent(data, d => d.amp))
  .range([height, 0]);                        

const svg = d3.select("#chart-container")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("color", "white")
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x).tickFormat(d => d.toFixed(2) + "s"))
  .call(g => g.remove());

svg.append("g")
  .call(d3.axisLeft(y).tickFormat(d => d.toFixed(0) + " amplitude"))
  .call(g => g.select(".domain").remove());

const line = d3.line()
  .x(d => x(d.t))
  .y(d => y(d.amp))
  .curve(d3.curveCatmullRom.alpha(.7));

const path = svg.append("path")
  .datum(data)
  .attr("fill", "none")
  .attr("stroke", "white")
  .attr("stroke-width", 2)
  .attr("d", line);
  
const curtain = svg.append("rect")
  .attr("x", "0")   
  .attr("y", -margin.top)  
  .attr("width", "100%")
  .attr("height", height+margin.top+margin.bottom)
  .attr("fill", "#02011a");

function animation(){
  curtain.transition()
    .duration(6000)
    .attr("x", "100%");      
}

const point = path.node().getPointAtLength(40);


// const timeLabel = svg.append("text")
//   .attr("y", height + 40)
//   .attr("fill", "white")
//   .style("font-size", "14px")
//   .text("test");

// standardAnimation();

// function standardAnimation() {
//     const currentOffset = parseFloat(path.attr("x"));
//     const scaledDuration = currentOffset * 1000;

//     path.attr("stroke-dasharray", length + " " + length)
//         .transition()
//         .ease(d3.easeLinear)
//         .duration(scaledDuration)
//         .attr("stroke-dashoffset", 0)
//         .on("end", () => setTimeout(standardAnimation, 1000));
// };

// function forwardAnimation() {
//     const currentOffset = parseFloat(path.attr("x"));
//     const scaledDuration = currentOffset * 1000;

//     path.attr("stroke-dasharray", length + " " + length)
//         .transition()
//         .ease(d3.easeLinear)
//         .duration(scaledDuration)
//         .attr("stroke-dashoffset", 0)
//         .on("end", () => setTimeout(forwardAnimation, 1000));

//     console.log(length);
// };

// function backAnimation() {
//     const currentOffset = +path.attr("stroke-dashoffset");
//     const distance = length - currentOffset;
//     const scaledDuration = 60000 * (distance / length);

//     path.attr("stroke-dasharray", length + " " + length)
//         .transition()
//         .ease(d3.easeLinear)
//         .duration(scaledDuration)
//         .attr("stroke-dashoffset", length)
//         .on("end", () => setTimeout(backAnimation, 1000));
// };

// document.onkeydown = function(event) {
//     const key = event.key;
//     if (key === "ArrowLeft") backAnimation();
//     else if (key === "ArrowRight") forwardAnimation();
// };

// document.onkeyup = function(event) {
//     const key = event.key;
//     if (key === "ArrowLeft" || key === "ArrowRight") standardAnimation();
// };

animation();

