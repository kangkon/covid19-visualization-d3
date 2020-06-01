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
                tooltip.style("display", null)
            })
            .on('mouseleave', function () {
                tooltip.style("display", "none")
            })
            .on('mousemove', function(f) {
                const xPos = d3.mouse(this)[0];
                const yPos = d3.mouse(this)[1];
                tooltip.style("left", `${xPos}px`)
                    .style("top", `${yPos}px`)
                    .html(`<p><strong>${f.properties.DISTRICT}</strong></p>
                            <p><span>Confirmed</span>${f.Confirmed}</p>
                            <p><span>Active</span>${f.Active}</p>
                            <p><span>Recovered</span>${f.Recovered}</p>
                            <p><span>Deceased</span>${f.Deceased}</p>`)
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


        const tooltip = d3.select(".map-tooltip").style('display', 'none');

        //geojson.features.forEach(function(d, i) {
        //    var c = projection(d.geometry.coordinates)
            //console.log(c)
            //foci.push({x: c[0], y: c[1]});
            //labels.push({x: c[0], y: c[1], label: d.properties.name})
        //});

        drawLegend(status, colorScale)

    }, [width])

    const toggleStatus = useCallback((_st) => {
        setStatus(_st);
        updateMap(_st);
    })
    //console.log(covid_data_merged, status, "render=================================================")
    return (
        <div>
            <div className={"mt-3 d-flex justify-content-between"}>
                <div className={"header-buttons"}>
                    <button type="button" className={`btn ${status === 'Confirmed' ? "btn-primary" : "btn-default"}`} onClick={() => {toggleStatus('Confirmed')}}>Confirmed</button>
                    <button type="button" className={`btn ${status === 'Active' ? "btn-primary" : "btn-default"}`} onClick={() => {toggleStatus('Active')}}>Active</button>
                    <button type="button" className={`btn ${status === 'Recovered' ? "btn-primary" : "btn-default"}`} onClick={() => {toggleStatus('Recovered')}}>Recovered</button>
                    <button type="button" className={`btn ${status === 'Deceased' ? "btn-primary" : "btn-default"}`} onClick={() => {toggleStatus('Deceased')}}>Deceased</button>
                </div>
                <div>
                    <img src={"https://itechcom.net/static/media/now-logo.94cd8103.png"} style={{height: 50}}/>
                </div>
            </div>
            <div style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
                <div id={"mapbox"} style={{width, height}}>
                    <div className={"map-tooltip"}></div>
                    <svg width={width} height={height} />
                </div>
            </div>


            <div className={"map-title"}>
                <small style={{color: "#afafaf"}}>Move your mouse above any place to view results</small>
                <h4 style={{color: "#6f6f6f", margin: 0, padding: 0}}>COVID19 Cases Visualization in Assam</h4>
                <small>Itech Computer - service@itechcom.net</small>
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
