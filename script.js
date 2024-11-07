let dataLoaded = false;
let globalData = [];

// Load CSV data once and store it globally
function loadData(callback) {
  if (!dataLoaded) {
    d3.csv("Combined_Data.csv", d => ({
      Country: d.Country,
      Gini_Index: +d.Gini_Index,
      Life_Expectancy: +d.Life_Expectancy,
      Infant_Mortality: +d.Infant_Mortality
    })).then(data => {
      globalData = data;
      dataLoaded = true;
      console.log(globalData);  // Log to verify data loading
      callback();
    });
  } else {
    callback();
  }
}

// Choropleth Map with Gini Index, Life Expectancy, and Infant Mortality
function createChoroplethMap() {
  loadData(() => {
    const width = 800, height = 500;
    const svg = d3.select("#mapChart").append("svg").attr("width", width).attr("height", height);
    const projection = d3.geoMercator().scale(130).translate([width / 2, height / 1.5]);
    const path = d3.geoPath().projection(projection);
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0.3, 0.5]);

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(world => {
      svg.selectAll("path")
         .data(world.features)
         .enter().append("path")
         .attr("d", path)
         .attr("fill", d => {
           const countryData = globalData.find(c => c.Country === d.properties.name);
           return countryData ? colorScale(countryData.Gini_Index) : "#ccc";
         })
         .attr("stroke", "black")
         .attr("stroke-width", 0.5)
         .append("title")
         .text(d => {
           const countryData = globalData.find(c => c.Country === d.properties.name);
           return countryData ? `${countryData.Country}\nGini Index: ${countryData.Gini_Index}\nLife Expectancy: ${countryData.Life_Expectancy}\nInfant Mortality: ${countryData.Infant_Mortality}` : "No Data";
         });
    });
  });
}

// Bar Chart for Life Expectancy with Gini Index and Infant Mortality
function createBarChart() {
  loadData(() => {
    const svg = d3.select("#barChart").append("svg").attr("width", 800).attr("height", 500);
    const x = d3.scaleBand().domain(globalData.map(d => d.Country)).range([0, 800]).padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(globalData, d => d.Life_Expectancy)]).range([500, 0]);
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0.3, 0.5]);

    svg.selectAll("rect")
       .data(globalData)
       .enter().append("rect")
       .attr("x", d => x(d.Country))
       .attr("y", d => y(d.Life_Expectancy))
       .attr("width", x.bandwidth())
       .attr("height", d => 500 - y(d.Life_Expectancy))
       .attr("fill", d => colorScale(d.Gini_Index))
       .append("title")
       .text(d => `Country: ${d.Country}\nGini Index: ${d.Gini_Index}\nLife Expectancy: ${d.Life_Expectancy}\nInfant Mortality: ${d.Infant_Mortality}`);

    svg.append("g").attr("transform", "translate(0,500)").call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-40)").style("text-anchor", "end");
    svg.append("g").call(d3.axisLeft(y));
  });
}

// Scatter Plot for Gini Index vs Life Expectancy, with bubble size for Infant Mortality
function createScatterPlot() {
  loadData(() => {
    const svg = d3.select("#scatterPlot").append("svg").attr("width", 800).attr("height", 500);
    const x = d3.scaleLinear().domain([0.3, 0.5]).range([0, 800]);
    const y = d3.scaleLinear().domain([70, 90]).range([500, 0]);
    const sizeScale = d3.scaleSqrt().domain([0, 15]).range([5, 20]);

    svg.selectAll("circle")
       .data(globalData)
       .enter().append("circle")
       .attr("cx", d => x(d.Gini_Index))
       .attr("cy", d => y(d.Life_Expectancy))
       .attr("r", d => sizeScale(d.Infant_Mortality))
       .attr("fill", "orange")
       .append("title")
       .text(d => `Country: ${d.Country}\nGini Index: ${d.Gini_Index}\nLife Expectancy: ${d.Life_Expectancy}\nInfant Mortality: ${d.Infant_Mortality}`);

    svg.append("g").attr("transform", "translate(0,500)").call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y));
  });
}

// Line Chart for Infant Mortality by Country, colored by Life Expectancy
function createLineChart() {
  loadData(() => {
    const svg = d3.select("#lineChart").append("svg").attr("width", 800).attr("height", 500);
    const x = d3.scalePoint().domain(globalData.map(d => d.Country)).range([0, 800]);
    const y = d3.scaleLinear().domain([0, 15]).range([500, 0]);
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([70, 90]);

    const line = d3.line().x(d => x(d.Country)).y(d => y(d.Infant_Mortality));

    svg.append("path")
       .datum(globalData)
       .attr("fill", "none")
       .attr("stroke", "blue")
       .attr("stroke-width", 2)
       .attr("d", line);

    svg.append("g").attr("transform", "translate(0,500)").call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-40)").style("text-anchor", "end");
    svg.append("g").call(d3.axisLeft(y));
  });
}

// Dual-Axis Chart with Life Expectancy and Infant Mortality, color for Gini Index
function createDualAxisChart() {
  loadData(() => {
    const svg = d3.select("#dualAxisChart").append("svg").attr("width", 800).attr("height", 500);
    const x = d3.scaleBand().domain(globalData.map(d => d.Country)).range([0, 800]).padding(0.1);
    const yLeft = d3.scaleLinear().domain([70, 90]).range([500, 0]);
    const yRight = d3.scaleLinear().domain([0, 15]).range([500, 0]);
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0.3, 0.5]);

    svg.selectAll(".bar")
       .data(globalData)
       .enter().append("rect")
       .attr("x", d => x(d.Country))
       .attr("y", d => yLeft(d.Life_Expectancy))
       .attr("width", x.bandwidth())
       .attr("height", d => 500 - yLeft(d.Life_Expectancy))
       .attr("fill", d => colorScale(d.Gini_Index))
       .append("title")
       .text(d => `Country: ${d.Country}\nLife Expectancy: ${d.Life_Expectancy}\nGini Index: ${d.Gini_Index}\nInfant Mortality: ${d.Infant_Mortality}`);

    svg.append("g").attr("transform", "translate(0,500)").call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-40)").style("text-anchor", "end");
    svg.append("g").call(d3.axisLeft(yLeft).ticks(5)).attr("class", "y-axis-left");
    svg.append("g").attr("transform", "translate(800,0)").call(d3.axisRight(yRight).ticks(5)).attr("class", "y-axis-right");
  });
}
