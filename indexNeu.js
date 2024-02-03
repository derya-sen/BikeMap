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

var tachometer = document.getElementById('tachometer');
//var needle = document.getElementById('needle');

var videoInput = document.getElementById('videoInput');
var videoContainer = document.getElementById('videoContainer');
var videoElement = document.getElementById('mapVideo');
var videoSource = document.getElementById('videoSource');
var speedometerValue = document.getElementById('speedText');
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
var lineGeoJSON;
let interval = 250;

//Upload function for csv-File
function handleCSVUpload(event) {
    csvfile = event.target.files[0];
    const reader = new FileReader();


    // Zeige die Layer-Checkboxen an, wenn Dateien hochgeladen wurden
    layerList.style.display = 'block';

    reader.onload = () => {
        const csv = reader.result;
        pointGeoJSON = csvToPointGeoJSON(csv);
        lineGeoJSON = csvToLineGeoJSON(csv);
        //groupPointsByInterval(pointGeoJSON, interval)
        //temperatureLayer(pointGeoJSON);
        createTemperatureLayerAndLegend(pointGeoJSON);
        distanceLayer(pointGeoJSON);
        accelerationLayer(pointGeoJSON);
        animatePointLayer(pointGeoJSON, lineGeoJSON);
        calculateAverageSpeed(pointGeoJSON);
        //addHumidityLayer(pointGeoJSON)

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
    let timestampIndex = -1;

    // Find latitude and longitude columns based on keywords
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase().trim();
        if (header.includes('latitude')) {
            latitudeIndex = i;
        } else if (header.includes('longitude')) {
            longitudeIndex = i;
        } else if (header.includes('timestamp')) {
            timestampIndex = i;
        }
        else if (header.includes('humidity')) {
            humidityIndex = i;
        }
    }

    if (latitudeIndex !== -1 && longitudeIndex !== -1 && timestampIndex !== -1 && humidityIndex !== -1) {
        for (let i = 1; i < lines.length; i++) {
            //for (let i = 1; i < 2; i++) {
            const currentLine = lines[i].split(',');
            const latitude = parseFloat(currentLine[latitudeIndex]);
            const longitude = parseFloat(currentLine[longitudeIndex]);
            const timestamp = currentLine[timestampIndex];
            const humidity = parseFloat(currentLine[humidityIndex]);


            if (!isNaN(latitude) && !isNaN(longitude)) {
                const coordinates = [longitude, latitude];

                const feature = {
                    type: 'Feature',
                    properties: {
                        timestamp: new Date(timestamp).toISOString(),  // Ensure timestamp is in ISO format
                        humidity: humidity.toFixed(1)
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: coordinates
                    }
                };

                // Assign other properties to the GeoJSON feature
                for (let j = 0; j < headers.length; j++) {
                    if (!isNaN(parseFloat(currentLine[j])) && headers[j].trim() !== '' && j !== timestampIndex && j !== humidityIndex) {
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
        maxZoom: 16 // Set maximum zoom level if necessary
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



/*
function temperatureLayer(pointLayer) {
    map.addSource('temperature', {
        type: 'geojson',
        data: pointLayer
    });

    const temperatureRanges = [-10, 0, 40];

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

}*/

var temperatureRanges = [];

function createTemperatureLayerAndLegend(pointLayer) {
    // Extract temperature values from the GeoJSON features
    const temperatureValues = pointLayer.features.map(feature => feature.properties.temperature);

    // Determine temperature ranges and steps dynamically
    const minTemperature = Math.min(...temperatureValues);
    const maxTemperature = Math.max(...temperatureValues);
    const temperatureSteps = 6; // Adjust as needed

    
    for (let i = 0; i < temperatureSteps; i++) {
        const rangeStart = minTemperature + (i / temperatureSteps) * (maxTemperature - minTemperature);
        const rangeEnd = minTemperature + ((i + 1) / temperatureSteps) * (maxTemperature - minTemperature);
        
        // Adjust the end value to avoid overlap
        temperatureRanges.push({ start: rangeStart, end: rangeEnd - 0.000000001 });
    }
    console.log(temperatureRanges);

    const colorStops = temperatureRanges.reduce((acc, currentValue, index, array) => {
        if (index < array.length - 1) {
            acc.push(currentValue.start);
            acc.push(getColorForTemperature(currentValue.start)); // Implement getColorForTemperature function
        }
        return acc;
    }, []);
    console.log(colorStops)
    
    // Add the last color for the upper bound
    colorStops.push(temperatureRanges[temperatureRanges.length - 1].start);
    colorStops.push(getColorForTemperature(temperatureRanges[temperatureRanges.length - 1].start));

    map.addSource('temperature', {
        type: 'geojson',
        data: pointLayer
    });

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
                ...colorStops,
            ],
            'circle-opacity': 0.7
        },
        layout: {
            visibility: 'visible'
        }
    });

    createTemperatureLegend(temperatureRanges);
    addLayerCheckbox('temperatureLayer');
    zoomLayer(pointLayer);
}

function getColorForTemperature(temperature) {
    for (let i = 0; i < temperatureRanges.length; i++) {
        const range = temperatureRanges[i];
        if (temperature >= range.start && temperature <= range.end) {
            // Return the color for the matched range
            return getColorForRange(i);
        }
    }
    // Default color if no range is matched
    return 'gray';
}

function getColorForRange(rangeIndex) {
    // Customize this function based on your color choices for each range
    switch (rangeIndex) {
        case 0:
            return '#0000FF';
        case 1:
            return '#7EC0EE';
        case 2:
            return '#F0FFFF';
        case 3:
            return '#FFC1C1';
        case 4:
            return '#EE3B3B';
        case 5:
            return 'red';
        default:
            return 'gray';
    }
}
var colors = ['#0000FF', '#7EC0EE', '#F0FFFF', '#FFC1C1', '#EE3B3B', 'red'];

function generateColorStops(temperatureRanges) {
     // Adjust as needed
    const colorStops = [];


    for (let i = 0; i < temperatureRanges.length - 1; i++) {
        colorStops.push(temperatureRanges[i].start);
        colorStops.push(colors[i]);
        colorStops.push(temperatureRanges[i + 1].start);
        colorStops.push(colors[i]);
    }
    console.log(colorStops);

    // Add the last temperature value and color stop
    colorStops.push(temperatureRanges[temperatureRanges.length - 1].start);
    colorStops.push(colors[colors.length - 1]);

    return colorStops;
}

function createTemperatureLegend(temperatureRanges) {
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';

    const legendLabel = document.createElement('div');
    legendLabel.className = 'legend-label';
    //legendLabel.textContent = 'Temperature Legend';

    legendItem.appendChild(legendLabel);

    for (let i = 0; i < temperatureRanges.length; i++) {
        const legendSymbol = document.createElement('div');
        legendSymbol.className = 'legend-symbol';
        legendSymbol.style.backgroundColor = getColorForRange(i); // Use the same colors array as in generateColorStops
        legendSymbol.textContent = `${temperatureRanges[i].start.toFixed(2)} - ${temperatureRanges[i].end.toFixed(2)}`;
    
        legendItem.appendChild(legendSymbol);
    }

    layerList.appendChild(legendItem);
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
*/


// Function to update the speedometer's value
function updateSpeedometer(speedValue) {
    speedometerValue.textContent = `${speedValue.toFixed(2)} km/h`;
}


function toggleAnimation() {
    tachometer.classList.toggle('playing', !videoElement.paused);
}

var speedValue;

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
    */

        // Update the source with this new data
        map.getSource('point').setData(firstPointFeature);

        speedValue = pointLayer.features[counter].properties.speed;
        updateSpeedometer(speedValue);

        // Request the next frame of animation
        requestAnimationFrame(animate);
    }


    // Event listener for video play
    videoElement.addEventListener('play', () => {
        running = true;
        animate();
        toggleAnimation();
        updateNeedleRotation(speedValue)
    });

    // Event listener for video pause
    videoElement.addEventListener('pause', () => {
        running = false;
        toggleAnimation();
        updateNeedleRotation(speedValue)
    });

    videoElement.addEventListener('ended', () => {
        tachometer.classList.remove('playing');
        needle.style.transform = 'translate(-50%, -50%) rotate(-90deg)';
        speedometerValue.textContent = `⌀ ${averageSpeed.toFixed(2)} km/h`;
    });

}


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


function calculateTotalDistance(geojson) {
    let totalDistance = 0;

    for (i = 1; i < geojson.features.length; i++) {
        const currentFeature = geojson.features[i];
        const previousFeature = geojson.features[i - 1];

        const distance = calculateDistance(
            currentFeature.geometry.coordinates[1],
            currentFeature.geometry.coordinates[0],
            previousFeature.geometry.coordinates[1],
            previousFeature.geometry.coordinates[0]
        )

        totalDistance += distance;
    }

    return totalDistance;
}


// Example function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

// Function to convert degrees to radians
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}


function calculateTime(geojson) {
    const length = geojson.features.length - 1;
    let totalTime = 0;

    const parseTimestamp = (timestamp) => new Date(timestamp).getTime();

    const startTime = parseTimestamp(geojson.features[0].properties.timestamp);
    const endTime = parseTimestamp(geojson.features[length].properties.timestamp);

    totalTime = (endTime - startTime) / (1000 * 60 * 60);
    return totalTime;
}


var averageSpeed;

function calculateAverageSpeed(geojson) {
    const time = calculateTime(geojson);
    const distance = calculateTotalDistance(geojson);
    averageSpeed = distance / time;

    speedometerValue.textContent = `⌀ ${averageSpeed.toFixed(2)} km/h`;


}

/*
//const needle = document.querySelector('.needle');
const needle = document.getElementById('needle')

// Function to update the needle rotation based on speed
function updateNeedleRotation(speedValue) {
  const maxSpeed = 60;
  const minAngle = -90;
  const maxAngle = 90;

  const videoTime = videoElement.currentTime;
  const speedValueVideo = getSpeedValueAtTime(videoTime, pointGeoJSON);


  // Map the speed value to the angle range
  const normalizedSpeed = (speedValue / maxSpeed);
  const rotationAngle = minAngle + normalizedSpeed * (maxAngle - minAngle);

  console.log(`Speed: ${speedValueVideo}, Rotation: ${rotationAngle}`);
  needle.style.transform = `translate(-50%, -50%) rotate(${rotationAngle}deg)`;
}


function getSpeedValueAtTime(targetTime, geojson) {
  const speedData = geojson.features.map(feature => ({
      timestamp: feature.properties.timestamp,
      speed: feature.properties.speed
  }));

  const closestEntry = speedData.reduce((closest, entry) => {
      const entryTime = new Date(entry.timestamp).getTime() / 1000;
      const entryTimeDiff = Math.abs(entryTime - targetTime);
      const closestTimeDiff = Math.abs(new Date(closest.timestamp).getTime() / 1000 - targetTime);

      return entryTimeDiff < closestTimeDiff ? entry : closest;
  });

  return closestEntry.speed;
}
*/



function addHumidityLayer(pointLayer) {
    map.addSource('humidity', {
        type: 'geojson',
        data: pointLayer
    });

    map.loadImage('drop.png', (error, image) => {
        if (error) throw error;

        map.addImage('drop-icon', image);

        map.addLayer({
            id: 'humidity',
            type: 'symbol',
            source: 'humidity',
            layout: {
                'icon-image': "drop-icon", // Customize the marker icon
                'icon-size': [
                    'interpolate',
                    ['linear'],
                    ['get', 'humidity'],
                    0, 0.001, // Adjust these values based on your data
                    100, 0.01,
                ],
                'icon-allow-overlap': true, // Allow icons to overlap
                'text-field': [
                    'concat',
                    ['to-string', ['get', 'humidity']],
                    '%'
                ],
                'text-font': ['Open Sans Regular'],
                'text-size': 12,
                'text-offset': [0, -1], // Adjust text position
                'text-allow-overlap': true, // Allow text to overlap
                'text-anchor': 'bottom', // Anchor text to the bottom of the icon

            },
        });
    })
    addLayerCheckbox('humidity');
}

/*

// Function to calculate distance between two points using Turf.js
function calculateDistance(point1, point2) {
    return turf.distance(point1.geometry.coordinates, point2.geometry.coordinates);
  }
  
// Function to group points into intervals and calculate averages
function groupPointsByInterval(features, interval) {
    const groupedPoints = [];
    let currentGroup = [];
    let currentDistance = 0;

    for (let i = 0; i < features.length - 1; i++) {
        const currentPoint = features[i];
        const nextPoint = features[i + 1];
        console.log(currentPoint, nextPoint)
        console.log("hello");
        //const distance = calculateDistance(currentPoint, nextPoint);

        if (currentDistance + distance <= interval) {
            // Add point to current group
            currentGroup.push(currentPoint);
            console.log("hello");
            currentDistance += distance;
        } else {
            // Calculate average for the current group
            const averageValues = calculateAverageValues(currentGroup);

            // Create a GeoJSON feature for the interval with average values
            const intervalFeature = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: currentPoint.geometry.coordinates,
                },
                properties: {
                    averageValues: averageValues,
                },
            };

            // Add interval feature to the result array
            groupedPoints.push(intervalFeature);

            // Start a new group with the current point
            currentGroup = [currentPoint];
            currentDistance = 0;
        }
    }

    return groupedPoints;
}

// Function to calculate average values for a group of points
function calculateAverageValues(points) {
    // Implement logic to calculate average values based on your data
    // For example, if your properties include 'temperature', you can calculate the average temperature.
    const numPoints = points.length;
    const sumTemperature = points.reduce((sum, point) => sum + point.properties.temperature, 0);
    const averageTemperature = sumTemperature / numPoints;

    return {
        temperature: averageTemperature,
        // Add other properties as needed
    };
}

*/