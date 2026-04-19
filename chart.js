const margin = { top: 100, right: 100, bottom: 100, left: 100};
const width = 500;
const height = 300;
let animationSpeed = 100000;

async function loadData(csvPath) {
    const raw = await d3.csv(csvPath);
    return raw.map(d => ({
        t: +d.Time,
        amp: +d.Strain * 1e21 
    }));
}

loadData("data.csv").then(data => {

      //x axis, time
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.t))
    .range([0, width]);                   

  //y axis, amplitude 
  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.amp))
    .range([height, 0]);                        

  //chart, contains all data
  const svg = d3.select("#chart-container")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("color", "white")
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // svg.append("g")
  //   .attr("transform", `translate(0,${height})`)
  //   .call(d3.axisBottom(x).tickFormat(d => d.toFixed(2) + "s"))
  //   .call(g => g.remove());

  // svg.append("g")
  //   .call(d3.axisLeft(y).tickFormat(d => d.toFixed(0)))
  //   .call(g => g.select(".domain").remove())
  //   .attr("color","#fffaba");

  const line = d3.line()
    .x(d => x(d.t))
    .y(d => y(d.amp))
    .curve(d3.curveCatmullRom.alpha(.7));

  //background glowing effect for drawn path
  const pathGlow = svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#b2a14080")
    .attr("stroke-width", 10)
    .attr("d", line)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round");

  const path = svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#fffaba")
    .attr("stroke-width", 3)
    .attr("d", line)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round");

  //controls reveal of graph
  const curtain = svg.append("rect")
    .attr("x", "0")   
    .attr("y", -margin.top)  
    .attr("width", "100%")
    .attr("height", height+margin.top+margin.bottom)
    .attr("fill", "#02011a");


  //marks line where data is emerging
  const curtainLine = svg.append("rect")
    .attr("x", "0")   
    .attr("y", -margin.top+margin.bottom)  
    .attr("width", "3px")
    .attr("height", height)
    .attr("fill", "#2e2d34");

  const ghostClip = svg.append("clipPath")
    .attr("id", "ghost-clip")
    .append("rect")
    .attr("x", "0")
    .attr("y", -margin.top)
    .attr("width", "100%")
    .attr("height", height + margin.top + margin.bottom);

  const ghostPath = svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#2e2d34")
    .attr("stroke-width", 3)
    .attr("d", line)
    .attr("clip-path", "url(#ghost-clip)")
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round");


  // const point = path.node().getPointAtLength(40);

  // function animation(mode) {
  //   curtain.interrupt();
  //   curtainLine.interrupt();
  //   ghostClip.interrupt();

  //   const svgRect = svg.node().getBoundingClientRect();
  //   const currentX = curtain.node().getBoundingClientRect().x - svgRect.x;

  //   const distToStart = currentX;
  //   const distToEnd = width - currentX; 

  //   const VIDEO_DURATION_MS = 24000; // your video length in milliseconds
  //   const MS_PER_PX = VIDEO_DURATION_MS / width;
  //   const MS_PER_PX_FAST = MS_PER_PX / 2; // fast forward is 2x speed

  //   if (mode === "backward") {
  //     curtain.transition().ease(d3.easeLinear).duration(distToStart * MS_PER_PX).attr("x", 0);
  //     curtainLine.transition().ease(d3.easeLinear).duration(distToStart * MS_PER_PX).attr("x", 0);
  //     ghostClip.transition().ease(d3.easeLinear).duration(distToStart * MS_PER_PX).attr("x", 0);
  //   }
  //   else if (mode === "forward") {
  //     curtain.transition().ease(d3.easeLinear).duration(distToEnd * MS_PER_PX_FAST).attr("x", width);
  //     curtainLine.transition().ease(d3.easeLinear).duration(distToEnd * MS_PER_PX_FAST).attr("x", width);
  //     ghostClip.transition().ease(d3.easeLinear).duration(distToEnd * MS_PER_PX_FAST).attr("x", width);
  //   }
  //   else if (mode === "default") {
  //     curtain.transition().ease(d3.easeLinear).duration(distToEnd * MS_PER_PX).attr("x", width);
  //     curtainLine.transition().ease(d3.easeLinear).duration(distToEnd * MS_PER_PX).attr("x", width);
  //     ghostClip.transition().ease(d3.easeLinear).duration(distToEnd * MS_PER_PX).attr("x", width);
  //   }
  // }
  // document.addEventListener('vlc:seek', (e) => {
  //     animation(e.detail);
  // });

  function setCurtainX(x) {
      curtain.attr("x", x);
      curtainLine.attr("x", x);
      ghostClip.attr("x", x);
  }

  function syncToVideo() {
      const progress = video.currentTime / video.duration;
      const x = progress * width;
      setCurtainX(x);
      requestAnimationFrame(syncToVideo);
  }

  requestAnimationFrame(syncToVideo);

  //animation("default");



});

