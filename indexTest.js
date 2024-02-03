//Mapbox Map
mapboxgl.accessToken = 'pk.eyJ1IjoiZHNlbiIsImEiOiJjbG9ldTJnbGcwbDZjMnNyd3JjY29nbnZoIn0.Cyef_5fl6quIZuBhYqXQWg';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [0, 0],
    zoom: 2
});

document.getElementById('csvFile').addEventListener('change', handleCSVUpload);

var layerList = document.getElementById('layerList');
var legend = document.getElementById('legend');

var speedometer = document.getElementById('speedometer');
var pointer = document.getElementById('pointer');

var videoInput = document.getElementById('videoInput');
var videoContainer = document.getElementById('videoContainer');
var videoElement = document.getElementById('mapVideo');
var videoSource = document.getElementById('videoSource');
//var speedometer = document.getElementById('speedometer');
var speedControl = document.getElementById('speedControl');
var speedDisplay = document.getElementById('speedDisplay');

// Position the chart container on the top-right corner of the map
const chartContainer = document.getElementById('chart-container');
chartContainer.style.position = 'absolute';
chartContainer.style.top = '10px'; // Adjust top position as needed
chartContainer.style.right = '5px'; // Adjust right position as needed
chartContainer.style.zIndex = '1000'; // Ensure the container is above the map



var canvas = document.getElementById('combinedCanvas');
var mapContainer = document.getElementById('map');
var legendContainer = document.getElementById('legend');

const layers = {}
var csvfile;
var videofile;
var pointGeoJSON;

//Upload function for csv-File
function handleCSVUpload(event) {
    csvfile = event.target.files[0];
    const reader = new FileReader();
    

    // Zeige die Layer-Checkboxen an, wenn Dateien hochgeladen wurden
    layerList.style.display = 'block';

    reader.onload = () => {
        const csv = reader.result;
        pointGeoJSON = csvToPointGeoJSON(csv);
        const lineGeoJSON = csvToLineGeoJSON(csv);
        temperatureLayer(pointGeoJSON);
        distanceLayer(pointGeoJSON);
        //speedLayer(pointGeoJSON);
        //addGradientLineLayerToMap(lineGeoJSON);
        //addCombinedPmPieChart(pointGeoJSON);
        accelerationLayer(pointGeoJSON)
        animatePointLayer(pointGeoJSON, lineGeoJSON)
    };

    if (csvfile) {
        reader.readAsText(csvfile);
    }
}



  



//Video-upload
function handleFileChange() {

    // Check if a file is selected
    if (videoInput.files.length > 0) {
        videofile = videoInput.files[0];

        // Show the video container
        videoContainer.style.display = 'block';

        // Set the video source
        videoSource.src = URL.createObjectURL(videofile);

        // Reset the video element to apply the new source
        videoElement.load();
    } else {
        // Hide the video container if no file is selected
        videoContainer.style.display = 'none';
    }

    
}


function changePlaybackSpeed() {
    const selectedSpeed = speedControl.value;

    // Set the playback speed of the video
    videoElement.playbackRate = parseFloat(selectedSpeed);

    // Update the displayed speed value
    speedDisplay.textContent = selectedSpeed + 'x';
}






//Create Geojson with point-features
function csvToPointGeoJSON(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const features = [];

    let latitudeIndex = -1;
    let longitudeIndex = -1;

    // Find latitude and longitude columns based on keywords
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase().trim();
        if (header.includes('latitude')) {
            latitudeIndex = i;
        } else if (header.includes('longitude')) {
            longitudeIndex = i;
        }
    }

    if (latitudeIndex !== -1 && longitudeIndex !== -1) {
        for (let i = 1; i < lines.length; i++) {
            //for (let i = 1; i < 2; i++) {
            const currentLine = lines[i].split(',');
            const latitude = parseFloat(currentLine[latitudeIndex]);
            const longitude = parseFloat(currentLine[longitudeIndex]);

            if (!isNaN(latitude) && !isNaN(longitude)) {
                const coordinates = [longitude, latitude];

                const feature = {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Point',
                        coordinates: coordinates
                    }
                };

                // Assign properties to the GeoJSON feature
                for (let j = 0; j < headers.length; j++) {
                    if (!isNaN(parseFloat(currentLine[j])) && headers[j].trim() !== '') {
                        feature.properties[headers[j].trim()] = parseFloat(currentLine[j]);
                    }
                }

                features.push(feature);
            }
        }
    }

    return {
        type: 'FeatureCollection',
        features: features
    };
}


//Create Geojson with line-features
function csvToLineGeoJSON(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const features = [];
    const coordinates = [];

    let latitudeIndex = -1;
    let longitudeIndex = -1;

    // Find latitude and longitude columns based on keywords
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase().trim();
        if (header.includes('latitude')) {
            latitudeIndex = i;
        } else if (header.includes('longitude')) {
            longitudeIndex = i;
        }
    }

    if (latitudeIndex !== -1 && longitudeIndex !== -1) {
        for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i].split(',');
            const latitude = parseFloat(currentLine[latitudeIndex]);
            const longitude = parseFloat(currentLine[longitudeIndex]);

            if (!isNaN(latitude) && !isNaN(longitude)) {
                coordinates.push([longitude, latitude])

                const feature = {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates
                    }
                };

                // Assign properties to the GeoJSON feature
                for (let j = 0; j < headers.length; j++) {
                    if (!isNaN(parseFloat(currentLine[j])) && headers[j].trim() !== '') {
                        feature.properties[headers[j].trim()] = parseFloat(currentLine[j]);
                    }
                }

                features.push(feature);
            }
        }
    }

    return {
        type: 'FeatureCollection',
        features: features
    };
}


function zoomLayer(layer) {
    const bounds = turf.bbox(layer);
    map.fitBounds(bounds, {
        padding: 10, // Adjust padding as needed
        maxZoom: 18 // Set maximum zoom level if necessary
    });
}


function addLayerCheckbox(layerId) {

    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.className = 'layer-checkbox';
    checkbox.id = layerId;
    checkbox.addEventListener('change', function (e) {
        const visibility = e.target.checked ? 'visible' : 'none';
        map.setLayoutProperty(layerId, 'visibility', visibility);

        // Toggle the legend display based on checkbox state
        //legend.style.display = e.target.checked ? 'block' : 'none';
    });

    const label = document.createElement('label');
    label.htmlFor = layerId;
    label.textContent = layerId;

    layerItem.appendChild(checkbox);
    layerItem.appendChild(label);
    layerList.appendChild(layerItem);

}


function createLegend(data) {
    const legend = document.createElement('div');
    legend.id = 'legend';
    legend.className = 'legend';
    legend.style.display = 'none'; // Initially hide the legend


    // Create legend items based on temperature ranges
    data.forEach(range => {
        const item = document.createElement('div');
        item.className = 'legend-item';

        const colorCircle = document.createElement('div');
        colorCircle.className = 'legend-color-circle';
        colorCircle.style.backgroundColor = range.color;

        const label = document.createElement('span');
        label.textContent = 'max.' + range.maxTemp.toFixed(1) + '°C'; // Show temperature value

        
        item.appendChild(colorCircle);
        item.appendChild(label);
        legend.appendChild(item);

        showLegend();
    });

    // Append the legend to the layer list container
    layerList.appendChild(legend);
}


function showLegend() {
    if (legend) {
        legend.style.display = 'block'; // Show the legend
    }
}



function temperatureLayer(pointLayer) {
    map.addSource('temperature', {
        type: 'geojson',
        data: pointLayer
    });

    const temperatureRanges = [-100, 0, 100];

    // Add a single layer with combined properties and filter for all temperature ranges
    map.addLayer({
        id: 'temperatureLayer',
        type: 'circle',
        source: 'temperature',
        paint: {
            'circle-radius': 5,
            'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'temperature'],
                temperatureRanges[0], 'blue',
                0, 'white',
                temperatureRanges[2], 'red'
            ],
            'circle-opacity': 0.7
        },
        layout: {
            visibility: 'visible'
        }
    });

    //createLegend(temperatureRanges);
    addLayerCheckbox('temperatureLayer');
    zoomLayer(pointLayer);

}




function distanceLayer(pointLayer) {
    map.addSource('distance', {
        type: 'geojson',
        data: pointLayer
    });

    map.loadImage('abstand.png', (error, image) => {
        if (error) throw error;

        map.addImage('distance-icon', image);

    // Add a single layer with combined properties and filter for all temperature ranges
    map.addLayer({
        id: 'distanceLayer',
        type: 'symbol',
        source: 'distance',
        
        layout: {
            'icon-image': 'distance-icon',
            'icon-size': 0.03,
        },
        filter: ['<', ['get', 'distance_l'], 200]
    })
});

    addLayerCheckbox('distanceLayer');
    zoomLayer(pointLayer);

}

/*
function speedLayer(){
    
    map.loadImage('tachometer.jpg', (error, image) => {
        if (error) throw error;
    
        map.addImage('speedometer', image);

        map.addSource('speedometer-source', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [0, 0], // Adjust the coordinates as needed
                        },
                    },
                ],
            },
        });
    
        // Add a layer for the speedometer symbol
        map.addLayer({
            id: 'speedometer',
            type: 'symbol',
            layout: {
                'icon-image': 'speedometer',
                'icon-size': 0.1, // Adjust the size as needed
                'icon-allow-overlap': true,
            },
            paint: {},
            // Adjust the coordinates to position the speedometer on the right corner
            // You may need to experiment with the values based on your map size
            
        });
    });
}

*/

function accelerationLayer(pointLayer) {
    map.addSource('hotspot', {
        type: 'geojson',
        data: pointLayer // Replace with your GeoJSON file URL
    });


    map.addLayer({
        id: 'hotspot',
        source: 'hotspot',
        type: 'heatmap',
        paint: {
            // Increase the heatmap weight based on frequency and property magnitude
            'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'acceleration_z'], // You can use 'acceleration_x', 'acceleration_y', or any other acceleration property
                0, 0, // Minimum value
                20, 1  // Maximum value
            ],

            // Increase the heatmap color weight weight by zoom level
            // heatmap-intensity is a multiplier on top of heatmap-weight
            'heatmap-intensity': {
                stops: [
                    [0, 1],
                    [9, 3],
                ],
            },
            // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
            // Begin color ramp at 0-stop with a 0-transparency color
            // to create a blur-like effect.
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(33,102,172,0)',
                5,
                'rgb(103,169,207)',
                10,
                'rgb(209,229,240)',
                15,
                'rgb(253,219,199)',
                20,
                'rgb(239,138,98)'
            ],
            // Adjust the heatmap radius by zoom level
            'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                2,
                9,
                20
            ],
            // Transition from heatmap to circle layer by zoom level
            'heatmap-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7,
                1,
                9,
                0
            ]
        },
        layout: {
            visibility: 'visible'
        }
    });


    map.addLayer(
        {
            'id': 'accelerationLayer',
            'type': 'circle',
            'source': 'hotspot',
            'minzoom': 7,
            'paint': {
                // Size circle radius by earthquake magnitude and zoom level
                'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    7,
                    ['interpolate', ['linear'], ['get', 'acceleration_z'], 0, 1, 10, 20],
                    16,
                    ['interpolate', ['linear'], ['get', 'acceleration_z'], 0, 5, 30, 50]
                ],
                // Color circle by earthquake magnitude
                'circle-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'acceleration_z'],
                    0,
                    'rgba(33,102,172,0)',
                    5,
                    'rgb(103,169,207)',
                    10,
                    'rgb(209,229,240)',
                    15,
                    'rgb(253,219,199)',
                    20,
                    'rgb(239,138,98)',
                ],
                'circle-stroke-color': 'white',
                'circle-stroke-width': 1,
                // Transition from heatmap to circle layer by zoom level
                'circle-opacity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    7,
                    0,
                    8,
                    1
                ]
            }
        },
    );

    //createLegend(heatmapColor);
    addLayerCheckbox('accelerationLayer');
    zoomLayer(pointLayer);
}

//Combined pie chart
function createCombinedPieChart(pm1Total, pm2_5Total, pm4Total, pm10Total, pointLayer) {
    const data = [pm1Total, pm2_5Total, pm4Total, pm10Total];
    const total = data.reduce((acc, val) => acc + val, 0);
    const percentages = data.map(value => ((value / total) * 100).toFixed(2));

    const averageValues = data.map((value, index) => (value / pointLayer.features.length).toFixed(2));
    const pmTypes = ['PM1', 'PM2_5', 'PM4', 'PM10'];

    const radius = 100;
    const svg = d3.select('#chart-container')
        .append('svg')
        .attr('width', radius * 3)
        .attr('height', radius * 3)
        .append('g')
        .attr('transform', `translate(${radius},${radius})`);

    const color = d3.scaleOrdinal(['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']);

    const pie = d3.pie().value(d => d)(percentages);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    svg.selectAll('path')
        .data(pie)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

    // Add labels for PM types with average values
    svg.selectAll('text')
        .data(averageValues)
        .enter()
        .append('text')
        .attr('transform', (d, i) => {
            const angle = (i * 90 + 45) * Math.PI / 180;
            const x = Math.cos(angle) * (radius * 0.8);
            const y = Math.sin(angle) * (radius * 0.8);
            return `translate(${x},${y})`;
        })
        .attr('dominant-baseline', 'initial')
        .style('font-size', '10px')
        .style('fill', '#333') // Adjust text color
        .text((d, i) => `${pmTypes[i]}: Ø${d}`);

}

// Calculate total values for each PM type
function calculateTotalPMValues(pointLayer) {
    let pm1Total = 0,
        pm2_5Total = 0,
        pm4Total = 0,
        pm10Total = 0;

    pointLayer.features.forEach(feature => {
        const { pm1, pm2_5, pm4, pm10 } = feature.properties;
        pm1Total += pm1;
        pm2_5Total += pm2_5;
        pm4Total += pm4;
        pm10Total += pm10;
    });
    return { pm1Total, pm2_5Total, pm4Total, pm10Total };

}

function addCombinedPmPieChart(pointLayer) {
    const { pm1Total, pm2_5Total, pm4Total, pm10Total } = calculateTotalPMValues(pointLayer);
    createCombinedPieChart(pm1Total, pm2_5Total, pm4Total, pm10Total, pointLayer);
    addLayerCheckbox('PM-values');

}

/*
function getSpeedValueAtTime(targetTime) {
    // Find the nearest speed value based on timestamps
    let nearestSpeed;
    let timeDifference = Infinity;

    for (const feature of pointGeoJSON.features) {
        const featureTime = new Date(feature.properties.timestamp).getTime();;
        const difference = Math.abs(targetTime * 1000 - featureTime);

        if (difference < timeDifference) {
            nearestSpeed = feature.properties.speed;
            timeDifference = difference;
        }
    }

    console.log(nearestSpeed)

    return nearestSpeed;
}



 // Function to update the speedometer's value
    function updateSpeedometer(speedValue) {
        speedText.textContent = `Speed: ${speedValue.toFixed(2)} km/h`;
    }

    /*
    function toggleAnimation() {
        tachometer.classList.toggle('playing', !videoElement.paused);
    }

function animatePointLayer(pointLayer, lineLayer) {
    map.addSource('route', {
        type: 'geojson',
        data: lineLayer // Replace with your GeoJSON file URL
    });

    const firstPointFeature = pointLayer.features[0];

    map.addSource('point', {
        type: 'geojson',
        data: firstPointFeature
    });

    map.addLayer({
        id: 'route',
        source: 'route',
        type: 'line',
        paint: {
            'line-width': 2,
            'line-color': '#007cbf'
        }
    });

    map.loadImage('fahrrad.png', (error, image) => {
        if (error) throw error;

        map.addImage('bike-icon', image);

        map.addLayer({
            id: 'point',
            source: 'point',
            type: 'symbol',
            layout: {
                'icon-image': 'bike-icon',
                'icon-size': 0.02,
                'icon-rotate': ['get', 'bearing'],
                'icon-rotation-alignment': 'map',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
            }

        })
    });


    zoomLayer(lineLayer);
    addLayerCheckbox('route');

    firstPointFeature.geometry.coordinates = lineLayer.features[0].geometry.coordinates[0];

    // Update the source with the initial data
    map.getSource('point').setData(firstPointFeature);

    let running = false;

    function animate() {
        if (!running) return;

        const videoTime = videoElement.currentTime;
        const steps = lineLayer.features[0].geometry.coordinates.length;
        const counter = Math.floor((videoTime / videoElement.duration) * steps);

        const start = lineLayer.features[0].geometry.coordinates[counter];
        const end = lineLayer.features[0].geometry.coordinates[counter + 1];

        if (!start || !end) {
            running = false;
            return;
        }

        // Update point geometry to a new position based on the counter denoting
        // the index to access the arc
        firstPointFeature.geometry.coordinates = lineLayer.features[0].geometry.coordinates[counter];

        /*
        // Calculate the bearing to ensure the icon is rotated to match the route arc
        pointLayer.features[0].properties.bearing = turf.bearing(
          turf.point(start),
          turf.point(end)
        );
    

        // Update the source with this new data
        map.getSource('point').setData(firstPointFeature);

        var speedValue = pointLayer.features[counter].properties.speed;
        //updateSpeedometer(speedValue);

        // Request the next frame of animation
        requestAnimationFrame(animate);
    }


    // Event listener for video play
    videoElement.addEventListener('play', () => {
        running = true;
        const videoTime = videoElement.currentTime;
        const speedValue = getSpeedValueAtTime(videoTime, geoJsonFeatures.map(feature => feature.properties))
        animate();
        toggleAnimation();
    });

    // Event listener for video pause
    videoElement.addEventListener('pause', () => {
        running = false;
        toggleAnimation();
    });

    videoElement.addEventListener('ended', () => {
        speedometer.classList.remove('playing');
        pointer.style.animation = 'none';
        updateSpeedometer(0);
    });

    // Example: Update the speedometer when the video time changes
    videoElement.addEventListener('timeupdate', () => {
        const speedValue = getSpeedValueAtTime(videoTime, speedData)
        updateSpeedometer(speedValue);
    });

}


document.addEventListener("DOMContentLoaded", function () {
    

    function updateSpeedometer(speedValue) {
        // Add your logic here to update the speedometer based on the speedValue
        // For example, update the rotation angle of the pointer based on the speedValue
        const rotationAngle = calculateRotationAngle(speedValue);
        pointer.style.transform = `rotate(${rotationAngle}deg)`;
    }

    function toggleAnimation() {
        if (videoElement.paused) {
            speedometer.classList.remove('playing');
            pointer.style.animation = 'none';
        } else {
            speedometer.classList.add('playing');
            pointer.style.animation = 'speeding 5s infinite alternate';
        }
    }

   
});


function calculateRotationAngle(speedValue) {
    // Define your speed range and corresponding rotation angle range
    const speedRange = [0, 60];  // Example speed range in km/h
    const angleRange = [-90, 90];  // Example rotation angle range in degrees

    // Linear interpolation formula
    const normalizedSpeed = (speedValue - speedRange[0]) / (speedRange[1] - speedRange[0]);
    const rotationAngle = normalizedSpeed * (angleRange[1] - angleRange[0]) + angleRange[0];

    return rotationAngle;
}



function getSpeedValueAtTime(videoTime, speedData) {
    // Assuming speedData is an array of objects with timestamp and speed properties
    const closestEntry = speedData.reduce((closest, entry) => {
        const entryTimeDiff = Math.abs(entry.timestamp - videoTime);
        const closestTimeDiff = Math.abs(closest.timestamp - videoTime);
        return entryTimeDiff < closestTimeDiff ? entry : closest;
    });

    return closestEntry.speed;
}

*/


function downloadMap() {
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match the map container's size
    const width = mapContainer.offsetWidth;
    const height = mapContainer.offsetHeight;

    // Set canvas dimensions considering high-density displays
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Adjust context for high-density displays
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Slight recentering of the map to trigger a re-render
    map.panBy([1, 0]);

    // Wait for a short delay to ensure proper rendering
    setTimeout(() => {
        // Wait for the map to render completely
        map.once('render', () => {
            ctx.drawImage(map.getCanvas(), 0, 0, canvas.width, canvas.height);

            // Capture the legend element container and create an image from it
            html2canvas(legendContainer).then(legendCanvas => {
                // Draw the legend canvas onto the combined canvas
                ctx.drawImage(legendCanvas, 10, height - legendContainer.offsetHeight - 10); // Adjust position as needed

                // Trigger the image download
                const link = document.createElement('a');
                link.setAttribute('download', 'map_with_legend.png');
                link.setAttribute('href', canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
                link.click();
            });
        });
    }, 200); // Adjust this delay time as needed (in milliseconds)
}

// Function to update the speedometer's value
function updateSpeedometer(speedValue) {
    // Add your logic here to update the speedometer based on the speedValue
    // For example, update the rotation angle of the pointer based on the speedValue
    const rotationAngle = calculateRotationAngle(speedValue);
    pointer.style.transform = `rotate(${rotationAngle}deg)`;
}

// Function to toggle the speedometer animation
function toggleAnimation() {
    if (videoElement.paused) {
        speedometer.classList.remove('playing');
        pointer.style.animation = 'none';
    } else {
        speedometer.classList.add('playing');
        pointer.style.animation = 'speeding 5s infinite alternate';
    }
}

// Function to calculate the rotation angle based on speed value
function calculateRotationAngle(speedValue) {
    // Define your speed range and corresponding rotation angle range
    const speedRange = [0, 60];  // Example speed range in km/h
    const angleRange = [-90, 90];  // Example rotation angle range in degrees

    // Linear interpolation formula
    const normalizedSpeed = (speedValue - speedRange[0]) / (speedRange[1] - speedRange[0]);
    const rotationAngle = normalizedSpeed * (angleRange[1] - angleRange[0]) + angleRange[0];

    return rotationAngle;
}

function getSpeedValueAtTime(targetTime, features) {
    // Assuming features is an array of GeoJSON features with properties.timestamp and properties.speed
    const closestEntry = features.reduce((closest, feature) => {
        const featureTime = new Date(feature.properties.timestamp).getTime();
        const difference = Math.abs(targetTime - featureTime);

        if (difference < closest.timeDifference) {
            closest.speed = feature.properties.speed;
            closest.timeDifference = difference;
        }

        return closest;
    }, { speed: null, timeDifference: Infinity });

    return closestEntry.speed;
}

// Main function to animate the point layer and synchronize with the video

var videoTime = videoElement.currentTime;

    function animatePointLayer(pointLayer, lineLayer) {
        map.addSource('route', {
            type: 'geojson',
            data: lineLayer // Replace with your GeoJSON file URL
        });
    
        const firstPointFeature = pointLayer.features[0];
    
        map.addSource('point', {
            type: 'geojson',
            data: firstPointFeature
        });
    
        map.addLayer({
            id: 'route',
            source: 'route',
            type: 'line',
            paint: {
                'line-width': 2,
                'line-color': '#007cbf'
            }
        });
    
        map.loadImage('fahrrad.png', (error, image) => {
            if (error) throw error;
    
            map.addImage('bike-icon', image);
    
            map.addLayer({
                id: 'point',
                source: 'point',
                type: 'symbol',
                layout: {
                    'icon-image': 'bike-icon',
                    'icon-size': 0.02,
                    'icon-rotate': ['get', 'bearing'],
                    'icon-rotation-alignment': 'map',
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true
                }
    
            })
        });
    
    
        zoomLayer(lineLayer);
        addLayerCheckbox('route');
    
        firstPointFeature.geometry.coordinates = lineLayer.features[0].geometry.coordinates[0];
    
        // Update the source with the initial data
        map.getSource('point').setData(firstPointFeature);
    
        let running = false;
    
        function animate() {
            if (!running) return;
    
            
            const steps = lineLayer.features[0].geometry.coordinates.length;
            const counter = Math.floor((videoTime / videoElement.duration) * steps);
    
            const start = lineLayer.features[0].geometry.coordinates[counter];
            const end = lineLayer.features[0].geometry.coordinates[counter + 1];
    
            if (!start || !end) {
                running = false;
                return;
            }
    
            // Update point geometry to a new position based on the counter denoting
            // the index to access the arc
            firstPointFeature.geometry.coordinates = lineLayer.features[0].geometry.coordinates[counter];
    
            /*
            // Calculate the bearing to ensure the icon is rotated to match the route arc
            pointLayer.features[0].properties.bearing = turf.bearing(
              turf.point(start),
              turf.point(end)
            );
            */
        
    
            // Update the source with this new data
            map.getSource('point').setData(firstPointFeature);
    
            var speedValue = pointLayer.features[counter].properties.speed;
            //updateSpeedometer(speedValue);
    
            // Request the next frame of animation
            requestAnimationFrame(animate);
        }
    // Event listener for video play
    videoElement.addEventListener('play', () => {
        running = true;
        const videoTime = videoElement.currentTime;
        const speedValue = getSpeedValueAtTime(videoTime, pointLayer);
        updateSpeedometer(speedValue);
        animate();
        toggleAnimation();
    });

    // Event listener for video pause
    videoElement.addEventListener('pause', () => {
        running = false;
        toggleAnimation();
    });

    // Event listener for video end
    videoElement.addEventListener('ended', () => {
        speedometer.classList.remove('playing');
        pointer.style.animation = 'none';
        updateSpeedometer(0);
    });

    // Example: Update the speedometer when the video time changes
    videoElement.addEventListener('timeupdate', () => {
        const speedValue = getSpeedValueAtTime(videoTime, pointLayer);
        updateSpeedometer(speedValue);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    // ... (Your existing code)

    function updateSpeedometer(speedValue) {
        // Add your logic here to update the speedometer based on the speedValue
        // For example, update the rotation angle of the pointer based on the speedValue
        const rotationAngle = calculateRotationAngle(speedValue);
        pointer.style.transform = `rotate(${rotationAngle}deg)`;
    }

    function toggleAnimation() {
        if (videoElement.paused) {
            speedometer.classList.remove('playing');
            pointer.style.animation = 'none';
        } else {
            speedometer.classList.add('playing');
            pointer.style.animation = 'speeding 5s infinite alternate';
        }
    }
});
