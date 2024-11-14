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
     const width = 1920, height = 650;
     const svg = d3.select("#mapChart").append("svg").attr("width", width).attr("height", height); 
     const projection = d3.geoMercator().scale(140).translate([width / 2, height / 1.5]);
     const path = d3.geoPath().projection(projection);
     const colorScale = d3.scaleSequential(d3.interpolateYlGnBu).domain([0.2, 0.5]); 
    
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
      //Legend
    const legendWidth = 200, legendHeight = 10;
    const legend = svg.append("g").attr("transform", `translate(${width - 400}, 60)`);
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
          .attr("y", -20)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("fill", "#333")
          .text("Gini Index");

   });
 }
 

// Bar Chart
function createBarChart() {
   loadData(() => {
     const width = 1850, height = 700;
     const margin = { top: 50, right: 90, bottom: 180, left: 300 };
     const svg = d3.select("#barChart").append("svg")
                   .attr("width", width)
                   .attr("height", height);
     globalData.sort((a, b) => b.Life_Expectancy - a.Life_Expectancy);
 
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
 
     // Draw bars
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
 
     // Add value labels above each bar showing Life Expectancy
     svg.selectAll(".label")
        .data(globalData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(d.Country) + x.bandwidth() / 2) 
        .attr("y", d => y(d.Life_Expectancy) - 10) 
        .attr("text-anchor", "middle") 
        .style("font-size", "15px")
        .style("fill", "#333")
        .text(d => d.Life_Expectancy.toFixed(1)); 
 
     // Draw the x-axis at the bottom of the chart
     svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`) 
        .call(d3.axisBottom(x).tickSizeOuter(0)) 
        .selectAll("text")
        .attr("transform", "rotate(-45)") 
        .attr("dy", "0.75em") 
        .attr("dx", "-0.75em")
        .style("text-anchor", "end") 
        .style("font-size", "13px"); 
 
     // Draw the y-axis on the left of the chart
     svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5)) 
        .selectAll("text")
        .style("font-size", "10px");
 
     // Add a label for the y-axis to indicate what the values represent
     svg.append("text")
        .attr("class", "axis-label")
        .attr("x", -height / 2.5) 
        .attr("y", 250) 
        .attr("transform", "rotate(-90)") 
        .attr("text-anchor", "middle") 
        .style("font-size", "20px")
        .style("fill", "#333")
        .text("Life Expectancy (Years)"); 
 
     // Add a label for the x-axis to indicate the countries represented
     svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2) 
        .attr("y", height - 70) 
        .attr("text-anchor", "middle") 
        .style("font-size", "20px")
        .style("fill", "#333")
        .text("Country"); 
   });
 }
 

 function createScatterPlot() {
   loadData(() => {
     const width = 1700, height = 600, margin = { top: 50, right: 100, bottom: 70, left: 300 };
     const svg = d3.select("#scatterPlot").append("svg")
                   .attr("width", width)
                   .attr("height", height);
 
     const x = d3.scaleLinear().domain([0.2, 0.5]).range([margin.left, width - margin.right]);
 
     const y = d3.scaleLinear().domain([70, 90]).range([height - margin.bottom, margin.top]);

     const sizeScale = d3.scaleSqrt().domain([0, 10]).range([3, 15]);
 
     const colorScale = d3.scaleSequential(d3.interpolatePlasma)
                          .domain(d3.extent(globalData, d => d.Infant_Mortality));
 
     // Plotting circles
     svg.selectAll("circle")
        .data(globalData)
        .enter().append("circle") 
        .attr("cx", d => x(d.Gini_Index)) 
        .attr("cy", d => y(d.Life_Expectancy)) 
        .attr("r", d => sizeScale(d.Infant_Mortality)) 
        .attr("fill", d => colorScale(d.Infant_Mortality)) 
        .attr("opacity", 0.85) 
        
        .on("mousemove", (event, d) => {
          const tooltipContent = `<strong>Country:</strong> ${d.Country}<br>
                                  <strong>Gini Index:</strong> ${d.Gini_Index}<br>
                                  <strong>Life Expectancy:</strong> ${d.Life_Expectancy}<br>
                                  <strong>Infant Mortality:</strong> ${d.Infant_Mortality}`;
          showTooltip(tooltipContent, event); 
        })
        
        .on("mouseout", hideTooltip);
 
     // Draw x-axis
     svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`) 
        .call(d3.axisBottom(x).tickFormat(d3.format(".2f"))) 
        .selectAll("text")
        .style("font-size", "13px"); 
 
     // X-axis label
     svg.append("text")
        .attr("x", width / 1.7) 
        .attr("y", height - margin.bottom / 5.5) 
        .attr("text-anchor", "middle") 
        .style("font-size", "20px")
        .text("Gini Index"); 
 
     // Draw y-axis
     svg.append("g")
        .attr("transform", `translate(${margin.left},0)`) 
        .call(d3.axisLeft(y)) 
        .selectAll("text")
        .style("font-size", "13px"); 
 
     // Y-axis label
     svg.append("text")
        .attr("transform", "rotate(-90)") 
        .attr("y", margin.left / 1.1) 
        .attr("x", -height / 2) 
        .attr("dy", "-1.5em") 
        .attr("text-anchor", "middle") 
        .style("font-size", "20px")
        .text("Life Expectancy");
 
     // Legend for Infant Mortality with color scale
     const legend = svg.append("g")
                       .attr("transform", `translate(${width - margin.right - 30}, ${margin.top})`); 
 
     // Draw color boxes for each tick in the color scale
     legend.selectAll("rect")
           .data(colorScale.ticks(5).slice(1)) 
           .enter().append("rect")
           .attr("y", (d, i) => i * 20) 
           .attr("width", 15) 
           .attr("height", 15) 
           .style("fill", colorScale); 
 
     // Add labels for each color box indicating Infant Mortality values
     legend.selectAll("text")
           .data(colorScale.ticks(5).slice(1)) 
           .enter().append("text")
           .attr("x", 20) 
           .attr("y", (d, i) => i * 20 + 12) 
           .text(d => d.toFixed(1)) 
           .style("font-size", "15px");
   });
 }
 


// Line Chart
function createLineChart() {
   loadData(() => {
     const width = 1570, height = 700, margin = { top: 60, right: 30, bottom: 180, left: 360 };
     const svg = d3.select("#lineChart").append("svg")
                   .attr("width", width)
                   .attr("height", height);
 
     const x = d3.scalePoint()
                 .domain(globalData.map(d => d.Country)) 
                 .range([margin.left, width - margin.right]) 
                 .padding(0.5); 
 
     // Define y-scale as a linear scale for Infant Mortality, setting range and limits
     const y = d3.scaleLinear()
                 .domain([0, d3.max(globalData, d => d.Infant_Mortality) + 1]) 
                 .nice() 
                 .range([height - margin.bottom, margin.top]); 
 
     // Draw x-axis at the bottom of the chart with rotated text labels
     svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`) 
        .call(d3.axisBottom(x)) 
        .selectAll("text")
        .attr("transform", "rotate(-45)") 
        .style("text-anchor", "end")
        .style("font-size", "13px"); 
 
     // Draw y-axis on the left side of the chart
     svg.append("g")
        .attr("transform", `translate(${margin.left},0)`) 
        .call(d3.axisLeft(y)) 
        .style("font-size", "15px"); 
 
     // Add horizontal gridlines for better readability of values
     svg.append("g")
        .attr("class", "grid") 
        .attr("transform", `translate(${margin.left},0)`) 
        .call(d3.axisLeft(y).ticks(5).tickSize(-width + margin.left + margin.right).tickFormat("")); 
 
     // Define a line generator to create the line path based on country (x) and Infant Mortality (y)
     const line = d3.line()
                    .x(d => x(d.Country)) 
                    .y(d => y(d.Infant_Mortality)); 
 
     // Draw the line path on the SVG
     svg.append("path")
        .datum(globalData) 
        .attr("fill", "none") 
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2) 
        .attr("d", line);
 
     // Plot data points as circles on the line
     svg.selectAll("circle")
        .data(globalData) 
        .enter().append("circle") 
        .attr("cx", d => x(d.Country)) 
        .attr("cy", d => y(d.Infant_Mortality)) 
        .attr("r", 4) 
        .attr("fill", "black") 
 
        // Tooltip on mouse move
        .on("mousemove", (event, d) => {
          const tooltipContent = `<strong>Country:</strong> ${d.Country}<br>
                                  <strong>Infant Mortality:</strong> ${d.Infant_Mortality}`;
          showTooltip(tooltipContent, event); 
        })
        
        // Hide tooltip on mouse out
        .on("mouseout", hideTooltip);
 
     // Add x-axis label for country
     svg.append("text")
        .attr("x", width / 1.6) 
        .attr("y", height - 70) 
        .attr("text-anchor", "middle") 
        .style("font-size", "20px")
        .text("Country"); 
 
     // Add y-axis label for Infant Mortality
     svg.append("text")
        .attr("x", -height / 2.5)
        .attr("y", 300) 
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)") 
        .style("font-size", "18px")
        .text("Infant Mortality (per 1000 live births)");
   });
 }
 

  // Dual-Axis Chart for Life Expectancy and Infant Mortality
  function createDualAxisChart() {
   loadData(() => {
       const margin = { top: 50, right: 70, bottom: 180, left: 280 };
       const width = 1700 - margin.left - margin.right;
       const height = 700 - margin.top - margin.bottom;

       // Create SVG container and apply margins
       const svg = d3.select("#mapChart") 
           .append("svg")
           .attr("width", width + margin.left + margin.right)
           .attr("height", height + margin.top + margin.bottom)
           .append("g")
           .attr("transform", `translate(${margin.left},${margin.top})`);

       // Axis Colors
       const leftAxisColor = "#1f77b4";  
       const rightAxisColor = "#d62728"; 

       // X-axis
       const xScale = d3.scaleBand()
           .range([0, width])
           .padding(0.1);

       // Y-axes
       const yLeftScale = d3.scaleLinear().range([height, 0]);
       const yRightScale = d3.scaleLinear().range([height, 0]);

       // Load Data
       xScale.domain(globalData.map(d => d.Country));
       yLeftScale.domain([70, 90]); 
       yRightScale.domain([0, 10]); 

       // Add X-axis
       svg.append("g")
           .attr("transform", `translate(0,${height})`)
           .call(d3.axisBottom(xScale))
           .selectAll("text")
           .attr("text-anchor", "end")
           .attr("dx", "-0.8em")
           .attr("dy", "0.15em")
           .style("font-size", "15px")
           .attr("transform", "rotate(-45)");

       // Add Left Y-axis (Life Expectancy)
       svg.append("g")
           .style("color", leftAxisColor)
           .call(d3.axisLeft(yLeftScale))
           .append("text")
           .attr("transform", "rotate(-90)")
           .attr("x", -height / 2)
           .attr("y", -margin.left + 200)
           .attr("dy", "1em")
           .style("text-anchor", "middle")
           .style("fill", leftAxisColor)
           .style("font-size", "20px")
           .text("Life Expectancy (Years)");

       // Add Right Y-axis (Infant Mortality)
       svg.append("g")
           .attr("transform", `translate(${width},0)`)
           .style("color", rightAxisColor)
           .call(d3.axisRight(yRightScale))
           .append("text")
           .attr("transform", "rotate(-90)")
           .attr("x", -height / 2)
           .attr("y", margin.right - 20)
           .attr("dy", "1em")
           .style("text-anchor", "middle")
           .style("fill", rightAxisColor)
           .style("font-size", "18px")
           .text("Infant Mortality (per 1000 live births)");

       // Bars for Life Expectancy
       svg.selectAll(".bar")
           .data(globalData)
           .enter().append("rect")
           .attr("class", "bar")
           .attr("x", d => xScale(d.Country))
           .attr("y", d => yLeftScale(d.Life_Expectancy))
           .attr("width", xScale.bandwidth())
           .attr("height", d => height - yLeftScale(d.Life_Expectancy))
           .style("fill", leftAxisColor);

       // Line and Points for Infant Mortality
       const line = d3.line()
           .x(d => xScale(d.Country) + xScale.bandwidth() / 2)
           .y(d => yRightScale(d.Infant_Mortality));

       svg.append("path")
           .datum(globalData)
           .attr("fill", "none")
           .attr("stroke", rightAxisColor)
           .attr("stroke-width", 1.5)
           .attr("d", line);

       svg.selectAll(".point")
           .data(globalData)
           .enter().append("circle")
           .attr("class", "point")
           .attr("cx", d => xScale(d.Country) + xScale.bandwidth() / 2)
           .attr("cy", d => yRightScale(d.Infant_Mortality))
           .attr("r", 4)
           .style("fill", rightAxisColor);

       // Tooltip for Data Points
       const tooltip = d3.select("body").append("div")
           .attr("class", "tooltip")
           .style("opacity", 0);

       svg.selectAll(".point")
           .on("mouseover", function(event, d) {
               tooltip.transition().duration(200).style("opacity", .9);
               tooltip.html(`<strong>Country:</strong> ${d.Country}<br>
                             <strong>Life Expectancy:</strong> ${d.Life_Expectancy}<br>
                             <strong>Infant Mortality:</strong> ${d.Infant_Mortality}`)
                   .style("left", (event.pageX + 5) + "px")
                   .style("top", (event.pageY - 28) + "px");
           })
           .on("mouseout", function() {
               tooltip.transition().duration(500).style("opacity", 0);
           });
   });
}


 
