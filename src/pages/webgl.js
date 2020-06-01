import React, {useEffect, useState, useRef} from "react"
import { withResizeDetector } from 'react-resize-detector';
import * as d3 from "d3";

export default withResizeDetector(({width}) => {
    const svgRef = useRef()
    const height = 600
    const [covid_data, setCovidData] = useState(null);
    const [geojson, setGeoJson] = useState(null)
    const [selectedFeature, setSelected] = useState(null)

    useEffect(() => {
        fetch('http://localhost:8000/data/data.json').then(response => response.json())
            .then(d => {
                setCovidData(d)
            })
    }, [])

    useEffect(() => {
        fetch('http://localhost:8000/map/assam.json').then(response => response.json())
            .then(data => {
                setGeoJson(data)
            })
    }, [])
    useEffect(() => {
        if(geojson && covid_data) {
            const center_cord = [26.292008, 92.934619];
            const svg = d3.select("svg");


            //Map
            const projection = d3.geoMercator().fitSize([width, height], selectedFeature || geojson).precision(100);
            //.center(center_cord).scale(10).translate([width/2, height/2]);

            const min_val = d3.min(covid_data, d => d.Confirmed);
            const max_val = d3.max(covid_data, d => d.Confirmed);

            const colorScale = d3.scaleLinear().domain([min_val, max_val]).range(["#efefef", "#800026"]);
            //const colorScale = d3.scaleQuantize([min_val, max_val], d3.schemeReds[9])

            //console.log(min_val, max_val)
            let covid_data_merged = {};
            covid_data.forEach(d => {
                switch (d.District) {
                    //case 'Biswanath':
                    //covid_data_merged["Sonitpur"] = covid_data_merged["Sonitpur"] ? covid_data_merged["Sonitpur"].Confirmed + d.Confirmed : ;
                    default:
                        covid_data_merged[d.District] = d.Confirmed;
                }
            })
            //console.log(covid_data.map(d => d.District).length)


            const pathBuilder = d3.geoPath().projection(projection);
            console.log(colorScale(covid_data_merged["Kamrup Metro"]))
            //console.log(data.features.map(d => d.properties.DISTRICT).length)

            /*
            svg.selectAll('.district')

                .data(geojson.features)
                .join('path')
                //.enter()
                //.append('path')
                .on("click", feature => {
                    setSelected(selectedFeature === feature ? null : feature)
                })
                .attr("class", "district")
                .transition()
                .duration(1000)
                .attr("fill", feature => colorScale(covid_data_merged[feature.properties.DISTRICT]))
                .attr("d", (feature) => {
                    //console.log(feature)
                    return pathBuilder({
                        ...feature,
                        fill: colorScale(covid_data_merged[feature.properties.DISTRICT])
                    });
                })
        */
            // Set tooltip
            /*
        const tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(feature => {
                    return "<strong>Country: </strong><span class='details'>" + feature.properties.DISTRICT + "<br></span>" + "<strong>Confirmed: </strong><span class='details'>" + covid_data_merged[feature.properties.DISTRICT] +"</span>";
                })

         */

            const state_group = svg.append("g")
                .attr("class", "state")
                .selectAll("g")
                .data(geojson.features)
                .enter();

            const district = state_group.append('g')
                .attr('class', 'district');

            district.append("path")
                .attr("fill", feature => colorScale(covid_data_merged[feature.properties.DISTRICT]))
                .style('stroke', 'white')
                .style('stroke-width', 1)
                .style("opacity",0.8)
                .attr("d", (feature) => {
                    //console.log(feature)
                    return pathBuilder({
                        ...feature,
                        fill: colorScale(covid_data_merged[feature.properties.DISTRICT])
                    });
                });

            //TODO: position Label
            district.append('text')
                .text(feature => feature.properties.DISTRICT)



        }


    }, [geojson, covid_data, selectedFeature])
    return (
        <div>
            <div style={{position: 'absolute'}}>
                <h1>Covid19 Visualization</h1>
            </div>
            <div style={{width: '100%'}}>
                <svg ref={svgRef} width={width} height={height} />
            </div>

        </div>
    )
})
