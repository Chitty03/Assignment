let dataLoaded = false;
let globalData = [];

// Load CSV data with exact column headers
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
      callback();
    }).catch(error => {
      console.error("Error loading data:", error);
    });
  } else {
    callback();
  }
}

// Helper function for tooltips
function showTooltip(content, event) {
  d3.select(".tooltip")
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 10) + "px")
    .style("display", "inline-block")
    .html(content);
}

function hideTooltip() {
  d3.select(".tooltip").style("display", "none");
}

// Choropleth Map
function createChoroplethMap() {
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
         .on("mousemove", function(event, d) {
           const countryData = globalData.find(c => c.Country === d.properties.name);
           if (countryData) {
             const tooltipContent = `<strong>Country:</strong> ${countryData.Country}<br>
                                     <strong>Gini Index:</strong> ${countryData.Gini_Index}<br>
                                     <strong>Life Expectancy:</strong> ${countryData.Life_Expectancy}<br>
                                     <strong>Infant Mortality:</strong> ${countryData.Infant_Mortality}`;
             showTooltip(tooltipContent, event);
           }
         })
         .on("mouseout", hideTooltip);
    });
  });
}

// Bar Chart
function createBarChart() {
    // Hardcoded example data
    const exampleData = [
      { Country: "Country A", Gini_Index: 0.4, Life_Expectancy: 80, Infant_Mortality: 2 },
      { Country: "Country B", Gini_Index: 0.35, Life_Expectancy: 82, Infant_Mortality: 3 },
      { Country: "Country C", Gini_Index: 0.45, Life_Expectancy: 78, Infant_Mortality: 5 }
    ];
  
    const svg = d3.select("#barChart").append("svg").attr("width", 800).attr("height", 500);
    const x = d3.scaleBand().domain(exampleData.map(d => d.Country)).range([0, 800]).padding(0.1);
    const y = d3.scaleLinear().domain([0, 90]).range([500, 0]);
  
    svg.selectAll("rect")
       .data(exampleData)
       .enter().append("rect")
       .attr("x", d => x(d.Country))
       .attr("y", d => y(d.Life_Expectancy))
       .attr("width", x.bandwidth())
       .attr("height", d => 500 - y(d.Life_Expectancy))
       .attr("fill", "steelblue");
  
    svg.append("g")
       .attr("transform", "translate(0,500)")
       .call(d3.axisBottom(x))
       .selectAll("text")
       .attr("transform", "rotate(-45)")
       .style("text-anchor", "end");
  
    svg.append("g")
       .call(d3.axisLeft(y));
  }
  

// Scatter Plot
function createScatterPlot() {
  loadData(() => {
    const svg = d3.select("#scatterPlot").append("svg").attr("width", 800).attr("height", 500);
    const x = d3.scaleLinear().domain([0.2, 0.5]).range([0, 800]);
    const y = d3.scaleLinear().domain([70, 90]).range([500, 0]);
    const sizeScale = d3.scaleSqrt().domain([0, 10]).range([5, 20]);

    svg.selectAll("circle")
       .data(globalData)
       .enter().append("circle")
       .attr("cx", d => x(d.Gini_Index))
       .attr("cy", d => y(d.Life_Expectancy))
       .attr("r", d => sizeScale(d.Infant_Mortality))
       .attr("fill", "#69b3a2")
       .on("mousemove", (event, d) => {
         const tooltipContent = `<strong>Country:</strong> ${d.Country}<br>
                                 <strong>Gini Index:</strong> ${d.Gini_Index}<br>
                                 <strong>Life Expectancy:</strong> ${d.Life_Expectancy}<br>
                                 <strong>Infant Mortality:</strong> ${d.Infant_Mortality}`;
         showTooltip(tooltipContent, event);
       })
       .on("mouseout", hideTooltip);

    svg.append("g")
       .attr("transform", "translate(0,500)")
       .call(d3.axisBottom(x).tickFormat(d3.format(".2f")));

    svg.append("g")
       .call(d3.axisLeft(y).ticks(5));

    svg.append("text")
       .attr("class", "axis-label")
       .attr("x", -250)
       .attr("y", 20)
       .attr("transform", "rotate(-90)")
       .text("Life Expectancy (Years)");

    svg.append("text")
       .attr("class", "axis-label")
       .attr("x", 400)
       .attr("y", 540)
       .text("Gini Index");
  });
}

// Line Chart
function createLineChart() {
    loadData(() => {
      const svg = d3.select("#lineChart").append("svg").attr("width", 800).attr("height", 500);
      const x = d3.scalePoint().domain(globalData.map(d => d.Country)).range([0, 800]);
      const y = d3.scaleLinear().domain([0, d3.max(globalData, d => d.Infant_Mortality)]).range([500, 0]);
  
      const line = d3.line()
                     .x(d => x(d.Country))
                     .y(d => y(d.Infant_Mortality));
  
      // Draw the line
      svg.append("path")
         .datum(globalData)
         .attr("fill", "none")
         .attr("stroke", "blue")
         .attr("stroke-width", 2)
         .attr("d", line);
  
      // Add circles for each point
      svg.selectAll("circle")
         .data(globalData)
         .enter().append("circle")
         .attr("cx", d => x(d.Country))
         .attr("cy", d => y(d.Infant_Mortality))
         .attr("r", 4)
         .attr("fill", "black")
         .on("mousemove", (event, d) => {
           const tooltipContent = `<strong>Country:</strong> ${d.Country}<br>
                                   <strong>Infant Mortality:</strong> ${d.Infant_Mortality}<br>
                                   <strong>Life Expectancy:</strong> ${d.Life_Expectancy}<br>
                                   <strong>Gini Index:</strong> ${d.Gini_Index}`;
           showTooltip(tooltipContent, event);
         })
         .on("mouseout", hideTooltip);
  
      // X-axis and Y-axis
      svg.append("g")
         .attr("transform", "translate(0,500)")
         .call(d3.axisBottom(x))
         .selectAll("text")
         .attr("transform", "rotate(-45)")
         .style("text-anchor", "end");
  
      svg.append("g")
         .call(d3.axisLeft(y).ticks(5));
  
      svg.append("text")
         .attr("class", "axis-label")
         .attr("x", -250)
         .attr("y", 20)
         .attr("transform", "rotate(-90)")
         .text("Infant Mortality (per 1000 live births)");
  
      svg.append("text")
         .attr("class", "axis-label")
         .attr("x", 400)
         .attr("y", 540)
         .text("Country");
    });
  }
  
  // Dual-Axis Chart for Life Expectancy and Infant Mortality
  function createDualAxisChart() {
    loadData(() => {
      const svg = d3.select("#dualAxisChart").append("svg").attr("width", 800).attr("height", 500);
      const x = d3.scaleBand().domain(globalData.map(d => d.Country)).range([0, 800]).padding(0.1);
      const yLeft = d3.scaleLinear().domain([70, 90]).range([500, 0]);  // Left y-axis for Life Expectancy
      const yRight = d3.scaleLinear().domain([0, d3.max(globalData, d => d.Infant_Mortality)]).range([500, 0]);  // Right y-axis for Infant Mortality
  
      // Bars for Life Expectancy, color-coded by Gini Index
      svg.selectAll(".bar")
         .data(globalData)
         .enter().append("rect")
         .attr("x", d => x(d.Country))
         .attr("y", d => yLeft(d.Life_Expectancy))
         .attr("width", x.bandwidth())
         .attr("height", d => 500 - yLeft(d.Life_Expectancy))
         .attr("fill", "#4a90e2")
         .on("mousemove", (event, d) => {
           const tooltipContent = `<strong>Country:</strong> ${d.Country}<br>
                                   <strong>Life Expectancy:</strong> ${d.Life_Expectancy}<br>
                                   <strong>Gini Index:</strong> ${d.Gini_Index}<br>
                                   <strong>Infant Mortality:</strong> ${d.Infant_Mortality}`;
           showTooltip(tooltipContent, event);
         })
         .on("mouseout", hideTooltip);
  
      // Circles for Infant Mortality on the right y-axis
      svg.selectAll(".circle")
         .data(globalData)
         .enter().append("circle")
         .attr("cx", d => x(d.Country) + x.bandwidth() / 2)
         .attr("cy", d => yRight(d.Infant_Mortality))
         .attr("r", 5)
         .attr("fill", "red")
         .on("mousemove", (event, d) => {
           const tooltipContent = `<strong>Country:</strong> ${d.Country}<br>
                                   <strong>Infant Mortality:</strong> ${d.Infant_Mortality}<br>
                                   <strong>Life Expectancy:</strong> ${d.Life_Expectancy}<br>
                                   <strong>Gini Index:</strong> ${d.Gini_Index}`;
           showTooltip(tooltipContent, event);
         })
         .on("mouseout", hideTooltip);
  
      // X-Axis
      svg.append("g")
         .attr("transform", "translate(0,500)")
         .call(d3.axisBottom(x))
         .selectAll("text")
         .attr("transform", "rotate(-45)")
         .style("text-anchor", "end");
  
      // Left Y-Axis for Life Expectancy
      svg.append("g")
         .call(d3.axisLeft(yLeft).ticks(5))
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
  
