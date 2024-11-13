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
   loadData(() => { //Load data to build the map
     const width = 1920, height = 650;
     const svg = d3.select("#mapChart").append("svg").attr("width", width).attr("height", height); //Append an SVG element
     const projection = d3.geoMercator().scale(140).translate([width / 2, height / 1.5]);
     const path = d3.geoPath().projection(projection); //Adjust how the map is displayed
     // Updated color scale for better color contrast
     const colorScale = d3.scaleSequential(d3.interpolateYlGnBu).domain([0.2, 0.5]); //Define a color scale that maps data values to color for the map
    
     // World map data
     d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(world => {
       svg.selectAll("path")
          .data(world.features)
          .enter().append("path")
          .attr("d", path)
          .attr("fill", d => { //Fill color based on GI value
            const countryData = globalData.find(c => c.Country === d.properties.name); // Find data based on country name
            return countryData ? colorScale(countryData.Gini_Index) : "#e0e0e0"; // If country data exist, the color shown
          })
          .attr("stroke", "#555") // Set stroke color and width 
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
   });
 }
 

// Bar Chart
function createBarChart() {
   // Load data and then proceed with chart creation once data is available
   loadData(() => {
     // Set the width, height, and margins for the chart
     const width = 1850, height = 700;
     const margin = { top: 50, right: 90, bottom: 180, left: 300 };
 
     // Append an SVG element to the DOM within the #barChart div and set its dimensions
     const svg = d3.select("#barChart").append("svg")
                   .attr("width", width)
                   .attr("height", height);
 
     // Sort data by Life Expectancy in descending order for a more readable bar chart
     globalData.sort((a, b) => b.Life_Expectancy - a.Life_Expectancy);
 
     // Define the x-scale as a band scale based on the country names, setting range and padding
     const x = d3.scaleBand()
                 .domain(globalData.map(d => d.Country)) // Each country as a distinct band
                 .range([margin.left, width - margin.right]) // Fit within the chart width
                 .padding(0.2); // Add padding between bars
 
     // Define the y-scale as a linear scale based on Life Expectancy values, setting range and limits
     const y = d3.scaleLinear()
                 .domain([0, d3.max(globalData, d => d.Life_Expectancy) + 5]) // Set domain with extra padding
                 .nice() // Adjust to round values for easier reading
                 .range([height - margin.bottom, margin.top]); // Invert to have 0 at the bottom
 
     // Define a color scale for the bars based on the Gini Index, using a blue color gradient
     const colorScale = d3.scaleSequential(d3.interpolateBlues)
                          .domain([0.2, 0.5]);
 
     // Draw bars
     svg.selectAll("rect")
        .data(globalData) // Bind data to rectangles
        .enter().append("rect") // Create a rectangle for each data item
        .attr("x", d => x(d.Country)) // Position bars according to x-scale
        .attr("y", d => y(d.Life_Expectancy)) // Set bar height based on y-scale
        .attr("width", x.bandwidth()) // Set bar width to match the band width
        .attr("height", d => height - margin.bottom - y(d.Life_Expectancy)) // Calculate height based on data
        .attr("fill", d => colorScale(d.Gini_Index)) // Color based on Gini Index
        .on("mousemove", (event, d) => { // Show tooltip on mouse move
          const tooltipContent = `<strong>Country:</strong> ${d.Country}<br>
                                  <strong>Gini Index:</strong> ${d.Gini_Index}<br>
                                  <strong>Life Expectancy:</strong> ${d.Life_Expectancy}<br>
                                  <strong>Infant Mortality:</strong> ${d.Infant_Mortality}`;
          showTooltip(tooltipContent, event); // Show tooltip with relevant data
        })
        .on("mouseout", hideTooltip); // Hide tooltip when the mouse leaves the bar
 
     // Add value labels above each bar showing Life Expectancy
     svg.selectAll(".label")
        .data(globalData)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(d.Country) + x.bandwidth() / 2) // Center label on each bar
        .attr("y", d => y(d.Life_Expectancy) - 10) // Position label slightly above each bar
        .attr("text-anchor", "middle") // Center-align text
        .style("font-size", "15px")
        .style("fill", "#333")
        .text(d => d.Life_Expectancy.toFixed(1)); // Display Life Expectancy rounded to 1 decimal
 
     // Draw the x-axis at the bottom of the chart
     svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`) // Position at the bottom
        .call(d3.axisBottom(x).tickSizeOuter(0)) // Create axis based on x-scale
        .selectAll("text")
        .attr("transform", "rotate(-45)") // Rotate labels for readability
        .attr("dy", "0.75em") // Adjust vertical alignment
        .attr("dx", "-0.75em") // Adjust horizontal alignment
        .style("text-anchor", "end") // Align text at the end
        .style("font-size", "13px"); // Font size for x-axis labels
 
     // Draw the y-axis on the left of the chart
     svg.append("g")
        .attr("transform", `translate(${margin.left},0)`) // Position on the left
        .call(d3.axisLeft(y).ticks(5)) // Create axis based on y-scale with 5 ticks
        .selectAll("text")
        .style("font-size", "10px"); // Font size for y-axis labels
 
     // Add a label for the y-axis to indicate what the values represent
     svg.append("text")
        .attr("class", "axis-label")
        .attr("x", -height / 2.5) // Center along y-axis
        .attr("y", 250) // Position slightly left
        .attr("transform", "rotate(-90)") // Rotate text for vertical orientation
        .attr("text-anchor", "middle") // Center text alignment
        .style("font-size", "20px")
        .style("fill", "#333")
        .text("Life Expectancy (Years)"); // Label text
 
     // Add a label for the x-axis to indicate the countries represented
     svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2) // Center along x-axis
        .attr("y", height - 70) // Position slightly above the bottom margin
        .attr("text-anchor", "middle") // Center text alignment
        .style("font-size", "20px")
        .style("fill", "#333")
        .text("Country"); // Label text for x-axis
   });
 }
 

 function createScatterPlot() {
   // Load data and then proceed with chart creation once data is available
   loadData(() => {
     // Set the width, height, and margins for the scatter plot
     const width = 1700, height = 600, margin = { top: 50, right: 100, bottom: 70, left: 300 };
 
     // Append an SVG element to the DOM within the #scatterPlot div and set its dimensions
     const svg = d3.select("#scatterPlot").append("svg")
                   .attr("width", width)
                   .attr("height", height);
 
     // Define x-scale as a linear scale for the Gini Index range
     const x = d3.scaleLinear().domain([0.2, 0.5]).range([margin.left, width - margin.right]);
 
     // Define y-scale as a linear scale for Life Expectancy range
     const y = d3.scaleLinear().domain([70, 90]).range([height - margin.bottom, margin.top]);
 
     // Define a size scale for the circles based on Infant Mortality, with a range of circle radii
     const sizeScale = d3.scaleSqrt().domain([0, 10]).range([3, 15]);
 
     // Define a color scale for Infant Mortality, using Plasma color scheme for good contrast
     const colorScale = d3.scaleSequential(d3.interpolatePlasma)
                          .domain(d3.extent(globalData, d => d.Infant_Mortality));
 
     // Plotting circles
     svg.selectAll("circle")
        .data(globalData) // Bind data to circles
        .enter().append("circle") // Append a circle for each data item
        .attr("cx", d => x(d.Gini_Index)) // Position circles based on x-scale (Gini Index)
        .attr("cy", d => y(d.Life_Expectancy)) // Position circles based on y-scale (Life Expectancy)
        .attr("r", d => sizeScale(d.Infant_Mortality)) // Set radius based on Infant Mortality
        .attr("fill", d => colorScale(d.Infant_Mortality)) // Color based on Infant Mortality
        .attr("opacity", 0.85) // Set opacity for better visualization
        
        // Tooltip on mouse move
        .on("mousemove", (event, d) => {
          const tooltipContent = `<strong>Country:</strong> ${d.Country}<br>
                                  <strong>Gini Index:</strong> ${d.Gini_Index}<br>
                                  <strong>Life Expectancy:</strong> ${d.Life_Expectancy}<br>
                                  <strong>Infant Mortality:</strong> ${d.Infant_Mortality}`;
          showTooltip(tooltipContent, event); // Show tooltip with relevant data
        })
        
        // Hide tooltip on mouse out
        .on("mouseout", hideTooltip);
 
     // Draw x-axis
     svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`) // Position at the bottom of the chart
        .call(d3.axisBottom(x).tickFormat(d3.format(".2f"))) // Create axis with two decimal places for labels
        .selectAll("text")
        .style("font-size", "13px"); // Font size for x-axis labels
 
     // X-axis label
     svg.append("text")
        .attr("x", width / 1.7) // Position horizontally near the center
        .attr("y", height - margin.bottom / 5.5) // Position slightly below the x-axis
        .attr("text-anchor", "middle") // Center text alignment
        .style("font-size", "20px")
        .text("Gini Index"); // Label text for x-axis
 
     // Draw y-axis
     svg.append("g")
        .attr("transform", `translate(${margin.left},0)`) // Position on the left side of the chart
        .call(d3.axisLeft(y)) // Create y-axis based on y-scale
        .selectAll("text")
        .style("font-size", "13px"); // Font size for y-axis labels
 
     // Y-axis label
     svg.append("text")
        .attr("transform", "rotate(-90)") // Rotate text for vertical orientation
        .attr("y", margin.left / 1.1) // Position near y-axis
        .attr("x", -height / 2) // Center along y-axis
        .attr("dy", "-1.5em") // Adjust vertical position slightly
        .attr("text-anchor", "middle") // Center text alignment
        .style("font-size", "20px")
        .text("Life Expectancy"); // Label text for y-axis
 
     // Legend for Infant Mortality with color scale
     const legend = svg.append("g")
                       .attr("transform", `translate(${width - margin.right - 30}, ${margin.top})`); // Position legend
 
     // Draw color boxes for each tick in the color scale
     legend.selectAll("rect")
           .data(colorScale.ticks(5).slice(1)) // Get a range of values from the color scale for the legend
           .enter().append("rect")
           .attr("y", (d, i) => i * 20) // Position each color box vertically
           .attr("width", 15) // Set width for each box
           .attr("height", 15) // Set height for each box
           .style("fill", colorScale); // Fill color according to the scale
 
     // Add labels for each color box indicating Infant Mortality values
     legend.selectAll("text")
           .data(colorScale.ticks(5).slice(1)) // Use the same values as the color boxes
           .enter().append("text")
           .attr("x", 20) // Position label to the right of the color box
           .attr("y", (d, i) => i * 20 + 12) // Align vertically with color boxes
           .text(d => d.toFixed(1)) // Display value with one decimal place
           .style("font-size", "15px"); // Font size for legend text
   });
 }
 


// Line Chart
function createLineChart() {
   // Load data and then proceed with chart creation once data is available
   loadData(() => {
     // Set the width, height, and margins for the line chart
     const width = 1570, height = 700, margin = { top: 60, right: 30, bottom: 180, left: 360 };
 
     // Append an SVG element to the DOM within the #lineChart div and set its dimensions
     const svg = d3.select("#lineChart").append("svg")
                   .attr("width", width)
                   .attr("height", height);
 
     // Define x-scale as a point scale based on country names with padding
     const x = d3.scalePoint()
                 .domain(globalData.map(d => d.Country)) // Set each country as a point on the x-axis
                 .range([margin.left, width - margin.right]) // Fit within the chart width
                 .padding(0.5); // Add padding between points
 
     // Define y-scale as a linear scale for Infant Mortality, setting range and limits
     const y = d3.scaleLinear()
                 .domain([0, d3.max(globalData, d => d.Infant_Mortality) + 1]) // Set domain with extra padding
                 .nice() // Adjust to round values for easier reading
                 .range([height - margin.bottom, margin.top]); // Invert to have 0 at the bottom
 
     // Draw x-axis at the bottom of the chart with rotated text labels
     svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`) // Position at the bottom
        .call(d3.axisBottom(x)) // Create axis based on x-scale
        .selectAll("text")
        .attr("transform", "rotate(-45)") // Rotate labels for readability
        .style("text-anchor", "end") // Align text at the end
        .style("font-size", "13px"); // Font size for x-axis labels
 
     // Draw y-axis on the left side of the chart
     svg.append("g")
        .attr("transform", `translate(${margin.left},0)`) // Position on the left
        .call(d3.axisLeft(y)) // Create axis based on y-scale
        .style("font-size", "15px"); // Font size for y-axis labels
 
     // Add horizontal gridlines for better readability of values
     svg.append("g")
        .attr("class", "grid") // Add CSS class for styling
        .attr("transform", `translate(${margin.left},0)`) // Position gridlines
        .call(d3.axisLeft(y).ticks(5).tickSize(-width + margin.left + margin.right).tickFormat("")); // Draw gridlines
 
     // Define a line generator to create the line path based on country (x) and Infant Mortality (y)
     const line = d3.line()
                    .x(d => x(d.Country)) // Position based on x-scale
                    .y(d => y(d.Infant_Mortality)); // Position based on y-scale
 
     // Draw the line path on the SVG
     svg.append("path")
        .datum(globalData) // Bind data to the line
        .attr("fill", "none") // No fill, only a line
        .attr("stroke", "steelblue") // Line color
        .attr("stroke-width", 2) // Line thickness
        .attr("d", line); // Define path using line generator
 
     // Plot data points as circles on the line
     svg.selectAll("circle")
        .data(globalData) // Bind data to circles
        .enter().append("circle") // Append a circle for each data item
        .attr("cx", d => x(d.Country)) // Position based on x-scale
        .attr("cy", d => y(d.Infant_Mortality)) // Position based on y-scale
        .attr("r", 4) // Set radius of each circle
        .attr("fill", "black") // Circle color
 
        // Tooltip on mouse move
        .on("mousemove", (event, d) => {
          const tooltipContent = `<strong>Country:</strong> ${d.Country}<br>
                                  <strong>Infant Mortality:</strong> ${d.Infant_Mortality}`;
          showTooltip(tooltipContent, event); // Show tooltip with relevant data
        })
        
        // Hide tooltip on mouse out
        .on("mouseout", hideTooltip);
 
     // Add x-axis label for country
     svg.append("text")
        .attr("x", width / 1.6) // Position near the center of the x-axis
        .attr("y", height - 70) // Position slightly above the bottom margin
        .attr("text-anchor", "middle") // Center text alignment
        .style("font-size", "20px")
        .text("Country"); // Label text for x-axis
 
     // Add y-axis label for Infant Mortality
     svg.append("text")
        .attr("x", -height / 2.5) // Center along y-axis
        .attr("y", 300) // Position to the left of y-axis
        .attr("text-anchor", "middle") // Center text alignment
        .attr("transform", "rotate(-90)") // Rotate text for vertical orientation
        .style("font-size", "18px")
        .text("Infant Mortality (per 1000 live births)"); // Label text for y-axis
   });
 }
 

  // Dual-Axis Chart for Life Expectancy and Infant Mortality
  function createDualAxisChart() {
   loadData(() => {
       // Define margins
       const margin = { top: 50, right: 70, bottom: 180, left: 280 };
       const width = 1700 - margin.left - margin.right;
       const height = 700 - margin.top - margin.bottom;

       // Create SVG container and apply margins
       const svg = d3.select("#mapChart") // Make sure this ID matches the HTML div
           .append("svg")
           .attr("width", width + margin.left + margin.right)
           .attr("height", height + margin.top + margin.bottom)
           .append("g")
           .attr("transform", `translate(${margin.left},${margin.top})`);

       // Axis Colors
       const leftAxisColor = "#1f77b4";  // Blue for Life Expectancy
       const rightAxisColor = "#d62728"; // Red for Infant Mortality

       // X-axis
       const xScale = d3.scaleBand()
           .range([0, width])
           .padding(0.1);

       // Y-axes
       const yLeftScale = d3.scaleLinear().range([height, 0]);
       const yRightScale = d3.scaleLinear().range([height, 0]);

       // Load Data
       xScale.domain(globalData.map(d => d.Country));
       yLeftScale.domain([70, 90]); // Life Expectancy scale
       yRightScale.domain([0, 10]); // Infant Mortality scale

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


 
