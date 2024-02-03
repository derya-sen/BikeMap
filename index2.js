mapboxgl.accessToken = 'pk.eyJ1IjoiZHNlbiIsImEiOiJjbG9ldTJnbGcwbDZjMnNyd3JjY29nbnZoIn0.Cyef_5fl6quIZuBhYqXQWg';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [0, 0],
  zoom: 2
});


const layers = {}


document.getElementById('csvFile').addEventListener('change', handleCSVUpload);


function handleCSVUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  // Zeige die Layer-Checkboxen an, wenn Dateien hochgeladen wurden
  const layerList = document.getElementById('layerList');
  layerList.style.display = 'block';


  reader.onload = () => {
    const csv = reader.result;
    const pointGeoJSON = csvToPointGeoJSON(csv);
    const lineGeoJSON = csvToLineGeoJSON(csv);
    console.log(pointGeoJSON)
    //console.log(pointGeoJSON);
    //console.log(lineGeoJSON)
    //addPointLayersToMap(pointGeoJSON, file.name);
    //addGradientLineLayerToMap(lineGeoJSON, file.name);
    //addCombinedPmPieChart(pointGeoJSON);
    //animatedLineLayer(lineGeoJSON);
    hotSpotLayer(pointGeoJSON)
    //animatePointLayer(pointGeoJSON, lineGeoJSON)

    /*
          // Retrieve temperature ranges from your data or define them
        const temperatureRanges = [
            { maxTemp: 10.2, color: '#0000ff' },    // Blue for temperatures <= 10°C
            { maxTemp: 10.4, color: '#00ff00' },   // Green for temperatures <= 20°C
            { maxTemp: 10.6, color: '#ffff00' },   // Yellow for temperatures <= 30°C
            { maxTemp: 10.8, color: '#ff6600' },   // Orange for temperatures <= 40°C
            { maxTemp: Infinity, color: '#ff0000' } // Red for temperatures > 40°C
          ];
          */

  };



  if (file) {
    reader.readAsText(file);
  }
}


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


function addPointLayersToMap(geoJSONLayer, layerName) {
  const sourceId = `source_${layerName.replace(/\.[^/.]+$/, '')}`; // Unique layer ID

  // Add a single source for all layers
  map.addSource(sourceId, {
    type: 'geojson',
    data: geoJSONLayer
  });

  const temperatureRanges = [
    { maxTemp: 10.2, color: '#0000ff' },    // Blue for temperatures <= 10°C
    { maxTemp: 10.4, color: '#00ff00' },   // Green for temperatures <= 20°C
    { maxTemp: 10.6, color: '#ffff00' },   // Yellow for temperatures <= 30°C
    { maxTemp: 10.8, color: '#ff6600' },   // Orange for temperatures <= 40°C
    { maxTemp: Infinity, color: '#ff0000' } // Red for temperatures > 40°C
  ];

  // Add a single layer with combined properties and filter for all temperature ranges
  map.addLayer({
    id: 'temperatureLayer',
    type: 'circle',
    source: sourceId,
    paint: {
      'circle-radius': 5,
      'circle-color': [
        'case',
        ['<=', ['get', 'temperature'], 10.2], '#0000ff',
        ['<=', ['get', 'temperature'], 10.4], '#00ff00',
        ['<=', ['get', 'temperature'], 10.6], '#ffff00',
        ['<=', ['get', 'temperature'], 10.8], '#ff6600',
        '#ff0000'
      ],
      'circle-opacity': 0.7
    },
    layout: {
      visibility: 'visible'
    }
  });

  // Create the legend based on temperature ranges
  createLegend(temperatureRanges);
  showLegend(); // Show the legend after creating it


  // Create a single toggle-button for all layers
  addLayerCheckbox('temperatureLayer', layerName, temperatureRanges);

  // Zoom to the bounds of the data
  const bounds = turf.bbox(geoJSONLayer);
  map.fitBounds(bounds, {
    padding: 10, // Adjust padding as needed
    maxZoom: 18 // Set maximum zoom level if necessary
  });
}


function hotSpotLayer(pointLayer) {
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
    'id': 'earthquakes-point',
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
   



  const bounds = turf.bbox(pointLayer);
  map.fitBounds(bounds, {
    padding: 10, // Adjust padding as needed
    maxZoom: 18 // Set maximum zoom level if necessary
  });

}

//Combined pie chart
function createCombinedPieChart(pm1Total, pm2_5Total, pm4Total, pm10Total, Layer) {
  const data = [pm1Total, pm2_5Total, pm4Total, pm10Total];
  const total = data.reduce((acc, val) => acc + val, 0);
  const percentages = data.map(value => ((value / total) * 100).toFixed(2));

  const averageValues = data.map((value, index) => (value / Layer.features.length).toFixed(2));
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
function calculateTotalPMValues(geoJSONLayer) {
  let pm1Total = 0,
    pm2_5Total = 0,
    pm4Total = 0,
    pm10Total = 0;

  geoJSONLayer.features.forEach(feature => {
    const { pm1, pm2_5, pm4, pm10 } = feature.properties;
    pm1Total += pm1;
    pm2_5Total += pm2_5;
    pm4Total += pm4;
    pm10Total += pm10;
  });

  return { pm1Total, pm2_5Total, pm4Total, pm10Total };
}

function addCombinedPmPieChart(geoJSONLayer) {
  const { pm1Total, pm2_5Total, pm4Total, pm10Total } = calculateTotalPMValues(geoJSONLayer);
  createCombinedPieChart(pm1Total, pm2_5Total, pm4Total, pm10Total, geoJSONLayer);
}

// Position the chart container on the top-right corner of the map
const chartContainer = document.getElementById('chart-container');
chartContainer.style.position = 'absolute';
chartContainer.style.top = '10px'; // Adjust top position as needed
chartContainer.style.right = '5px'; // Adjust right position as needed
chartContainer.style.zIndex = '1000'; // Ensure the container is above the map





function animatePointLayer(pointLayer, lineLayer) {
  map.addSource('route', {
    type: 'geojson',
    data: lineLayer // Replace with your GeoJSON file URL
  });

  map.addSource('point', {
    type: 'geojson',
    data: pointLayer
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

    map.addImage('custom-icon', image);

    map.addLayer({
      id: 'point',
      source: 'point',
      type: 'symbol',
      layout: {
        'icon-image': 'custom-icon',
        'icon-size': 0.01,
        'icon-rotate': ['get', 'bearing'],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true
      }

    })
  });

  const bounds = turf.bbox(lineLayer);
  map.fitBounds(bounds, {
    padding: 10, // Adjust padding as needed
    maxZoom: 18 // Set maximum zoom level if necessary
  });



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
    pointLayer.features[0].geometry.coordinates = lineLayer.features[0].geometry.coordinates[counter];
/*
    // Calculate the bearing to ensure the icon is rotated to match the route arc
    pointLayer.features[0].properties.bearing = turf.bearing(
      turf.point(start),
      turf.point(end)
    );
*/
    // Update the source with this new data
    map.getSource('point').setData(pointLayer);

    // Request the next frame of animation
    requestAnimationFrame(animate);
  }

  // Event listener for video play
  videoElement.addEventListener('play', () => {
    running = true;
    animate();
  });

  // Event listener for video pause
  videoElement.addEventListener('pause', () => {
    running = false;
  });
}








function addLayerCheckbox(layerId, layerName) {
  const layerList = document.getElementById('layerList');

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
    const legend = document.getElementById('legend');
    legend.style.display = e.target.checked ? 'block' : 'none';
  });

  const label = document.createElement('label');
  label.htmlFor = layerId;
  label.textContent = layerName;

  layerItem.appendChild(checkbox);
  layerItem.appendChild(label);
  layerList.appendChild(layerItem);

}

function createLegend(temperatureRanges) {
  const legend = document.createElement('div');
  legend.id = 'legend';
  legend.className = 'legend';
  legend.style.display = 'none'; // Initially hide the legend


  // Create legend items based on temperature ranges
  temperatureRanges.forEach(range => {
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
  });

  // Append the legend to the layer list container
  const layerList = document.getElementById('layerList');
  layerList.appendChild(legend);
}








/*
    function addLayerCheckbox(layerId, layerName) {
        const layerList = document.getElementById('layerList');
    
        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item';
    
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.className = 'layer-checkbox';
        checkbox.id = layerId;
        checkbox.addEventListener('change', function(e) {
            const visibility = e.target.checked ? 'visible' : 'none';
            map.setLayoutProperty(layerId, 'visibility', visibility);
            if (e.target.checked) {
                const bounds = new mapboxgl.LngLatBounds();
                if (layers[layerId]) { // Check if the layer exists in 'layers'
                    layers[layerId].forEach(feature => bounds.extend(feature.geometry.coordinates));
                    map.fitBounds(bounds, { padding: 20, maxZoom: 15 });
                } else {
                    console.error(`Layer with ID '${layerId}' not found in layers.`);
                }
            }

        });

    
        const label = document.createElement('label');
        label.htmlFor = layerId;
        label.textContent = layerName;
    
        layerItem.appendChild(checkbox);
        layerItem.appendChild(label);
        layerList.appendChild(layerItem);
    }
*/

function showLegend() {
  const legend = document.getElementById('legend');
  if (legend) {
    legend.style.display = 'block'; // Show the legend
  }
}


//////////////video/////////////////////////////////////////
function handleFileChange() {
  const input = document.getElementById('videoInput');
  const videoContainer = document.getElementById('videoContainer');
  const videoElement = document.getElementById('mapVideo');
  const videoSource = document.getElementById('videoSource');

  // Check if a file is selected
  if (input.files.length > 0) {
      const file = input.files[0];

      // Show the video container
      videoContainer.style.display = 'block';

      // Set the video source
      videoSource.src = URL.createObjectURL(file);

      // Reset the video element to apply the new source
      videoElement.load();
  } else {
      // Hide the video container if no file is selected
      videoContainer.style.display = 'none';
  }
}

function changePlaybackSpeed() {
            const videoElement = document.getElementById('mapVideo');
            const speedControl = document.getElementById('speedControl');
            const speedDisplay = document.getElementById('speedDisplay');
            const selectedSpeed = speedControl.value;

            // Set the playback speed of the video
            videoElement.playbackRate = parseFloat(selectedSpeed);

            // Update the displayed speed value
            speedDisplay.textContent = selectedSpeed + 'x';
        }

        
const videoElement = document.getElementById('mapVideo');







///////////////download function//////////////////////////////////////////////////////////////////////////////////////////
function downloadMap() {
  const canvas = document.getElementById('combinedCanvas');
  const ctx = canvas.getContext('2d');
  const mapContainer = document.getElementById('map');
  const legendContainer = document.getElementById('legend');

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