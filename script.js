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
        const svg = d3.select("#mapChart").append("svg")
            .attr("width", width)
            .attr("height", height);

        const projection = d3.geoMercator().scale(140).translate([width / 2, height / 1.5]);
        const path = d3.geoPath().projection(projection);

        // Updated color scale for better color contrast
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
                .on("mouseover", function () {
                    d3.select(this).attr("stroke-width", 1.5).attr("stroke", "#333");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("stroke-width", 0.5).attr("stroke", "#555");
                    hideTooltip();
                })
                .on("mousemove", function (event, d) {
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
