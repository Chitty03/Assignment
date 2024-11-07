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
    const width = 900, height = 500;
    const svg = d3.select("#mapChart").append("svg").attr("width", width).attr("height", height);
    const projection = d3.geoMercator().scale(140).translate([width / 2, height / 1.5]);
    const path = d3.geoPath().projection(projection);

    // Updated color scale for better color contrast
    const colorScale = d3.scaleSequential(d3.interpolateYlGnBu).domain([0.2, 0.5]);

    // Title and Subtitle
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", 20)
       .attr("text-anchor", "middle")
       .style("font-size", "18px")
       .style("font-weight", "bold")
       .text("Gini Index by Country (Income Inequality)");

    svg.append("text")
       .attr("x", width / 2)
       .attr("y", 40)
       .attr("text-anchor", "middle")
       .style("font-size", "12px")
       .style("fill", "gray")
       .text("Choropleth map showing income inequality across different countries");

    // World map data
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(world => {
      svg.selectAll("path")
         .data(world.features)
         .enter().append("path")
         .attr("d", path)
         .attr("fill", d => {
           const countryData = globalData.find(c => c.Country === d.properties.name);
           return countryData ? colorScale(countryData.Gini_Index) : "#e0e0e0";
         })
         .attr("stroke", "#555")
         .attr("stroke-width", 0.5)
         .on("mouseover", function() {
           d3.select(this).attr("stroke-width", 1.5).attr("stroke", "#333");
         })
         .on("mouseout", function() {
           d3.select(this).attr("stroke-width", 0.5).attr("stroke", "#555");
           hideTooltip();
         })
         .on("mousemove", function(event, d) {
           const countryData = globalData.find(c => c.Country === d.properties.name);
           if (countryData) {
             const tooltipContent = `<strong>Country:</strong> ${countryData.Country}<br>
                                     <strong>Gini Index:</strong> ${countryData.Gini_Index.toFixed(2)}<br>
                                     <strong>Life Expectancy:</strong> ${countryData.Life_Expectancy}<br>
                                     <strong>Infant Mortality:</strong> ${countryData.Infant_Mortality}`;
             showTooltip(tooltipContent, event);
           }
         });
    });

    // Improved Legend
    const legendWidth = 200, legendHeight = 10;
    const legend = svg.append("g").attr("transform", `translate(${width - 220}, 60)`);

    // Gradient for legend
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
                               .attr("id", "legendGradient");

    linearGradient.selectAll("stop")
                  .data(colorScale.ticks(10).map((t, i, n) => ({ offset: `${100 * i / n.length}%`, color: colorScale(t) })))
                  .enter().append("stop")
                  .attr("offset", d => d.offset)
                  .attr("stop-color", d => d.color);

    legend.append("rect")
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#legendGradient)")
          .style("stroke", "#ccc")
          .style("stroke-width", 0.5);

    // Legend Scale
    const legendScale = d3.scaleLinear().domain([0.2, 0.5]).range([0, legendWidth]);
    const legendAxis = d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format(".2f"));
    legend.append("g").attr("transform", `translate(0,${legendHeight})`).call(legendAxis);

    legend.append("text")
          .attr("x", legendWidth / 2)
          .attr("y", -10)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("fill", "#333")
          .text("Gini Index");

  });
}






// Bar Chart
function createBarChart() {
  loadData(() => {
    const width = 900, height = 500;
    const margin = { top: 50, right: 20, bottom: 150, left: 60 };

    const svg = d3.select("#barChart").append("svg")
                  .attr("width", width)
                  .attr("height", height);

    // Sort data by Life Expectancy for better readability
    globalData.sort((a, b) => b.Life_Expectancy - a.Life_Expectancy);

    // Scales
    const x = d3.scaleBand()
                .domain(globalData.map(d => d.Country))
                .range([margin.left, width - margin.right])
                .padding(0.2);

    const y = d3.scaleLinear()
                .domain([0, d3.max(globalData, d => d.Life_Expectancy) + 5])
                .nice()
                .range([height - margin.bottom, margin.top]);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
                         .domain([0.2, 0.5]);

    // Bars
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

    // Value Labels on top of bars
    svg.selectAll(".label")
       .data(globalData)
       .enter().append("text")
       .attr("class", "label")
       .attr("x", d => x(d.Country) + x.bandwidth() / 2)
       .attr("y", d => y(d.Life_Expectancy) - 5)
       .attr("text-anchor", "middle")
       .style("font-size", "10px")
       .style("fill", "#333")
       .text(d => d.Life_Expectancy.toFixed(1));

    // X Axis
    svg.append("g")
       .attr("transform", `translate(0,${height - margin.bottom})`)
       .call(d3.axisBottom(x).tickSizeOuter(0))
       .selectAll("text")
       .attr("transform", "rotate(-45)")
       .attr("dy", "0.75em")
       .attr("dx", "-0.75em")
       .style("text-anchor", "end")
       .style("font-size", "10px");

    // Y Axis
    svg.append("g")
       .attr("transform", `translate(${margin.left},0)`)
       .call(d3.axisLeft(y).ticks(5))
       .selectAll("text")
       .style("font-size", "10px");

    // Y Axis Label
    svg.append("text")
       .attr("class", "axis-label")
       .attr("x", -height / 2)
       .attr("y", 15)
       .attr("transform", "rotate(-90)")
       .attr("text-anchor", "middle")
       .style("font-size", "12px")
       .style("fill", "#333")
       .text("Life Expectancy (Years)");

    // X Axis Label
    svg.append("text")
       .attr("class", "axis-label")
       .attr("x", width / 2)
       .attr("y", height - 100)
       .attr("text-anchor", "middle")
       .style("font-size", "12px")
       .style("fill", "#333")
       .text("Country");

    // Title
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", 25)
       .attr("text-anchor", "middle")
       .style("font-size", "18px")
       .style("font-weight", "bold")
       .text("Bar Chart: Life Expectancy with Gini Index and Infant Mortality");

    svg.append("text")
       .attr("x", width / 2)
       .attr("y", 45)
       .attr("text-anchor", "middle")
       .style("font-size", "12px")
       .style("fill", "gray")
       .text("Sorted by Life Expectancy for Enhanced Comparison");
  });
}

function createScatterPlot() {
  loadData(() => {
    const width = 800, height = 500, margin = { top: 50, right: 20, bottom: 70, left: 70 };

    const svg = d3.select("#scatterPlot").append("svg")
                  .attr("width", width)
                  .attr("height", height);

    const x = d3.scaleLinear().domain([0.2, 0.5]).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([70, 90]).range([height - margin.bottom, margin.top]);
    const sizeScale = d3.scaleSqrt().domain([0, 10]).range([3, 15]);

    // Adjusted Color scale for Infant Mortality (starting with a darker shade)
    const colorScale = d3.scaleSequential(d3.interpolatePlasma) // Plasma has good contrast in lighter colors
                         .domain(d3.extent(globalData, d => d.Infant_Mortality));

    // Title for the plot
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", margin.top / 2)
       .attr("text-anchor", "middle")
       .attr("class", "title")
       .style("font-size", "16px")
       .style("fill", "#663399")  // Dark purple for title
       .text("Impact of Income Inequality on Life Expectancy with Infant Mortality");

    // Plotting circles with improved opacity
    svg.selectAll("circle")
       .data(globalData)
       .enter().append("circle")
       .attr("cx", d => x(d.Gini_Index))
       .attr("cy", d => y(d.Life_Expectancy))
       .attr("r", d => sizeScale(d.Infant_Mortality))
       .attr("fill", d => colorScale(d.Infant_Mortality))
       .attr("opacity", 0.85)  // Increased opacity for better visibility
       .on("mousemove", (event, d) => {
         const tooltipContent = `<strong>Country:</strong> ${d.Country}<br>
                                 <strong>Gini Index:</strong> ${d.Gini_Index}<br>
                                 <strong>Life Expectancy:</strong> ${d.Life_Expectancy}<br>
                                 <strong>Infant Mortality:</strong> ${d.Infant_Mortality}`;
         showTooltip(tooltipContent, event);
       })
       .on("mouseout", hideTooltip);

    // X-axis
    svg.append("g")
       .attr("transform", `translate(0,${height - margin.bottom})`)
       .call(d3.axisBottom(x).tickFormat(d3.format(".2f")));

    // X-axis label
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", height - margin.bottom / 3)
       .attr("text-anchor", "middle")
       .style("font-size", "12px")
       .text("Gini Index");

    // Y-axis
    svg.append("g")
       .attr("transform", `translate(${margin.left},0)`)
       .call(d3.axisLeft(y));

    // Y-axis label
    svg.append("text")
       .attr("transform", "rotate(-90)")
       .attr("y", margin.left / 3)
       .attr("x", -height / 2)
       .attr("dy", "-1.5em")
       .attr("text-anchor", "middle")
       .style("font-size", "12px")
       .text("Life Expectancy");

    // Legend for Infant Mortality with adjusted colors
    const legend = svg.append("g")
                      .attr("transform", `translate(${width - margin.right - 30}, ${margin.top})`);

    legend.selectAll("rect")
          .data(colorScale.ticks(5).slice(1))
          .enter().append("rect")
          .attr("y", (d, i) => i * 20)
          .attr("width", 15)
          .attr("height", 15)
          .style("fill", colorScale);

    legend.selectAll("text")
          .data(colorScale.ticks(5).slice(1))
          .enter().append("text")
          .attr("x", 20)
          .attr("y", (d, i) => i * 20 + 12)
          .text(d => d.toFixed(1))
          .style("font-size", "10px");
  });
}







// Line Chart
function createLineChart() {
  loadData(() => {
    const width = 900, height = 500, margin = { top: 50, right: 30, bottom: 100, left: 60 };
    const svg = d3.select("#lineChart").append("svg")
                  .attr("width", width)
                  .attr("height", height);

    // Scales
    const x = d3.scalePoint()
                .domain(globalData.map(d => d.Country))
                .range([margin.left, width - margin.right])
                .padding(0.5);

    const y = d3.scaleLinear()
                .domain([0, d3.max(globalData, d => d.Infant_Mortality) + 1])
                .nice()
                .range([height - margin.bottom, margin.top]);

    // Axes
    svg.append("g")
       .attr("transform", `translate(0,${height - margin.bottom})`)
       .call(d3.axisBottom(x))
       .selectAll("text")
       .attr("transform", "rotate(-45)")
       .style("text-anchor", "end")
       .style("font-size", "10px");

    svg.append("g")
       .attr("transform", `translate(${margin.left},0)`)
       .call(d3.axisLeft(y));

    // Gridlines
    svg.append("g")
       .attr("class", "grid")
       .attr("transform", `translate(${margin.left},0)`)
       .call(d3.axisLeft(y).ticks(5).tickSize(-width + margin.left + margin.right).tickFormat(""));

    // Line
    const line = d3.line()
                   .x(d => x(d.Country))
                   .y(d => y(d.Infant_Mortality));

    svg.append("path")
       .datum(globalData)
       .attr("fill", "none")
       .attr("stroke", "steelblue")
       .attr("stroke-width", 2)
       .attr("d", line);

    // Data points
    svg.selectAll("circle")
       .data(globalData)
       .enter().append("circle")
       .attr("cx", d => x(d.Country))
       .attr("cy", d => y(d.Infant_Mortality))
       .attr("r", 4)
       .attr("fill", "black")
       .on("mousemove", (event, d) => {
         const tooltipContent = `<strong>Country:</strong> ${d.Country}<br>
                                 <strong>Infant Mortality:</strong> ${d.Infant_Mortality}`;
         showTooltip(tooltipContent, event);
       })
       .on("mouseout", hideTooltip);

    // Title and Subtitle
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", margin.top / 2)
       .attr("text-anchor", "middle")
       .style("font-size", "18px")
       .style("font-weight", "bold")
       .text("Line Chart: Infant Mortality by Country");

    svg.append("text")
       .attr("x", width / 2)
       .attr("y", margin.top)
       .attr("text-anchor", "middle")
       .style("font-size", "12px")
       .style("fill", "gray")
       .text("Each point represents the infant mortality rate per 1000 live births");

    // Axis Labels
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", height - 20)
       .attr("text-anchor", "middle")
       .style("font-size", "12px")
       .text("Country");

    svg.append("text")
       .attr("x", -height / 2)
       .attr("y", 20)
       .attr("text-anchor", "middle")
       .attr("transform", "rotate(-90)")
       .style("font-size", "12px")
       .text("Infant Mortality (per 1000 live births)");
  });
}


  
  // Dual-Axis Chart for Life Expectancy and Infant Mortality
  function createEnhancedDualAxisChart() {
    loadData(() => {
      const width = 900, height = 500, margin = { top: 50, right: 60, bottom: 100, left: 60 };
      const svg = d3.select("#dualAxisChart").append("svg")
                    .attr("width", width)
                    .attr("height", height);
  
      // Scales
      const x = d3.scaleBand()
                  .domain(globalData.map(d => d.Country))
                  .range([margin.left, width - margin.right])
                  .padding(0.1);
  
      const yLeft = d3.scaleLinear()
                      .domain([70, d3.max(globalData, d => d.Life_Expectancy) + 5])
                      .nice()
                      .range([height - margin.bottom, margin.top]);
  
      const yRight = d3.scaleLinear()
                       .domain([0, d3.max(globalData, d => d.Infant_Mortality) + 1])
                       .nice()
                       .range([height - margin.bottom, margin.top]);
  
      // Bars for Life Expectancy
      svg.selectAll(".bar")
         .data(globalData)
         .enter().append("rect")
         .attr("x", d => x(d.Country))
         .attr("y", d => yLeft(d.Life_Expectancy))
         .attr("width", x.bandwidth())
         .attr("height", d => height - margin.bottom - yLeft(d.Life_Expectancy))
         .attr("fill", "#4a90e2");
  
      // Line and points for Life Expectancy
      const line = d3.line()
                     .x(d => x(d.Country) + x.bandwidth() / 2)
                     .y(d => yLeft(d.Life_Expectancy));
  
      svg.append("path")
         .datum(globalData)
         .attr("fill", "none")
         .attr("stroke", "#333")
         .attr("stroke-width", 2)
         .attr("d", line);
  
      svg.selectAll(".circle-life")
         .data(globalData)
         .enter().append("circle")
         .attr("cx", d => x(d.Country) + x.bandwidth() / 2)
         .attr("cy", d => yLeft(d.Life_Expectancy))
         .attr("r", 4)
         .attr("fill", "black");
  
      // Points for Infant Mortality
      svg.selectAll(".circle-infant")
         .data(globalData)
         .enter().append("circle")
         .attr("cx", d => x(d.Country) + x.bandwidth() / 2)
         .attr("cy", d => yRight(d.Infant_Mortality))
         .attr("r", 4)
         .attr("fill", "red");
  
      // X-Axis
      svg.append("g")
         .attr("transform", `translate(0,${height - margin.bottom})`)
         .call(d3.axisBottom(x))
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
         .style("font-size", "12px")
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
         .style("font-size", "12px")
         .text("Infant Mortality (per 1000 live births)");
  
      // Dashed Red Lines on Left and Right Axes
      svg.append("line")
         .attr("x1", margin.left)
         .attr("y1", margin.top)
         .attr("x2", margin.left)
         .attr("y2", height - margin.bottom)
         .attr("stroke", "red")
         .attr("stroke-width", 1)
         .attr("stroke-dasharray", "4");
  
      svg.append("line")
         .attr("x1", width - margin.right)
         .attr("y1", margin.top)
         .attr("x2", width - margin.right)
         .attr("y2", height - margin.bottom)
         .attr("stroke", "red")
         .attr("stroke-width", 1)
         .attr("stroke-dasharray", "4");
  
      // Title and Subtitle
      svg.append("text")
         .attr("x", width / 2)
         .attr("y", margin.top / 2)
         .attr("text-anchor", "middle")
         .style("font-size", "18px")
         .style("font-weight", "bold")
         .text("Dual-Axis Chart: Life Expectancy & Infant Mortality by Country");
  
      svg.append("text")
         .attr("x", width / 2)
         .attr("y", margin.top)
         .attr("text-anchor", "middle")
         .style("font-size", "12px")
         .style("fill", "gray")
         .text("Comparing Life Expectancy and Infant Mortality across countries");
  
      // Adding gridlines
      svg.append("g")
         .attr("class", "grid")
         .attr("transform", `translate(${margin.left},0)`)
         .call(d3.axisLeft(yLeft).ticks(5).tickSize(-width + margin.left + margin.right).tickFormat(""));
    });
  }
  
  
  
  
