let dataLoaded = false;
let globalData = [];

// Load CSV data
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
            callback();
        }).catch(error => {
            console.error("Error loading data:", error);
        });
    } else {
        callback();
    }
}

// Tooltip functions with fade-in effect
function showTooltip(content, event) {
    d3.select(".tooltip")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px")
        .style("display", "inline-block")
        .style("opacity", 0)
        .transition()
        .duration(200)
        .style("opacity", 1)
        .html(content);
}

function hideTooltip() {
    d3.select(".tooltip")
        .transition()
        .duration(200)
        .style("opacity", 0)
        .on("end", () => d3.select(".tooltip").style("display", "none"));
}

// Define all chart creation functions here (createChoroplethMap, createBarChart, createScatterPlot, createLineChart, createDualAxisChart)
