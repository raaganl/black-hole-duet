const margin = { top: 70, right: 30, bottom: 40, left: 80 };
const width = 1200 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

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
console.log(length);


function animation(){
    path.attr("stroke-dasharray", length + " " + length)
        .attr("stroke-dashoffset", length)
          .transition()
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0)
          .duration(100000)
          .on("end", () => setTimeout(animation, 1000)); 
};
animation();
