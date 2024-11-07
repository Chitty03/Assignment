let dataLoaded = false;
let globalData = [];

// Load CSV data with the exact column headers
function loadData(callback) {
  if (!dataLoaded) {
    d3.csv("Combined_Data.csv", d => ({
      Country: d["Country"],
      Gini_Index: +d["Income Inequality(Gini Index)"],
      Life_Expectancy: +d["Life expectancy(Number of Years)"],
      Infant_Mortality: +d["Infant Mortality Deaths Per 1000 live births"]
    })).then(data => {
      globalData = data;
      dataLoaded = true;
      console.log("Data loaded:", globalData);  // Verify data is loaded correctly
      callback();
    }).catch(error => {
      console.error("Error loading data:", error);  // Catch and log data loading errors
    });
  } else {
    callback();
  }
}

// Choropleth Map: Color-coded by Gini Index, tooltips with all data
function createChoroplethMap() {
  console.log("createChoroplethMap called");  // Debugging function call
  loadData(() => {
    const width = 800, height = 500;
    const svg = d3.select("#mapChart").append("svg").attr("width", width).attr("height", height);
    const projection = d3.geoMercator().scale(130).translate([width / 2, height / 1.5]);
    const path = d3.geoPath().projection(projection);
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0.2, 0.5]);

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
           return countryData 
             ? `Country: ${countryData.Country}\nGini Index: ${countryData.Gini_Index}\nLife Expectancy: ${countryData.Life_Expectancy}\nInfant Mortality: ${countryData.Infant_Mortality}`
             : "No Data";
         });
    }).catch(error => console.error("Error loading GeoJSON data:", error));
  });
}

// Bar Chart: Bars for Life Expectancy, color-coded by Gini Index, tooltips with all data
function createBarChart() {
  console.log("createBarChart called");  // Debugging function call
  loadData(() => {
    const svg = d3.select("#barChart").append("svg").attr("width", 800).attr("height", 500);
    const x = d3.scaleBand().domain(globalData.map(d => d.Country)).range([0, 800]).padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(globalData, d => d.Life_Expectancy)]).range([500, 0]);
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0.2, 0.5]);

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

// Scatter Plot: Gini Index vs Life Expectancy, bubble size for Infant Mortality, color-coded by Gini Index
function createScatterPlot() {
  console.log("createScatterPlot called");  // Debugging function call
  loadData(() => {
    const svg = d3.select("#scatterPlot").append("svg").attr("width", 800).attr("height", 500);
    const x = d3.scaleLinear().domain([0.2, 0.5]).range([0, 800]);
    const y = d3.scaleLinear().domain([70, 90]).range([500, 0]);
    const sizeScale = d3.scaleSqrt().domain([0, 10]).range([5, 20]);
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0.2, 0.5]);

    svg.selectAll("circle")
       .data(globalData)
       .enter().append("circle")
       .attr("cx", d => x(d.Gini_Index))
       .attr("cy", d => y(d.Life_Expectancy))
       .attr("r", d => sizeScale(d.Infant_Mortality))
       .attr("fill", d => colorScale(d.Gini_Index))
       .append("title")
       .text(d => `Country: ${d.Country}\nGini Index: ${d.Gini_Index}\nLife Expectancy: ${d.Life_Expectancy}\nInfant Mortality: ${d.Infant_Mortality}`);

    svg.append("g").attr("transform", "translate(0,500)").call(d3.axisBottom(x).ticks(5));
    svg.append("g").call(d3.axisLeft(y).ticks(5));
  });
}

// Line Chart: Line for Infant Mortality, color of points based on Life Expectancy, tooltips with all data
function createLineChart() {
  console.log("createLineChart called");  // Debugging function call
  loadData(() => {
    const svg = d3.select("#lineChart").append("svg").attr("width", 800).attr("height", 500);
    const x = d3.scalePoint().domain(globalData.map(d => d.Country)).range([0, 800]);
    const y = d3.scaleLinear().domain([0, d3.max(globalData, d => d.Infant_Mortality)]).range([500, 0]);
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([70, 90]);

    const line = d3.line()
                  .x(d => x(d.Country))
                  .y(d => y(d.Infant_Mortality));

    svg.append("path")
       .datum(globalData)
       .attr("fill", "none")
       .attr("stroke", "blue")
       .attr("stroke-width", 2)
       .attr("d", line);

    svg.selectAll("circle")
       .data(globalData)
       .enter().append("circle")
       .attr("cx", d => x(d.Country))
       .attr("cy", d => y(d.Infant_Mortality))
       .attr("r", 4)
       .attr("fill", d => colorScale(d.Life_Expectancy))
       .append("title")
       .text(d => `Country: ${d.Country}\nInfant Mortality: ${d.Infant_Mortality}\nLife Expectancy: ${d.Life_Expectancy}\nGini Index: ${d.Gini_Index}`);

    svg.append("g").attr("transform", "translate(0,500)").call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-40)").style("text-anchor", "end");
    svg.append("g").call(d3.axisLeft(y).ticks(5));
  });
}

// Dual-Axis Chart for Life Expectancy and Infant Mortality, tooltips with all data
function createDualAxisChart() {
    console.log("createDualAxisChart called");  // Debugging function call
    loadData(() => {
      const svg = d3.select("#dualAxisChart").append("svg").attr("width", 800).attr("height", 500);
      const x = d3.scaleBand().domain(globalData.map(d => d.Country)).range([0, 800]).padding(0.1);
      const yLeft = d3.scaleLinear().domain([70, 90]).range([500, 0]);  // Left y-axis for Life Expectancy
      const yRight = d3.scaleLinear().domain([0, d3.max(globalData, d => d.Infant_Mortality)]).range([500, 0]);  // Right y-axis for Infant Mortality
      const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0.2, 0.5]);
  
      // Bars for Life Expectancy, color-coded by Gini Index
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
  
      // Circles for Infant Mortality on the right y-axis
      svg.selectAll(".circle")
         .data(globalData)
         .enter().append("circle")
         .attr("cx", d => x(d.Country) + x.bandwidth() / 2)
         .attr("cy", d => yRight(d.Infant_Mortality))
         .attr("r", 5)
         .attr("fill", "red")
         .append("title")
         .text(d => `Country: ${d.Country}\nInfant Mortality: ${d.Infant_Mortality}\nGini Index: ${d.Gini_Index}\nLife Expectancy: ${d.Life_Expectancy}`);
  
      // X-Axis for Country Names
      svg.append("g")
         .attr("transform", "translate(0,500)")
         .call(d3.axisBottom(x))
         .selectAll("text")
         .attr("transform", "rotate(-40)")
         .style("text-anchor", "end");
  
      // Left Y-Axis for Life Expectancy
      svg.append("g")
         .call(d3.axisLeft(yLeft).ticks(5))
         .attr("class", "y-axis-left")
         .append("text")
         .attr("fill", "black")
         .attr("transform", "rotate(-90)")
         .attr("y", -40)
         .attr("x", -250)
         .attr("dy", "0.71em")
         .attr("text-anchor", "end")
         .text("Life Expectancy (Years)");
  
      // Right Y-Axis for Infant Mortality
      svg.append("g")
         .attr("transform", "translate(800,0)")
         .call(d3.axisRight(yRight).ticks(5))
         .attr("class", "y-axis-right")
         .append("text")
         .attr("fill", "black")
         .attr("transform", "rotate(-90)")
         .attr("y", 40)
         .attr("x", -250)
         .attr("dy", "0.71em")
         .attr("text-anchor", "start")
         .text("Infant Mortality (per 1000 live births)");
    });
  }
  