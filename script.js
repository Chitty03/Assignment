let dataLoaded = false;
let globalData = [];

// Load CSV data with exact column headers
function loadData(callback) {
    if (!dataLoaded) {
      d3.csv("Combined_Data.csv", d => ({
        Country: d["Country"],
        Gini_Index: +d["Gini_Index"],
        Life_Expectancy: +d["Life_Expectancy"],
        Infant_Mortality: +d["Infant_Mortality"]
      })).then(data => {
        globalData = data;
        dataLoaded = true;
        console.log("Data loaded:", globalData);  // Check data in the console
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

      // Add color legend
      const legend = svg.append("g").attr("transform", `translate(${width - 150}, 20)`);
      const legendScale = d3.scaleLinear().domain([0.2, 0.5]).range([0, 100]);
      const legendAxis = d3.axisRight(legendScale).ticks(5);
      legend.selectAll("rect")
            .data(d3.range(0.2, 0.5, 0.1))
            .enter().append("rect")
            .attr("y", d => legendScale(d))
            .attr("width", 10)
            .attr("height", 20)
            .attr("fill", d => colorScale(d));
      legend.append("g").call(legendAxis);
      legend.append("text").text("Gini Index").attr("x", -30).attr("y", -10).attr("text-anchor", "middle");
    });
  });
}


// Bar Chart
function createBarChart() {
  loadData(() => {
    const width = 800, height = 500, margin = { top: 20, right: 20, bottom: 120, left: 60 };
    const svg = d3.select("#barChart").append("svg").attr("width", width).attr("height", height);
    const x = d3.scaleBand().domain(globalData.map(d => d.Country)).range([margin.left, width - margin.right]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(globalData, d => d.Life_Expectancy) + 10]).nice().range([height - margin.bottom, margin.top]);
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0.2, 0.5]);

    svg.selectAll("rect")
       .data(globalData)
       .enter().append("rect")
       .attr("x", d => x(d.Country))
       .attr("y", d => y(d.Life_Expectancy))
       .attr("width", x.bandwidth())
       .attr("height", d => height - margin.bottom - y(d.Life_Expectancy))
       .attr("fill", d => colorScale(d.Gini_Index))
       .on("mousemove", (event, d) => {
         const tooltipContent = `<strong>Country:</strong> ${d.Country}<br>
                                 <strong>Gini Index:</strong> ${d.Gini_Index}<br>
                                 <strong>Life Expectancy:</strong> ${d.Life_Expectancy}<br>
                                 <strong>Infant Mortality:</strong> ${d.Infant_Mortality}`;
         showTooltip(tooltipContent, event);
       })
       .on("mouseout", hideTooltip);

    svg.append("g")
       .attr("transform", `translate(0,${height - margin.bottom})`)
       .call(d3.axisBottom(x)).selectAll("text")
       .attr("transform", "rotate(-45)")
       .style("text-anchor", "end");

    svg.append("g")
       .attr("transform", `translate(${margin.left},0)`)
       .call(d3.axisLeft(y));
  });
}

// Scatter-Plot
function createScatterPlot() {
  loadData(() => {
    const width = 800, height = 500, margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const svg = d3.select("#scatterPlot").append("svg").attr("width", width).attr("height", height);
    const x = d3.scaleLinear().domain([0.2, 0.5]).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([70, 90]).range([height - margin.bottom, margin.top]);
    const sizeScale = d3.scaleSqrt().domain([0, 10]).range([3, 15]);

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
       .attr("transform", `translate(0,${height - margin.bottom})`)
       .call(d3.axisBottom(x).tickFormat(d3.format(".2f")));

    svg.append("g")
       .attr("transform", `translate(${margin.left},0)`)
       .call(d3.axisLeft(y));
  });
}



// Line Chart
function createLineChart() {
  loadData(() => {
    const width = 800, height = 500, margin = { top: 20, right: 20, bottom: 80, left: 60 };
    const svg = d3.select("#lineChart").append("svg").attr("width", width).attr("height", height);
    
    const x = d3.scalePoint().domain(globalData.map(d => d.Country)).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([0, d3.max(globalData, d => d.Infant_Mortality) + 1]).nice().range([height - margin.bottom, margin.top]);

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
       .attr("transform", `translate(0,${height - margin.bottom})`)
       .call(d3.axisBottom(x).tickSizeOuter(0))
       .selectAll("text")
       .attr("transform", "rotate(-45)")
       .style("text-anchor", "end");

    svg.append("g")
       .attr("transform", `translate(${margin.left},0)`)
       .call(d3.axisLeft(y).ticks(5));

    // Labels
    svg.append("text")
       .attr("class", "axis-label")
       .attr("x", -250)
       .attr("y", 20)
       .attr("transform", "rotate(-90)")
       .text("Infant Mortality (per 1000 live births)");

    svg.append("text")
       .attr("class", "axis-label")
       .attr("x", width / 2)
       .attr("y", height - 40)
       .attr("text-anchor", "middle")
       .text("Country");
  });
}

  
  // Dual-Axis Chart for Life Expectancy and Infant Mortality
  function createDualAxisChart() {
    loadData(() => {
      const width = 800, height = 500, margin = { top: 20, right: 60, bottom: 80, left: 60 };
      const svg = d3.select("#dualAxisChart").append("svg").attr("width", width).attr("height", height);
  
      const x = d3.scaleBand().domain(globalData.map(d => d.Country)).range([margin.left, width - margin.right]).padding(0.1);
      const yLeft = d3.scaleLinear().domain([70, d3.max(globalData, d => d.Life_Expectancy) + 5]).nice().range([height - margin.bottom, margin.top]);
      const yRight = d3.scaleLinear().domain([0, d3.max(globalData, d => d.Infant_Mortality) + 1]).nice().range([height - margin.bottom, margin.top]);
  
      // Bars for Life Expectancy, color-coded by Gini Index
      svg.selectAll(".bar")
         .data(globalData)
         .enter().append("rect")
         .attr("x", d => x(d.Country))
         .attr("y", d => yLeft(d.Life_Expectancy))
         .attr("width", x.bandwidth())
         .attr("height", d => height - margin.bottom - yLeft(d.Life_Expectancy))
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
         .attr("transform", `translate(0,${height - margin.bottom})`)
         .call(d3.axisBottom(x).tickSizeOuter(0))
         .selectAll("text")
         .attr("transform", "rotate(-45)")
         .style("text-anchor", "end");
  
      // Left Y-Axis for Life Expectancy
      svg.append("g")
         .attr("transform", `translate(${margin.left},0)`)
         .call(d3.axisLeft(yLeft).ticks(5))
         .append("text")
         .attr("fill", "black")
         .attr("x", -height / 2)
         .attr("dy", "-2.5em")
         .attr("text-anchor", "middle")
         .attr("transform", "rotate(-90)")
         .text("Life Expectancy (Years)");
  
      // Right Y-Axis for Infant Mortality
      svg.append("g")
         .attr("transform", `translate(${width - margin.right},0)`)
         .call(d3.axisRight(yRight).ticks(5))
         .append("text")
         .attr("fill", "black")
         .attr("x", height / 2)
         .attr("dy", "2.5em")
         .attr("text-anchor", "middle")
         .attr("transform", "rotate(-90)")
         .text("Infant Mortality (per 1000 live births)");
    });
  }
  
  
