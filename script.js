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

// Sidebar for displaying country details
function showCountryDetails(countryData) {
    const sidebar = d3.select(".sidebar");
    sidebar.html(`
        <h3>${countryData.Country}</h3>
        <p><strong>Gini Index:</strong> ${countryData.Gini_Index.toFixed(2)}</p>
        <p><strong>Life Expectancy:</strong> ${countryData.Life_Expectancy}</p>
        <p><strong>Infant Mortality:</strong> ${countryData.Infant_Mortality}</p>
    `);
}

// Choropleth Map
function createChoroplethMap() {
   loadData(() => {
     const width = 1760, height = 700;
     const svg = d3.select("#mapChart").append("svg").attr("width", width).attr("height", height);
     const projection = d3.geoMercator().scale(140).translate([width / 2, height / 1.5]);
     const path = d3.geoPath().projection(projection);
     const colorScale = d3.scaleSequential(d3.interpolateYlGnBu).domain([0.2, 0.5]);

     // Title and Subtitle
     svg.append("text")
        .attr("x", width / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Gini Index by Country (Income Inequality)");
     svg.append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "15px")
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
          .on("mouseover", function(event, d) {
            const countryData = globalData.find(c => c.Country === d.properties.name);
            if (countryData) {
              const tooltipContent = `<strong>Country:</strong> ${countryData.Country}<br>
                                      <strong>Gini Index:</strong> ${countryData.Gini_Index.toFixed(2)}<br>
                                      <strong>Life Expectancy:</strong> ${countryData.Life_Expectancy}<br>
                                      <strong>Infant Mortality:</strong> ${countryData.Infant_Mortality}`;
              showTooltip(tooltipContent, event);
            }
          })
          .on("mouseout", hideTooltip)
          .on("mousemove", function(event, d) {
            const countryData = globalData.find(c => c.Country === d.properties.name);
            if (countryData) {
              const tooltipContent = `<strong>Country:</strong> ${countryData.Country}<br>
                                      <strong>Gini Index:</strong> ${countryData.Gini_Index.toFixed(2)}<br>
                                      <strong>Life Expectancy:</strong> ${countryData.Life_Expectancy}<br>
                                      <strong>Infant Mortality:</strong> ${countryData.Infant_Mortality}`;
              showTooltip(tooltipContent, event);
            }
          })
          .on("click", function(event, d) {
            const countryData = globalData.find(c => c.Country === d.properties.name);
            if (countryData) {
              showCountryDetails(countryData);
            }
          });
     });
   });
}
