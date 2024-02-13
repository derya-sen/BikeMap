//Generate Mapbox Map
mapboxgl.accessToken = 'pk.eyJ1IjoiZHNlbiIsImEiOiJjbG9ldTJnbGcwbDZjMnNyd3JjY29nbnZoIn0.Cyef_5fl6quIZuBhYqXQWg';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [0, 0],
    zoom: 2
});

document.getElementById('csvFile').addEventListener('change', handleCSVUpload);
var canvas = document.getElementById('combinedCanvas');
var mapContainer = document.getElementById('map');
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

/*
// Position the chart container on the top-right corner of the map
const chartContainer = document.getElementById('chart-container');
chartContainer.style.position = 'absolute';
chartContainer.style.top = '10px'; // Adjust top position as needed
chartContainer.style.right = '5px'; // Adjust right position as needed
chartContainer.style.zIndex = '1000'; // Ensure the container is above the map
*/

const layers = {}
var csvFile;
var videoFile;
var pointGeoJSON;
var lineGeoJSON;
//let interval = 250;



//Upload function for csv-File
function handleCSVUpload(event) {
    csvFile = event.target.files[0];
    const reader = new FileReader();


    // Zeige die Layer-Checkboxen an, wenn Dateien hochgeladen wurden
    layerList.style.display = 'block';

    reader.onload = () => {
        const csv = reader.result;
        pointGeoJSON = csvToPointGeoJSON(csv);
        lineGeoJSON = csvToLineGeoJSON(csv);
        animatePointLayer(pointGeoJSON, lineGeoJSON);
        createTemperatureLayer(pointGeoJSON);
        createAccelerationLayer(pointGeoJSON);
        calculateAverageSpeed(pointGeoJSON);
        createHumidityLayer(pointGeoJSON);
        createPMLayer(pointGeoJSON);
        createDistanceLayer(pointGeoJSON);

    };

    if (csvFile) {
        reader.readAsText(csvFile);
    }
}







//Video-upload
function handleFileChange() {

    // Check if a file is selected
    if (videoInput.files.length > 0) {
        videoFile = videoInput.files[0];

        // Show the video container
        videoContainer.style.display = 'block';

        // Set the video source
        videoSource.src = URL.createObjectURL(videoFile);

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
    let humidityIndex = -1;

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
                        humidity: humidity
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


function addLayerCheckbox(layerId, legendId) {
    const layerList = document.getElementById('layerList');

    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.className = 'layer-checkbox';
    checkbox.id = layerId;
    const legend = document.getElementById(legendId); // Get the corresponding legend element
    checkbox.addEventListener('change', function (e) {
        const visibility = e.target.checked ? 'visible' : 'none';
        map.setLayoutProperty(layerId, 'visibility', visibility);

        // Toggle the legend display based on checkbox state
        legend.style.display = e.target.checked ? 'block' : 'none';
    });

    const label = document.createElement('label');
    label.htmlFor = layerId;
    label.textContent = layerId;

    // Append the legend item before the layer item
    layerList.appendChild(layerItem);
    layerList.appendChild(legend);
    layerItem.appendChild(checkbox);
    layerItem.appendChild(label);
}


var temperatureRanges = [];

function createTemperatureLayer(pointLayer) {
    // Extract temperature values from the GeoJSON features
    const temperatureValues = pointLayer.features.map(feature => feature.properties.temperature);

    // Determine temperature ranges and steps dynamically
    const minTemperature = Math.min(...temperatureValues);
    const maxTemperature = Math.max(...temperatureValues);
    const temperatureSteps = 5; // Adjust as needed

    const stepSize = (maxTemperature - minTemperature) / temperatureSteps;

    // Create temperature ranges
    for (let i = 0; i < temperatureSteps; i++) {
        const rangeStart = minTemperature + i * stepSize;
        const rangeEnd = rangeStart + stepSize;

        temperatureRanges.push({ start: rangeStart, end: rangeEnd });
    }

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
            'circle-radius': 7,
            'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'temperature'],
                ...generateColorStops(temperatureRanges),
            ],
            'circle-opacity': 0.9
        },
        layout: {
            visibility: 'visible'
        }
    });

    createTemperatureLegend(temperatureRanges);
    addLayerCheckbox('temperatureLayer', 'temperatureLegend')
    zoomLayer(pointLayer);
}

map.on('click', 'temperatureLayer', (e) => {
    const temperature = e.features[0].properties.temperature;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<p>Temperature: ${temperature.toFixed(2)}°C</p>`)
        .addTo(map);
});

function generateColorStops(temperatureRanges) {
    const colorStops = [];

    for (let i = 0; i < temperatureRanges.length; i++) {
        colorStops.push(temperatureRanges[i].start);
        colorStops.push(getColorForTemperature(i));
    }

    return colorStops;
}

function getColorForTemperature(rangeIndex) {
    // Adjust color based on range index
    const colors = ['#FFD700', '#FFA500', '#FF7256', '#FF4500', '#CD0000', 'gray'];
    return colors[rangeIndex % colors.length];
}

function createTemperatureLegend(temperatureRanges) {
    const legendItem = document.createElement('div');
    legendItem.id = 'temperatureLegend';
    legendItem.className = 'legend-item';


    for (let i = 0; i < temperatureRanges.length; i++) {
        const legendSymbol = document.createElement('div');
        legendSymbol.className = 'legend-symbol';
        legendSymbol.style.backgroundColor = getColorForTemperature(i); // Use the same colors array as in generateColorStops
        legendSymbol.textContent = `${temperatureRanges[i].start.toFixed(1)} - ${temperatureRanges[i].end.toFixed(1)}°C`;

        legendItem.appendChild(legendSymbol);
    }
    
    layerList.appendChild(legendItem);

}


function createDistanceLayer(pointLayer) {
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

    createDistanceLegend('abstand.png');
    addLayerCheckbox('distanceLayer', 'distanceLegend');
    zoomLayer(pointLayer);

}

map.on('click', 'distanceLayer', (e) => {
    const distance = e.features[0].properties.distance_l;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<p>Distance: ${distance.toFixed(1)}m</p>`)
        .addTo(map);
});

function createDistanceLegend(legendIcon) {

    // Create legend for the layer
    const legendItem = document.createElement('div');
    legendItem.id = `distanceLegend`;
    legendItem.className = 'legend-item';
    legendItem.style.display = 'flex';

    const legendIconElement = document.createElement('div');
    legendIconElement.className = legendIcon;
    legendIconElement.innerHTML = `<img src="${legendIcon}" alt="icon" class="legend-icon"/>`;
    legendIconElement.style.marginRight = '8px'; // Adjust as needed to add space between icon and text

    const legendLabel = document.createElement('div');
    legendLabel.className = 'legend-label';
    legendLabel.innerHTML = ' Distance < 2 Meters';
    legendLabel.style.flex = '1'; // This makes the label take up the available space

    legendItem.appendChild(legendIconElement);
    legendItem.appendChild(legendLabel);
    layerList.appendChild(legendItem);
}

var minAcceleration;
var maxAcceleration;

function createAccelerationLayer(pointLayer) {
    map.addSource('acceleration', {
        type: 'geojson',
        data: pointLayer // Replace with your GeoJSON file URL
    });

    minAcceleration = Math.floor(d3.min(pointLayer.features, d => d.properties.acceleration_z));
    maxAcceleration = Math.ceil(d3.max(pointLayer.features, d => d.properties.acceleration_z));

    map.addLayer({
        id: 'accelerationLayer',
        source: 'acceleration',
        type: 'heatmap',
        paint: {
            // Increase the heatmap weight based on frequency and property magnitude
            'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'acceleration_z'], // You can use 'acceleration_x', 'acceleration_y', or any other acceleration property
                minAcceleration, 0, // Minimum value
                maxAcceleration, 1  // Maximum value
            ],

            // Increase the heatmap color weight by zoom level
            // heatmap-intensity is a multiplier on top of heatmap-weight
            'heatmap-intensity': {
                stops: [
                    [0, 1],
                    [9, 3],
                ],
            },

            // Color ramp for heatmap. Domain is 0 (low) to 1 (high).
            // Begin color ramp at 0-stop with a 0-transparency color
            // to create a blur-like effect.
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(33,102,172,0)',
                0.2,
                'rgb(103,169,207)',
                0.4,
                'rgb(209,229,240)',
                0.6,
                'rgb(255,225,255)',
                0.8,
                'rgb(238,174,238)',
                1,
                'rgb(224,102,255)'
            ],

            // Adjust the heatmap radius by zoom level
            'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                1,
                10,
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
                1
            ]
        },
        layout: {
            visibility: 'visible'
        }
    });

    createAccelerationLegend(minAcceleration, maxAcceleration);
    addLayerCheckbox('accelerationLayer', 'accelerationLegend');
    zoomLayer(pointLayer);
}

map.on('click', 'accelerationLayer', (e) => {
    const acceleration = e.features[0].properties.acceleration_z;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<p>Erschütterung: ${acceleration.toFixed(1)}</p>`)
        .addTo(map);
});

function createAccelerationLegend(minValue, maxValue) {
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.id = 'accelerationLegend'

    const legendLabel = document.createElement('div');
    legendLabel.className = 'legend-label';

    const colorGradient = document.createElement('div');
    colorGradient.className = 'color-gradient';

    const valueLabels = document.createElement('div');
    valueLabels.className = 'value-labels';

    const minValueLabel = document.createElement('span');
    minValueLabel.textContent = minValue.toFixed(2) + 'm/s^2';

    const maxValueLabel = document.createElement('span');
    maxValueLabel.textContent = maxValue.toFixed(2) + 'm/s^2';

    legendItem.appendChild(legendLabel);
    legendItem.appendChild(colorGradient);
    legendItem.appendChild(valueLabels);
    valueLabels.appendChild(minValueLabel);
    valueLabels.appendChild(maxValueLabel);

    document.getElementById('layerList').appendChild(legendItem);
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
                'icon-size': 0.01,
                'icon-rotation-alignment': 'map',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
            }

        })
    });


    zoomLayer(lineLayer);
    //addLayerCheckbox('route');

    //firstPointFeature.geometry.coordinates = lineLayer.features[0].geometry.coordinates[0];

    // Update the source with the initial data
    map.getSource('point').setData(firstPointFeature);

    let running = false;
    
    function animate() {
        if (!running) return;
    
        const videoTime = videoElement.currentTime;
        const totalDuration = videoElement.duration;
        const routeCoordinates = lineLayer.features[0].geometry.coordinates;
        
        // Calculate the fraction of video duration passed
        const fraction = videoTime / totalDuration;
    
        // Calculate the index of the coordinate pair closest to the current fraction
        const index = fraction * (routeCoordinates.length - 1);
    
        // Calculate the fractional part to interpolate between the two closest coordinates
        const fractionalIndex = index % 1;
        const startIndex = Math.floor(index);
        const endIndex = Math.min(startIndex + 1, routeCoordinates.length - 1);
        
        const start = routeCoordinates[startIndex];
        const end = routeCoordinates[endIndex];
    
        // Interpolate between the current and next coordinates
        const interpolatedLng = start[0] + (end[0] - start[0]) * fractionalIndex;
        const interpolatedLat = start[1] + (end[1] - start[1]) * fractionalIndex;
    
        // Update point geometry to the interpolated position
        firstPointFeature.geometry.coordinates = [interpolatedLng, interpolatedLat];
    
        // Update the source with this new data
        map.getSource('point').setData(firstPointFeature);
    
        // Update the speed value based on the closest coordinate pair
        const speedValue = pointLayer.features[startIndex].properties.speed;
        updateSpeedometer(speedValue);
    
        // Request the next frame of animation
        requestAnimationFrame(animate);
    }
    


    // Event listener for video play
    videoElement.addEventListener('play', () => {
        running = true;
        animate();
        toggleAnimation();
        //updateNeedleRotation(speedValue)
    });

    // Event listener for video pause
    videoElement.addEventListener('pause', () => {
        running = false;
        toggleAnimation();
        //updateNeedleRotation(speedValue)
    });

    videoElement.addEventListener('ended', () => {
        tachometer.classList.remove('playing');
        needle.style.transform = 'translate(-50%, -50%) rotate(-90deg)';
        speedometerValue.textContent = `⌀ ${averageSpeed.toFixed(2)} km/h`;
    });

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



/*

// Function to calculate distance between two points using Turf.js
function calculateDistance(point1, point2) {
    return turf.distance(point1.geometry.coordinates, point2.geometry.coordinates);
  }
*/


var humidityRanges = [];

function createHumidityLayer(pointLayer) {
    // Extract temperature values from the GeoJSON features
    const humidityValues = pointLayer.features.map(feature => feature.properties.humidity);
    // Determine temperature ranges and steps dynamically
    const minhumidity = Math.min(...humidityValues);
    const maxhumidity = Math.max(...humidityValues);
    const humiditySteps = 5; // Adjust as needed

    const humiditystepSize = (maxhumidity - minhumidity) / humiditySteps;
    // Create temperature ranges
    for (let i = 0; i < humiditySteps; i++) {
        const rangeStart = minhumidity + i * humiditystepSize;
        const rangeEnd = rangeStart + humiditystepSize;

        humidityRanges.push({ start: rangeStart, end: rangeEnd });
    }
    map.addSource('humidity', {
        type: 'geojson',
        data: pointLayer
    });

    // Add a single layer with combined properties and filter for all temperature ranges
    map.addLayer({
        id: 'humidityLayer',
        type: 'circle',
        source: 'humidity',
        paint: {
            'circle-radius': 7,
            'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'humidity'],
                ...generateColorStopshumidity(humidityRanges),
            ],
            'circle-opacity': 0.9
        },
        layout: {
            visibility: 'visible'
        }
    });

    createHumidityLegend(humidityRanges);
    addLayerCheckbox('humidityLayer', 'humidityLegend')
    zoomLayer(pointLayer);
}



function generateColorStopshumidity(humidityRanges) {
    const colorStops = [];

    for (let i = 0; i < humidityRanges.length; i++) {
        colorStops.push(humidityRanges[i].start);
        colorStops.push(getColorForhumidity(i));
    }
    return colorStops;
}

function getColorForhumidity(rangeIndex) {
    // Adjust color based on range index
    const colors = ['#87ceff', '#5cacee', '#4876ff', '#0000cd', '#000080', 'gray'];
    return colors[rangeIndex % colors.length];
}

function createHumidityLegend(humidityRanges) {
    const legendItem = document.createElement('div');
    legendItem.id = 'humidityLegend';
    legendItem.className = 'legend-item';

    const legendLabel = document.createElement('div');
    legendLabel.className = 'legend-label';
    //legendLabel.textContent = 'Temperature Legend';

    legendItem.appendChild(legendLabel);

    for (let i = 0; i < humidityRanges.length; i++) {
        const legendSymbol = document.createElement('div');
        legendSymbol.className = 'legend-symbol';
        legendSymbol.style.backgroundColor = getColorForhumidity(i); // Use the same colors array as in generateColorStops
        legendSymbol.textContent = `${humidityRanges[i].start.toFixed(1)} - ${humidityRanges[i].end.toFixed(1)}%`;

        legendItem.appendChild(legendSymbol);
    }

    layerList.appendChild(legendItem);
}


map.on('click', 'humidityLayer', (e) => {
    const humidity = e.features[0].properties.humidity;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<p>Humidity: ${humidity.toFixed(1)}%</p>`)
        .addTo(map);
});

/*
function createPieChartImage(container, pm1, pm2_5, pm4, pm10) {
    const data = [pm1, pm2_5, pm4, pm10];
    const total = data.reduce((acc, val) => acc + val, 0);
    const percentages = data.map(value => ((value / total) * 100).toFixed(2));

    const radius = 10; // Define radius for the pie chart
    const svg = d3.select(container)
        .append('svg')
        .attr('width', radius * 2)
        .attr('height', radius * 2)
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

    return container;
}

function addPmLayer(geoJSONLayer) {
    map.addSource('pmValues', {
        type: 'geojson',
        data: geoJSONLayer
    });

    map.addLayer({
        id: 'pmLayer',
        type: 'symbol',
        source: 'pmValues',
        layout: {
            'icon-image': '{customIcon}',
            'icon-size': 0.1,
            visibility: 'visible',
        }
    });

    geoJSONLayer.features.forEach(feature => {
        const { pm1, pm2_5, pm4, pm10 } = feature.properties;
    
        // Create a container for the marker
        const markerContainer = document.createElement('div');
        markerContainer.className = 'marker-container';
    
        // Generate the pie chart inside the marker container
        createPieChartImage(markerContainer, pm1, pm2_5, pm4, pm10);
    
        // Set the container as the custom icon for the feature
        feature.properties.customIcon = markerContainer;
    
        // Create a popup with PM values
        const popupContent = `
            <p>PM1: ${pm1.toFixed(1)}µg/m</p>
            <p>PM2.5: ${pm2_5.toFixed(1)}µg/m</p>
            <p>PM4: ${pm4.toFixed(1)}µg/m</p>
            <p>PM10: ${pm10.toFixed(1)}µg/m</p>
        `;
        const popup = new mapboxgl.Popup().setHTML(popupContent);
    
        // Create the marker
        const marker = new mapboxgl.Marker(markerContainer)
            .setLngLat(feature.geometry.coordinates)
            .setPopup(popup) // sets a popup on this marker
            .addTo(map);
    });
}    
*/
/*
function calculateTotalPMSum(geoJSONLayer) {
    geoJSONLayer.features.forEach(feature => {
        const { pm1, pm2_5, pm4, pm10 } = feature.properties;
        const totalSum = pm1 + pm2_5 + pm4 + pm10;
        return totalSum;
    });
}
*/
var pmRanges = [
    { min: 0, max: 10, color: '#00ced1', label: 'Sehr gut' },
    { min: 11, max: 20, color: '#008b8b', label: 'Gut' },
    { min: 21, max: 25, color: '#ffd700', label: 'Mäßig' },
    { min: 26, max: 50, color: '#ff3030', label: 'Schlecht' },
    { min: 51, max: Infinity, color: '#8b1a1a', label: 'Sehr schlecht' }
];

// Function to calculate total sum of PM values and generate GeoJSON Feature Collection
function calculateAndGenerateFeatureCollection(geoJSONLayer) {
    // Define your ranges and corresponding colors
    

    const featureCollection = {
        type: 'FeatureCollection',
        features: []
    };
    

    geoJSONLayer.features.forEach(feature => {
        const { pm1, pm2_5, pm4, pm10 } = feature.properties;
        const totalSum = pm1 + pm2_5 + pm4 + pm10;
        const totalSumFixed = Math.round(totalSum);

        // Determine the color based on the range
        let color = '#FFFFFF'; // Default color
        for (const range of pmRanges) {
            if (totalSumFixed >= range.min && totalSumFixed <= range.max) {
                color = range.color;
                break;
            }
        }

        // Create a GeoJSON feature for the station with total sum and color properties
        const stationFeature = {
            type: 'Feature',
            geometry: feature.geometry,
            properties: {
                pm1: pm1,
                pm2_5: pm2_5,
                pm4: pm4,
                pm10: pm10,
                totalSum: totalSumFixed,
                color: color
            }
        };

        featureCollection.features.push(stationFeature);
    });

    return featureCollection;
}

// Add layer to map
function createPMLayer(geoJSONLayer) {
    const featureCollection = calculateAndGenerateFeatureCollection(geoJSONLayer);

    map.addSource('pmLayer', {
        type: 'geojson',
        data: featureCollection
    });

    map.addLayer({
        id: 'pmLayer',
        type: 'circle',
        source: 'pmLayer',
        paint: {
            'circle-radius': 6,
            'circle-color': ['get', 'color'],
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 1
        }
    });

    createPmLegend(pmRanges)
    addLayerCheckbox('pmLayer', 'pmLegend')
    zoomLayer(geoJSONLayer);
}


function createPmLegend(pmRanges) {
    const legendItem = document.createElement('div');
    legendItem.id = 'pmLegend';
    legendItem.className = 'legend-item';

    pmRanges.forEach(range => {
        const legendSymbol = document.createElement('div');
        legendSymbol.className = 'legend-symbol';
        legendSymbol.style.backgroundColor = range.color;
        legendSymbol.textContent = `${range.label} (${range.min}-${range.max})`;

        legendItem.appendChild(legendSymbol);
    });

    layerList.appendChild(legendItem);
}

/*
map.on('click', 'pmLayer', (e) => {
    const pm1 = e.features[0].properties.pm1;
    const pm2_5 = e.features[0].properties.pm2_5;
    const pm4 = e.features[0].properties.pm4;
    const pm10 = e.features[0].properties.pm10;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<p>pm1: ${pm1.toFixed(1)}%</p>
                <p>pm2_5: ${pm2_5.toFixed(1)}%</p>
                <p>pm4: ${pm4.toFixed(1)}%</p>
                <p>pm10: ${pm10.toFixed(1)}%</p>`)
        .addTo(map);
});
*/
/*
function generateBarChartHTML(pm1, pm2_5, pm4, pm10) {
    const pmValues = [pm1, pm2_5, pm4, pm10];
    const pmTypes = ['PM1', 'PM2.5', 'PM4', 'PM10'];

    const maxPM = Math.max(...pmValues);
    const scale = 100 / maxPM;

    let chartHTML = '<div class="bar-chart">';
    for (let i = 0; i < pmValues.length; i++) {
        const height = pmValues[i] * scale;
        chartHTML += `<div class="bar" style="height: ${height}%; background-color: ${getColorForPM(pmValues[i])};"></div>`;
        chartHTML += `<div class="bar-label">${pmTypes[i]}: ${pmValues[i]}</div>`;
    }
    chartHTML += '</div>';

    return chartHTML;
}



// Function to handle click event on map layer
function handleMapClick(e) {
    // Extract PM values from clicked feature
    const properties = e.features[0].properties;
    const pm1 = properties.pm1;
    const pm2_5 = properties.pm2_5;
    const pm4 = properties.pm4;
    const pm10 = properties.pm10;

    // Generate bar chart HTML
    const chartHTML = generateBarChartHTML(pm1, pm2_5, pm4, pm10);

    // Get chart container element
    const chartContainer = document.getElementById('chart-container');

    // Set HTML content of chart container
    chartContainer.innerHTML = chartHTML;

    // Open popup at clicked location
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setDOMContent(document.getElementById('popup'))
        .addTo(map);
}*/


function getColorForPM(pmValue) {
    // Define color ranges here
    if (pmValue <= 10) {
        return '#48d1cc'; // very good
    } else if (pmValue <= 20) {
        return '#00c5cd'; // good
    } else if (pmValue <= 25) {
        return '#ffd700'; // moderate
    } else if (pmValue <= 50) {
        return '#ff3030'; // poor
    } else {
        return '#8b1a1a'; // very poor
    }
}
/*
map.on('click', 'pmLayer', function (e) {
    const properties = e.features[0].properties;
    const pm1 = properties.pm1;
    const pm2_5 = properties.pm2_5;
    const pm4 = properties.pm4;
    const pm10 = properties.pm10;


    const chartHTML = generateBarChartHTML(pm1, pm2_5, pm4, pm10);
    console.log('Bar chart HTML:', chartHTML);

    // Create a popup and set its HTML content to the bar chart
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(chartHTML)
        .addTo(map);
});


function makeGraph(containerId, pm1, pm2_5, pm4, pm10) {
    const pmValues = [pm1, pm2_5, pm4, pm10];
    const pmTypes = ['PM1', 'PM2.5', 'PM4', 'PM10'];

    const maxPM = Math.max(...pmValues);
    const scale = 100 / maxPM;

    let chartHTML = '<div class="bar-chart">';
    for (let i = 0; i < pmValues.length; i++) {
        const height = pmValues[i] * scale;
        chartHTML += `<div class="bar" style="height: ${height}%; background-color: ${getColorForPM(pmValues[i])};"></div>`;
    }
    chartHTML += '</div>';

    // Add x-axis labels (PM types)
    chartHTML += '<div class="x-axis">';
    for (let i = 0; i < pmTypes.length; i++) {
        chartHTML += `<div class="x-axis-label">${pmTypes[i]}</div>`;
    }
    chartHTML += '</div>';

    // Add y-axis labels (PM values)
    chartHTML += '<div class="y-axis">';
    for (let i = 1; i <= 10; i++) {
        chartHTML += `<div class="y-axis-label">${(i * 10)}</div>`;
    }
    chartHTML += '</div>';

    // Get the container element
    const container = document.getElementById(containerId);

    // Set the HTML content of the container
    container.innerHTML = chartHTML;
}
*/

/*
function createChart(){
const data = [
    { name: 'PM1', value: 2.0706522464752197 },
    { name: 'PM2.5', value: 3.7929582595825195 },
    { name: 'PM4', value: 5.097027778625488 },
    { name: 'PM10', value: 5.751195430755615 }
];

// Set up SVG
const margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// X axis
const x = d3.scaleBand()
    .range([0, width])
    .domain(data.map(d => d.name))
    .padding(0.2);
svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", "-.55em")
    .attr("transform", "rotate(-90)");

// Y axis
const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([height, 0]);
svg.append("g")
    .call(d3.axisLeft(y));

// Bars
svg.selectAll("mybar")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.name))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.value))
    .attr("fill", "#69b3a2");

}
*/


function generateBarChart(pm1, pm2_5, pm4, pm10) {
    const data = [
        { pmType: 'PM1', value: pm1 },
        { pmType: 'PM2.5', value: pm2_5 },
        { pmType: 'PM4', value: pm4 },
        { pmType: 'PM10', value: pm10 }
    ];

    const svgWidth = 300;
    const svgHeight = 200;

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select('#popup').append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.pmType))
        .padding(0.1);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, d => d.value)]);

    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    svg.append('g')
        .call(d3.axisLeft(y));

    svg.selectAll('.bar')
        .data(data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.pmType))
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.value))
        .attr('height', d => height - y(d.value))
        .style('fill', 'steelblue');
}

map.on('click', 'pmLayer', function (e) {
    const properties = e.features[0].properties;
    const pm1 = properties.pm1;
    const pm2_5 = properties.pm2_5;
    const pm4 = properties.pm4;
    const pm10 = properties.pm10;

    // Clear previous chart if exists
    d3.select('#popup').selectAll('svg').remove();

    // Generate bar chart in the popup
    generateBarChart(pm1, pm2_5, pm4, pm10);

    // Open popup at clicked location
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setDOMContent(document.getElementById('popup').firstChild) // Set SVG element as content
        .addTo(map);
});



///Download/////////////////////////////////////////////////////////////////////////////////////////


function downloadMap() {
    const canvas = document.getElementById('combinedCanvas');
    const ctx = canvas.getContext('2d');
    const mapContainer = document.getElementById('map');
    const layerList = document.getElementById('layerList');
  
    // Find the selected layer checkbox
    const selectedCheckbox = layerList.querySelector('.layer-checkbox:checked');
  
    if (!selectedCheckbox) {
      alert('Please select a layer to download.');
      return;
    }
  
    const layerId = selectedCheckbox.id;
  
    // Construct the legend container ID based on the layer ID
    const legendContainerId = layerId;
    const legendContainer = document.getElementById(legendContainerId);
  
    if (!legendContainer) {
      console.error(`Legend container with ID '${legendContainerId}' not found.`);
      return;
    }
  
    // Get the dimensions of the map container
    const width = mapContainer.offsetWidth;
    const height = mapContainer.offsetHeight;
  
    // Set canvas dimensions to match the map container's size
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
        html2canvas(layerList).then(legendCanvas => {
          // Draw the legend canvas onto the combined canvas
          ctx.drawImage(legendCanvas, 10, height - layerList.offsetHeight - 10); // Adjust position as needed
  
          // Trigger the image download
          const link = document.createElement('a');
          link.setAttribute('download', `map_with_${layerId}_legend.png`);
          link.setAttribute('href', canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
          link.click();
        });
      });
    }, 200); // Adjust this delay time as needed (in milliseconds)
  }
  