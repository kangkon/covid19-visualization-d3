import React, {useEffect, useState, useCallback} from "react"
import { withResizeDetector } from 'react-resize-detector';
import * as d3 from "d3";
import {Helmet} from "react-helmet";
//import slugify from 'slugify'
const MapComponent = ({width, covid_data, aggregated, geojson}) => {
    width = width - 100
    //const svgRef = useRef()
    const height = 450;
    const legendWidth = 200, legendHeight = 10;
    //const [selectedFeature, setSelected] = useState(null);

    const [status, setStatus] = useState('Confirmed')

    //const center_cord = [26.292008, 92.934619];
    //Map
    const projection =  d3.geoMercator().fitSize([width, height], geojson).precision(100);
    //const projection =  d3.geoAlbers().fitSize([width, height], selectedFeature || geojson).precision(100);
    //.center(center_cord).scale(10).translate([width/2, height/2]);

    const pathBuilder = d3.geoPath().projection(projection).pointRadius(2);

    const drawLegend = (_status, colorScale) => {
        //Redraw Legend
        const  extent = d3.extent(geojson.features, f => f[_status]);
        const ledgendScale = d3.scaleLinear()
            .range([0, legendWidth])
            .domain(extent);
        const legendTicks = d3.scaleLinear().domain(extent).ticks(6);
        const legendAxis = d3.axisBottom(ledgendScale)
            .tickSize(legendHeight)
            .tickValues([0, ...legendTicks, extent[1]]);

        d3.select('.legend').remove();

        const legend_g = d3.select("svg").append("g")
            .attr('class', 'legend')
            .attr("transform", `translate(15, ${height - 50})`);

        const defs = legend_g.append("defs");
        const linearGradient = defs.append("linearGradient").attr("id", "myGradient");
        linearGradient.selectAll("stop")
            .data([0, ...legendTicks])
            .enter().append("stop")
            .attr("offset", f => ((f - extent[0]) / (extent[1] - extent[0]) * 100) + "%")
            .attr("stop-color", f => colorScale(f));


        legend_g.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#myGradient)");

        legend_g.append("g")
            .call(legendAxis)
            .select(".domain").remove();
    }

    const updateMap = (_status) => {

        const min_val = d3.min(covid_data, d => d[_status]);
        const max_val = d3.max(covid_data, d => d[_status]);

        const colorScale = d3.scaleLinear().domain([min_val, max_val]).range(["#f7fcf5", "#E31A1C"]);
        //const colorScale = d3.scaleQuantize([min_val, max_val], d3.schemeReds[9])

        //const fontSizeScale = d3.scaleLinear().domain([min_val, max_val]).range([11, 22]);
        //const fontColorScale = d3.scaleLinear().domain([min_val, max_val]).range(["#08306b", "#08306b"]);

        d3.selectAll('.district')
            .transition()
            .duration(500)
            .attr("fill", feature => colorScale(feature[_status]));

        drawLegend(_status, colorScale);

    }

    useEffect(() => {
        d3.selectAll('svg').remove()
        const svg = d3.select("#mapbox").append("svg").attr('height', height).attr('width', width);

        const min_val = d3.min(covid_data, d => d[status]);
        const max_val = d3.max(covid_data, d => d[status]);

        const colorScale = d3.scaleLinear().domain([min_val, max_val]).range(["#f7fcf5", "#E31A1C"]);
        //const colorScale = d3.scaleQuantize([min_val, max_val], d3.schemeReds[9])

        const fontSizeScale = d3.scaleLinear().domain([min_val, max_val]).range([11, 22]);
        const fontColorScale = d3.scaleLinear().domain([min_val, max_val]).range(["#08306b", "#08306b"]);


        //console.log(covid_data.map(d => d.District).length)

        //const state_group = svg.append("g")

        /*
        .on("click", feature => {
            setSelected(selectedFeature === feature ? null : feature)
        })
        .transition()
        .duration(1000)
         */
        svg.selectAll('.district')
            .data(geojson.features)
            .join('path')
            .on('mouseenter', function () {
                toolTip.style("display", null)
            })
            .on('mouseleave', function () {
                toolTip.style("display", "none")
            })
            .on('mousemove', function(f) {
                let xPos = d3.mouse(this)[0] + 10;
                let yPos = d3.mouse(this)[1] + 10;
                //Check if exceed margin
                if(xPos + 150 > width - 100)
                    xPos = xPos - 150 - 20;

                if(yPos + 145 > height - 100)
                    yPos = yPos - 145 - 20;
                toolTip.attr("transform", `translate(${xPos}, ${yPos})`);
                district_line.text(`${f.properties.DISTRICT}`)
                confirmed_value.text(`${f.Confirmed}`);
                active_value.text(`${f.Active}`);
                recovered_value.text(`${f.Recovered}`);
                deceased_value.text(`${f.Deceased}`);
            })
            .attr("fill", "#f4f4f4")
            .transition()
            .duration(1000)
            .attr('class', 'district')
            .attr("fill", feature => colorScale(feature[status]))
            .attr("d", (feature) => {
                //console.log(feature)
                return pathBuilder({
                    ...feature,
                    fill: colorScale(feature[status])
                });
            })


        svg.append('g')
            .attr('class', 'place-labels')
            .selectAll('.place-label')
            .data(geojson.features)
            .join("text")
            .attr("class", "place-label")
            .attr("transform", function(f) { return "translate(" + pathBuilder.centroid(f) + ")"; })
            .text(f => f.properties.DISTRICT)
            .style("text-anchor", "middle")
            .attr('fill', f => fontColorScale(f[status]))
            //.attr('font-size', f => fontSizeScale(f[status]))


        drawLegend(status, colorScale)

        //Tooltip Start
        const toolTip = svg.append("g")
            .style("display", "none");
        const textBox = toolTip.append('rect')
                .attr('width', 150)
                .attr('height', 145)
                .attr("fill", '#fff')
                .style("fill-opacity", 0.8)
                .attr("stroke", "#afafaf")
                .attr("stroke-width", 2)
                .attr("rx", 8);

        const district_line = toolTip.append('text')
            .attr("x", 10)
            .attr("y", 25)
            .attr("text-anchor", "start")
            .style("font-weight", "bold");

        const line1 = toolTip.append('text')
            .attr("y", 50)
            .append('tspan')
            .attr("x", 10)
            .attr("text-anchor", "start")
            .text("Confirmed");


        const confirmed_value = line1.append('tspan')
            .attr("text-anchor", "end")
            .attr("x", 140);

        const line2 = toolTip.append('text')
            .attr("y", 75)
            .append('tspan')
            .attr("x", 10)
            .attr("text-anchor", "start")
            .text("Active");


        const active_value = line2.append('tspan')
            .attr("text-anchor", "end")
            .attr("x", 140);

        const line3 = toolTip.append('text')
            .attr("y", 100)
            .append('tspan')
            .attr("x", 10)
            .attr("text-anchor", "start")
            .text("Recovered");


        const recovered_value = line3.append('tspan')
            .attr("text-anchor", "end")
            .attr("x", 140);

        const line4 = toolTip.append('text')
            .attr("y", 125)
            .append('tspan')
            .attr("x", 10)
            .attr("text-anchor", "start")
            .text("Deceased");


        const deceased_value = line4.append('tspan')
            .attr("text-anchor", "end")
            .attr("x", 140);

        //Tooltip End




    }, [width])

    const toggleStatus = useCallback((_st) => {
        setStatus(_st);
        updateMap(_st);
    })
    //console.log(covid_data_merged, status, "render=================================================")
    return (
        <div>
            <div className={"mt-3 mb-1 d-flex justify-content-between align-items-top"}>
                <div className={"btn-group btn-group-sm header-buttons"} role="group" aria-label="header-buttons ">
                    <button type="button" className={`btn ${status === 'Confirmed' ? "btn-primary" : "btn-light"}`} onClick={() => {toggleStatus('Confirmed')}}>Confirmed</button>
                    <button type="button" className={`btn ${status === 'Active' ? "btn-primary" : "btn-light"}`} onClick={() => {toggleStatus('Active')}}>Active</button>
                    <button type="button" className={`btn ${status === 'Recovered' ? "btn-primary" : "btn-light"}`} onClick={() => {toggleStatus('Recovered')}}>Recovered</button>
                    <button type="button" className={`btn ${status === 'Deceased' ? "btn-primary" : "btn-light"}`} onClick={() => {toggleStatus('Deceased')}}>Deceased</button>
                </div>

                <div>
                    <div className={"btn-group btn-group-sm header-buttons"} role="group" aria-label="header-buttons ">
                        <a className={`btn btn-primary`} href={"/"}>Heatmap</a>
                        <a type="button" className={`btn btn-light`} href={"/bubble"}>Bubbles</a>
                    </div>
                </div>
            </div>
            <div style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
                <div id={"mapbox"} style={{width, height}}>
                    <svg width={width} height={height}></svg>
                </div>
            </div>


            <div className={"map-title d-flex align-items-center pt-3"}>
                <div style={{marginRight: 10}}>
                    <img src={"https://itechcom.net/static/media/now-logo.94cd8103.png"} style={{height: 60}}/>
                </div>
                <div>
                    <small style={{color: "#afafaf"}}>Move your mouse above any place to view results</small>
                    <h5 style={{color: "#6f6f6f", margin: 0, padding: 0}}>COVID19 Cases Visualization in Assam</h5>
                    <small>Itech Computer - service@itechcom.net</small>
                </div>
            </div>

            <div className={"right-card"}>
                <div className="card">
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item d-flex justify-content-between"><span>Confirmed</span><span>{aggregated.confirmed}</span></li>
                        <li className="list-group-item d-flex justify-content-between"><span>Active</span><span>{aggregated.active}</span></li>
                        <li className="list-group-item d-flex justify-content-between"><span>Recovered</span><span>{aggregated.recovered}</span></li>
                        <li className="list-group-item d-flex justify-content-between"><span>Deceased</span><span>{aggregated.deceased}</span></li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default withResizeDetector(({width}) => {
    const [covid_data, setCovidData] = useState(null);
    const [geojson, setGeoJson] = useState(null);

    useEffect(() => {
        fetch(process.env.MAP_URL).then(response => response.json())
            .then(geodata => {
                fetch('https://api.covid19india.org/state_district_wise.json').then(response => response.json())
                    .then(st_data => st_data.Assam.districtData)
                    .then(d => {
                        const d_array = Object.keys(d).map(k => ({District: k, Confirmed: d[k].confirmed, Recovered: d[k].recovered, Active: d[k].active, Deceased: d[k].deceased, delta: d[k].delta}))
                        let covid_data_merged = {};

                        let recovered = 0, confirmed = 0, active = 0, deceased = 0;
                        d_array.forEach(c => {
                            recovered = recovered + Number(c.Recovered);
                            confirmed = confirmed + Number(c.Confirmed);
                            active = active + Number(c.Active);
                            deceased = deceased + Number(c.Deceased);
                            covid_data_merged[c.District] = c;
                        });

                        //console.log(d_array, covid_data_merged)

                        const features = geodata.features.map(f => {
                            //console.log(covid_data_merged[f.properties.DISTRICT], f.properties.DISTRICT)
                            return {
                                ...f,
                                Confirmed: covid_data_merged[f.properties.DISTRICT]["Confirmed"],
                                Active: covid_data_merged[f.properties.DISTRICT]["Active"],
                                Recovered: covid_data_merged[f.properties.DISTRICT]["Recovered"],
                                Deceased: covid_data_merged[f.properties.DISTRICT]["Deceased"]

                            }
                        });

                        setGeoJson({type: geodata.type, features});
                        setCovidData({data: d_array, confirmed, recovered, deceased, active});
                    })

            })

    }, [])


  return (
      <>
          <Helmet>
              <title>Covid19 Cases Visualization - Assam</title>
              {
                  /*
                  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous"/>
                  */
              }

          </Helmet>
          <div className={"container-fluid"}>
              {
                  width && geojson && covid_data ?
                      <MapComponent
                          covid_data={covid_data.data}
                          aggregated={{
                              confirmed: covid_data.confirmed,
                              active: covid_data.active,
                              recovered: covid_data.recovered,
                              deceased: covid_data.deceased
                          }}
                          geojson={geojson}
                          width={800}/>
                      : <div style={{textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                          <div>
                              <div className="spinner-grow text-success" role="status">
                                  <span className="sr-only">Loading Map, please wait...</span>
                              </div>
                              <div>Loading Map, please wait...<br/><span style={{color: '#afafaf'}}>Itech Computer</span></div>
                          </div>
                      </div>
              }

          </div>
      </>
  )
})
