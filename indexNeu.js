//Generate Mapbox Map
mapboxgl.accessToken = 'pk.eyJ1IjoiZHNlbiIsImEiOiJjbG9ldTJnbGcwbDZjMnNyd3JjY29nbnZoIn0.Cyef_5fl6quIZuBhYqXQWg';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [0, 0],
    zoom: 2
});

// Add navigation control
map.addControl(new mapboxgl.NavigationControl());



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


const layers = {}
var csvFile;
var videoFile;
var pointGeoJSON;
var lineGeoJSON;



//Upload function for csv-File
function handleCSVUpload(event) {

    //removeAllLayersAndSources();

    csvFile = event.target.files[0];
    const reader = new FileReader();

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
/*
function removeAllLayersAndSources() {
    // Remove all layers
    map.getStyle().layers.forEach(layer => {
        if (layer.id !== 'background' && layer.id !== 'sky') { // Skip default layers
            map.removeLayer(layer.id);
        }
    });

    // Manually keep track of sources or use a separate array to store source IDs
    const sourceIds = ['temperature', 'pmLayer', 'acceleration', 'distance', 'humidity'];

    // Remove all sources
    sourceIds.forEach(sourceId => {
        map.removeSource(sourceId);
    });

    // Remove all images
    map.listImages().forEach(imageName => {
        map.removeImage(imageName);
    });
}

*/

//Upload function for Video-file
function handleFileChange() {

    // Check if a file is selected and show it on the container
    if (videoInput.files.length > 0) {
        videoFile = videoInput.files[0];
        videoContainer.style.display = 'block';
        videoSource.src = URL.createObjectURL(videoFile);
        videoElement.load();
    } else {
        videoContainer.style.display = 'none';
    }


}

//Function to change playback speed of the video
function changePlaybackSpeed() {
    const selectedSpeed = speedControl.value;
    videoElement.playbackRate = parseFloat(selectedSpeed);
    speedDisplay.textContent = selectedSpeed + 'x';
}


//Function to create Geojson with point-features
function csvToPointGeoJSON(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const features = [];

    let latitudeIndex = -1;
    let longitudeIndex = -1;
    let timestampIndex = -1;

    for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase().trim();
        if (header.includes('latitude')) {
            latitudeIndex = i;
        } else if (header.includes('longitude')) {
            longitudeIndex = i;
        } else if (header.includes('timestamp')) {
            timestampIndex = i;
        }
    }

    if (latitudeIndex !== -1 && longitudeIndex !== -1 && timestampIndex !== -1) {
        for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i].split(',');
            const latitude = parseFloat(currentLine[latitudeIndex]);
            const longitude = parseFloat(currentLine[longitudeIndex]);
            const timestamp = currentLine[timestampIndex];


            if (!isNaN(latitude) && !isNaN(longitude)) {
                const coordinates = [longitude, latitude];

                const feature = {
                    type: 'Feature',
                    properties: {
                        timestamp: new Date(timestamp).toISOString()
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: coordinates
                    }
                };

                for (let j = 0; j < headers.length; j++) {
                    if (!isNaN(parseFloat(currentLine[j])) && headers[j].trim() !== '' && j !== timestampIndex) {
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


//Function to create Geojson with line-features
function csvToLineGeoJSON(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const features = [];
    const coordinates = [];

    let latitudeIndex = -1;
    let longitudeIndex = -1;

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


// Function to zoom to added Layer
function zoomLayer(layer) {
    const bounds = turf.bbox(layer);
    map.fitBounds(bounds, {
        padding: 10, 
        maxZoom: 20 
    });
}

//Function to add the layert to checkbox to hide and show them on the map
function addLayerCheckbox(layerId, legendId) {
    const layerList = document.getElementById('layerList');

    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.className = 'layer-checkbox';
    checkbox.id = layerId;
    const legend = document.getElementById(legendId);
    checkbox.addEventListener('change', function (e) {
        const visibility = e.target.checked ? 'visible' : 'none';
        map.setLayoutProperty(layerId, 'visibility', visibility);
        legend.style.display = e.target.checked ? 'block' : 'none';
    });

    const label = document.createElement('label');
    label.htmlFor = layerId;
    label.textContent = layerId;

    layerList.appendChild(layerItem);
    layerList.appendChild(legend);
    layerItem.appendChild(checkbox);
    layerItem.appendChild(label);

    // Add a divider after the legend
    const divider = document.createElement('hr');
    layerList.appendChild(divider);
}


//Function to create a layer with temperature data
function createTemperatureLayer(pointLayer) {
    const temperatureValues = pointLayer.features.map(feature => feature.properties.temperature);

    // Get max. and min. temperature values to create a suitable range
    const minTemperature = Math.min(...temperatureValues);
    const maxTemperature = Math.max(...temperatureValues);
    const temperatureSteps = 5; 
    const stepSize = (maxTemperature - minTemperature) / temperatureSteps;

    const temperatureRanges = [];

    // Generate temperature ranges
    for (let i = 0; i < temperatureSteps; i++) {
        const rangeStart = minTemperature + i * stepSize;
        const rangeEnd = rangeStart + stepSize;

        temperatureRanges.push({ start: rangeStart, end: rangeEnd });
    }

    // Create color stops for temperature interpolation
    const colorStops = temperatureRanges.flatMap((range, index) => [
        range.start,
        getColorForTemperature(index)
    ]);

    map.addSource('temperature', {
        type: 'geojson',
        data: pointLayer
    });

    map.addLayer({
        id: 'Temperatur',
        type: 'circle',
        source: 'temperature',
        paint: {
            'circle-radius': 6,
            'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'temperature'],
                ...colorStops,
            ],
            'circle-opacity': 0.9
        },
        layout: {
            visibility: 'visible'
        }
    });

    createTemperatureLegend(temperatureRanges);
    addLayerCheckbox('Temperatur', 'temperatureLegend');
    zoomLayer(pointLayer);
}

// Function to create the suited colors for each range
function getColorForTemperature(rangeIndex) {
    const colors = ['#FFD700', '#FFA500', '#FF7256', '#FF4500', '#CD0000', 'gray'];
    return colors[rangeIndex % colors.length];
}


//Function creates a popup to show temperature (in °C) data on click on a point
map.on('click', 'Temperatur', (e) => {
    const temperature = e.features[0].properties.temperature;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<p>Temperatur: ${temperature.toFixed(2)}°C</p>`)
        .addTo(map);
});


//Function to create a Legend for temperature data
function createTemperatureLegend(temperatureRanges) {
    const legendItem = document.createElement('div');
    legendItem.id = 'temperatureLegend';
    legendItem.className = 'legend-item';

    temperatureRanges.forEach((range, i) => { 
        const legendContainer = document.createElement('div');
        legendContainer.className = 'legend-container';

        const legendSymbol = document.createElement('div');
        legendSymbol.className = 'legend-symbol';
        legendSymbol.style.background = getColorForTemperature(i);

        const legendText = document.createElement('span');
        legendText.textContent = `${range.start.toFixed(1)} - ${range.end.toFixed(1)}°C`;
        legendText.className = 'legend-text';

        legendContainer.appendChild(legendSymbol);
        legendContainer.appendChild(legendText);

        legendItem.appendChild(legendContainer);
        legendItem.appendChild(document.createElement('br'));
    });

    layerList.appendChild(legendItem);
}



//Function to add a layer with data about distance values
//It filters values < 1.5 meters.
function createDistanceLayer(pointLayer) {
    map.addSource('distance', {
        type: 'geojson',
        data: pointLayer
    });

    map.loadImage('abstand.png', (error, image) => {
        if (error) throw error;

        map.addImage('distance-icon', image);

        map.addLayer({
            id: 'Abstand',
            type: 'symbol',
            source: 'distance',
            filter: ['<', ['get', 'distance_l'], 150],
            layout: {
                'icon-image': 'distance-icon',
                'icon-size': 0.03,
            },
        })
    });

    createDistanceLegend('abstand.png');
    addLayerCheckbox('Abstand', 'distanceLegend');
    zoomLayer(pointLayer);
}

//Function creates a popup to show distance value (in m) on click on a specific point
map.on('click', 'Abstand', (e) => {
    const distance = e.features[0].properties.distance_l;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<p>Abstand: ${distance.toFixed(1)}m</p>`)
        .addTo(map);
});


//Function creates a legend for the distance layer
function createDistanceLegend(legendIcon) {
    const legendItem = document.createElement('div');
    legendItem.id = `distanceLegend`;
    legendItem.className = 'legend-item';
    legendItem.style.display = 'flex';

    const legendIconElement = document.createElement('div');
    legendIconElement.className = legendIcon;
    legendIconElement.innerHTML = `<img src="${legendIcon}" alt="icon" class="legend-icon"/>`;
    legendIconElement.style.marginRight = '8px'; 

    const legendLabel = document.createElement('div');
    legendLabel.className = 'legend-label';
    legendLabel.innerHTML = 'Abstand < 1.5 Meters';
    legendLabel.style.flex = '1'; // This makes the label take up the available space

    legendItem.appendChild(legendIconElement);
    legendItem.appendChild(legendLabel);
    layerList.appendChild(legendItem);
}


//Acceleration layer
//Function to add a layer with data about distance values
//It filters values < 1.5 meters.
function createAccelerationLayer(pointLayer) {
    map.addSource('acceleration', {
        type: 'geojson',
        data: pointLayer
    });

    map.loadImage('erschütterung.png', (error, image) => {
        if (error) throw error;

        map.addImage('acceleration-icon', image);

        map.addLayer({
            id: 'Erschütterung',
            type: 'symbol',
            source: 'acceleration',
            filter: ['>', ['get', 'acceleration_z'], 10],
            layout: {
                'icon-image': 'acceleration-icon',
                'icon-size': 0.03,
            },
        })
    });

    createAccelerationLegend('erschütterung.png');
    addLayerCheckbox('Erschütterung', 'accelerationLegend');
    zoomLayer(pointLayer);
}

//Function creates a popup to show distance value (in m) on click on a specific point
map.on('click', 'Erschütterung', (e) => {
    const acceleration = e.features[0].properties.acceleration_z;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<p>Erschütterung: ${acceleration.toFixed(1)}m/s^2</p>`)
        .addTo(map);
});


//Function creates a legend for the distance layer
function createAccelerationLegend(legendIcon) {
    const legendItem = document.createElement('div');
    legendItem.id = `accelerationLegend`;
    legendItem.className = 'legend-item';
    legendItem.style.display = 'flex';

    const legendIconElement = document.createElement('div');
    legendIconElement.className = legendIcon;
    legendIconElement.innerHTML = `<img src="${legendIcon}" alt="icon" class="legend-icon"/>`;
    legendIconElement.style.marginRight = '8px'; 

    const legendLabel = document.createElement('div');
    legendLabel.className = 'legend-label';
    legendLabel.innerHTML = 'Erschütterung > 10 m/s^2';
    legendLabel.style.flex = '1'; // This makes the label take up the available space

    legendItem.appendChild(legendIconElement);
    legendItem.appendChild(legendLabel);
    layerList.appendChild(legendItem);
}





//Function creates a layer that shows the route and adds it to the map
//Also it adds a layer with a symbol that shows the start positin.
function animatePointLayer(pointLayer, lineLayer) {
    map.addSource('route', {
        type: 'geojson',
        data: lineLayer 
    });

    const firstPointFeature = pointLayer.features[0];
    map.addSource('point', {
        type: 'geojson',
        data: firstPointFeature
    });

    map.addLayer({
        id: 'Route',
        source: 'route',
        type: 'line',
        paint: {
            'line-width': 3,
            'line-color': '#007cbf'
        }
    });

    map.loadImage('fahrrad.png', (error, image) => {
        if (error) throw error;

        map.addImage('bike-icon', image);

        map.addLayer({
            id: 'Start',
            source: 'point',
            type: 'symbol',
            layout: {
                'icon-image': 'bike-icon',
                'icon-size': 0.02,
                'icon-rotation-alignment': 'map',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
            }

        })
    });


    zoomLayer(lineLayer);
    //createBikeLegend('fahrrad.png')
    //addLayerCheckbox('Start', `bikeLegend`);


    let running = false;

    //Function animates the route synchronized to the video when its played and stops when video stops
    function animateRoute() {
        if (!running) return;

        const videoTime = videoElement.currentTime;
        const totalDuration = videoElement.duration;
        const routeCoordinates = lineLayer.features[0].geometry.coordinates;
        const fraction = videoTime / totalDuration;
        const endIndex = Math.floor(fraction * (routeCoordinates.length - 1));
        const slicedCoordinates = routeCoordinates.slice(0, endIndex);

        const slicedLineFeature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: slicedCoordinates
            }
        };

        const index = fraction * (routeCoordinates.length - 1);
        const startIndex = Math.floor(index);

        map.getSource('route').setData(slicedLineFeature);

        const speedValue = pointLayer.features[startIndex].properties.speed;
        updateSpeedometer(speedValue);

        requestAnimationFrame(animateRoute);
    }

    /*
    //Function 
    function toggleAnimation() {
        tachometer.classList.toggle('playing', !videoElement.paused);
    }
*/

    // Event listener when video is played
    videoElement.addEventListener('play', () => {
        running = true;
        animateRoute();
        //toggleAnimation();
    });

    // Event listener when video is paused
    videoElement.addEventListener('pause', () => {
        running = false;
        //toggleAnimation();
    });

    //Event listener when video ends
    videoElement.addEventListener('ended', () => {
        running = false;
        //toggleAnimation();
        tachometer.classList.remove('playing');
        needle.style.transform = 'translate(-50%, -50%) rotate(-90deg)';
        const speedometerText = `⌀ ${Math.round(averageSpeed)} km/h<br>🛣️ ${distance.toFixed(2)} km<br> ⏱️ ${time.toFixed(2)} h`;
        speedometerValue.innerHTML = speedometerText;
    });
}
   

/*
//Function creates legend for the start position
function createBikeLegend(legendIcon) {
    const legendItem = document.createElement('div');
    legendItem.id = `bikeLegend`;
    legendItem.className = 'legend-item';
    legendItem.style.display = 'flex';

    const legendIconElement = document.createElement('div');
    legendIconElement.className = legendIcon;
    legendIconElement.innerHTML = `<img src="${legendIcon}" alt="icon" class="legend-icon"/>`;
    legendIconElement.style.marginRight = '8px'; 
/*
    const legendLabel = document.createElement('div');
    legendLabel.className = 'legend-label';
    legendLabel.innerHTML = 'Start position';
    legendLabel.style.flex = '1'; 

    legendItem.appendChild(legendIconElement);
   // legendItem.appendChild(legendLabel);
    layerList.appendChild(legendItem);
}
*/



//Function calculates total distance of the route
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

//Function to calculate distance (in km) between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; 
    return distance;
}

// Function to convert degrees to radians
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

//Function calculates total time of the whole route
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
var time;
var distance;
//Function calculates average speed (in km/h) depending on total distance and time
function calculateAverageSpeed(geojson) {
    time = calculateTime(geojson);
    distance = calculateTotalDistance(geojson);
    averageSpeed = distance / time;


    const speedometerText = `⌀ ${Math.round(averageSpeed)} km/h<br>🛣️ ${distance.toFixed(2)} km<br> ⏱️ ${time.toFixed(2)} h`;

    // Update the speedometer value with the concatenated text
    speedometerValue.innerHTML = speedometerText;
}


// Function to update the speedometer's value
function updateSpeedometer(speedValue) {
    speedometerValue.textContent = `${Math.round(speedValue)} km/h`;
}



//Function creates layer for humidity values
function createHumidityLayer(pointLayer) {
    const humidityValues = pointLayer.features.map(feature => feature.properties.humidity);
    const minHumidity = Math.min(...humidityValues);
    const maxHumidity = Math.max(...humidityValues);
    const humiditySteps = 5;
    const humidityStepSize = (maxHumidity - minHumidity) / humiditySteps;
    
    const humidityRanges = [];
    for (let i = 0; i < humiditySteps; i++) {
        const rangeStart = minHumidity + i * humidityStepSize;
        const rangeEnd = rangeStart + humidityStepSize;
        humidityRanges.push({ start: rangeStart, end: rangeEnd });
    }

    const colorStops = humidityRanges.flatMap((range, index) => [
        range.start,
        getColorForHumidity(index)
    ]);

    map.addSource('humidity', {
        type: 'geojson',
        data: pointLayer
    });

    map.addLayer({
        id: 'Luftfeuchtigkeit',
        type: 'circle',
        source: 'humidity',
        paint: {
            'circle-radius': 6,
            'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'humidity'],
                ...colorStops,
            ],
            'circle-opacity': 0.9
        },
        layout: {
            visibility: 'visible'
        }
    });

    createHumidityLegend(humidityRanges);
    addLayerCheckbox('Luftfeuchtigkeit', 'humidityLegend');
    zoomLayer(pointLayer);
}

//Function creates colors for humidity values and ranges
function getColorForHumidity(rangeIndex) {
    const colors = ['#87ceff', '#5cacee', '#4876ff', '#0000cd', '#000080', 'gray'];
    return colors[rangeIndex % colors.length];
}

//Function creates suitable legend for humidity layer
function createHumidityLegend(humidityRanges) {
    const legendItem = document.createElement('div');
    legendItem.id = 'humidityLegend';
    legendItem.className = 'legend-item';

    const legendLabel = document.createElement('div');
    legendLabel.className = 'legend-label';

    legendItem.appendChild(legendLabel);

    for (let i = 0; i < humidityRanges.length; i++) {
        const legendContainer = document.createElement('div');
        legendContainer.className = 'legend-container';

        const legendSymbol = document.createElement('div');
        legendSymbol.className = 'legend-symbol';

        const color = getColorForHumidity(i); 
        legendSymbol.style.background = color;

        const legendText = document.createElement('span');
        legendText.textContent = `${humidityRanges[i].start.toFixed(1)} - ${humidityRanges[i].end.toFixed(1)}%`;
        legendText.className = 'legend-text';

        legendContainer.appendChild(legendSymbol);
        legendContainer.appendChild(legendText);

        legendItem.appendChild(legendContainer);
        legendItem.appendChild(document.createElement('br'));
    }

    layerList.appendChild(legendItem);
}



//Function to get humidity value on a specific point
map.on('click', 'Luftfeuchtigkeit', (e) => {
    const humidity = e.features[0].properties.humidity;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<p>Luftfeuchtigkeit: ${humidity.toFixed(1)}%</p>`)
        .addTo(map);
});



var pmRanges = [
    { min: 0, max: 10, color: '#00ced1', label: 'Sehr gut' },
    { min: 11, max: 20, color: '#008b8b', label: 'Gut' },
    { min: 21, max: 25, color: '#ffd700', label: 'Mäßig' },
    { min: 26, max: 50, color: '#ff3030', label: 'Schlecht' },
    { min: 51, max: Infinity, color: '#8b1a1a', label: 'Sehr schlecht' }
];

// Function creates a geojson object that includes the total sum of PM values
function calculateAndGenerateFeatureCollection(geoJSONLayer) {
    const featureCollection = {
        type: 'FeatureCollection',
        features: []
    };

    geoJSONLayer.features.forEach(feature => {
        const { pm1, pm2_5, pm4, pm10 } = feature.properties;
        const totalSum = pm1 + pm2_5 + pm4 + pm10;
        const totalSumFixed = Math.round(totalSum);

        let color = '#FFFFFF'; 
        for (const range of pmRanges) {
            if (totalSumFixed >= range.min && totalSumFixed <= range.max) {
                color = range.color;
                break;
            }
        }

        const pmfeature = {
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

        featureCollection.features.push(pmfeature);
    });

    return featureCollection;
}

//Function creates a layer with total sum of pm-values
function createPMLayer(geoJSONLayer) {
    const featureCollection = calculateAndGenerateFeatureCollection(geoJSONLayer);

    map.addSource('pmLayer', {
        type: 'geojson',
        data: featureCollection
    });

    map.addLayer({
        id: 'Feinstaub',
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
    addLayerCheckbox('Feinstaub', 'pmLegend')
    zoomLayer(geoJSONLayer);
}

//Function creates a suited legend for pm-layer
function createPmLegend(pmRanges) {
    const legendItem = document.createElement('div');
    legendItem.id = 'pmLegend';
    legendItem.className = 'legend-item';

    pmRanges.forEach(range => {
        const legendContainer = document.createElement('div');
        legendContainer.className = 'legend-container';

        const legendSymbol = document.createElement('div');
        legendSymbol.className = 'legend-symbol';
        legendSymbol.style.background = range.color; 

        const legendText = document.createElement('span');
        legendText.textContent = `${range.label} (${range.min}-${range.max})`;
        legendText.className = 'legend-text';

        legendContainer.appendChild(legendSymbol);
        legendContainer.appendChild(legendText);

        legendItem.appendChild(legendContainer);
        legendItem.appendChild(document.createElement('br'));
    });

    layerList.appendChild(legendItem);
}


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

//Function creates bar chart that shows value for each pm-data
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

//Function show the created bar chart on click on a point
map.on('click', 'Feinstaub', function (e) {
    const properties = e.features[0].properties;
    const pm1 = properties.pm1;
    const pm2_5 = properties.pm2_5;
    const pm4 = properties.pm4;
    const pm10 = properties.pm10;

    d3.select('#popup').selectAll('svg').remove();
    generateBarChart(pm1, pm2_5, pm4, pm10);

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setDOMContent(document.getElementById('popup').firstChild) // Set SVG element as content
        .addTo(map);
});





function downloadMap() {
    const canvas = document.getElementById('combinedCanvas');
    const ctx = canvas.getContext('2d');
    const mapContainer = document.getElementById('map');
    const layerList = document.getElementById('layerList');
    const tachometer = document.getElementById('tachometer');

    const selectedCheckbox = layerList.querySelector('.layer-checkbox:checked');

    if (!selectedCheckbox) {
        alert('Please select a layer to download.');
        return;
    }

    const layerId = selectedCheckbox.id;
    const legendContainerId = layerId;
    const legendContainer = document.getElementById(legendContainerId);

    if (!legendContainer) {
        console.error(`Legend container with ID '${legendContainerId}' not found.`);
        return;
    }

    const width = mapContainer.offsetWidth;
    const height = mapContainer.offsetHeight;

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    map.panBy([1, 0]);

    setTimeout(() => {
        map.once('render', () => {
            ctx.drawImage(map.getCanvas(), 0, 0, canvas.width, canvas.height);

            html2canvas(layerList).then(legendCanvas => {
                ctx.drawImage(legendCanvas, 10, height - layerList.offsetHeight - 10);

                    // Create a download link
                    const link = document.createElement('a');
                    link.setAttribute('download', `map_with_${layerId}_legend_and_tachometer.png`);
                    link.setAttribute('href', canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
                    link.click();
                });
        });
    }, 200);
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









//const needle = document.querySelector('.needle');
const needle = document.getElementById('needle')
var speedValue;

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




