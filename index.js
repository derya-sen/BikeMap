mapboxgl.accessToken = 'pk.eyJ1IjoiZHNlbiIsImEiOiJjbG9ldTJnbGcwbDZjMnNyd3JjY29nbnZoIn0.Cyef_5fl6quIZuBhYqXQWg';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [0, 0],
  zoom: 2
});


// // Variable zum Speichern der hinzugefügten Layer
// const layers = {};

// document.getElementById('csvFile').addEventListener('change', function(e) {
//     const files = e.target.files;

//     if (files.length > 0) {
//         // Zeige die Layer-Checkboxen an, wenn Dateien hochgeladen wurden
//         const layerList = document.getElementById('layerList');
//         layerList.style.display = 'block';
//       }

//     for (let i = 0; i < files.length; i++) {
//         const file = files[i];
//         const reader = new FileReader();
//         reader.onload = function(e) {
  
//         if (file.name.toLowerCase().includes('temperature')) {
//             const csv = e.target.result;
//             const geoJSON = csvToPointsGeoJSON(csv); 
//             addPointLayerToMap(geoJSON, file.name);

//         } else if (file.name.toLowerCase().includes('beschleunigung')) {
//             const csv = e.target.result;
//             const geoJSON = csvToLineStringGeoJSON(csv); 
//             console.log(geoJSON)
//             addLineLayerToMap(geoJSON, file.name);
//         } else {
//             // Handle other types of data or set a default
//             dataType = 'unknown';
//         }
//       };
//       reader.readAsText(file);
//   }
// }
// )
  

// function csvToPointsGeoJSON(csv) {
//     const lines = csv.split('\n'); 
//     const headers = lines[0].split(',');
//     const features = [];
  
//     for (let i = 1; i < lines.length; i++) {
//       const currentLine = lines[i].split(',');
//       const feature = {
//         type: 'Feature',
//         properties: {},
//         geometry: {
//           type: 'Point', 
//           coordinates: [parseFloat(currentLine[1]), parseFloat(currentLine[0])] 
//         }
//       };
  
//       for (let j = 2; j < headers.length; j++) {
//         feature.properties[headers[j]] = currentLine[j];
//       }
  
//       features.push(feature);
//     }
  
//     return {
//       type: 'FeatureCollection',
//       features: features
//     };
//   }

  
//   function csvToLineStringGeoJSON(csv) {
//     const lines = csv.split('\n');
//     const headers = lines[0].split(',');
//     const coordinates = [];
//     const features = [];
  
//     for (let i = 0; i < lines.length-1; i++) {
//       const currentLine = lines[i].split(',');
  
//       // Iterate through columns starting from the third column (index 2)
//     for (let j = 2; j < currentLine.length - 1; j++) {
//         // Check if the column contains valid latitude and longitude
//         const latitude = parseFloat(currentLine[0]);
//         const longitude = parseFloat(currentLine[1]);
        
//         if (!isNaN(latitude) && !isNaN(longitude)) {
//           coordinates.push([longitude, latitude]); // Add coordinates to the LineString
//         }
//       }

//       const feature = {
//         type: 'Feature',
//         properties: {},
//         geometry: {
//           type: 'LineString', 
//           coordinates: coordinates 
//         }
//       };
  
//       for (let j = 2; j < headers.length; j++) {
//         feature.properties[headers[j]] = currentLine[j];
//       }
  
//       features.push(feature);
//     }
  
//     return {
//       type: 'FeatureCollection',
//       features: features
//     };
//     }
  
    
  

  
 
  
//  // Funktion zum Hinzufügen eines GeoJSON-Layers zur Karte
// function addPointLayerToMap(geojson, layerName) {
//     const layerId = layerName.replace(/\.[^/.]+$/, ''); // Entferne die Dateiendung für den Layer-ID
//     if (!map.getSource(layerId)) {
//       map.addSource(layerId, {
//         type: 'geojson',
//         data: geojson
//       });
//       map.addLayer({
//         id: layerId,
//         type: 'circle', // Beispiel-Layertyp (kann je nach Daten angepasst werden)
//         source: layerId,
//         paint: {
//           'circle-radius': 5,
//           'circle-color': '#' + ((Math.random() * 0xFFFFFF) << 0).toString(16) // Zufällige Farbe für jeden Layer
//         },
//         layout: {
//           visibility: 'visible' // Layer standardmäßig sichtbar machen
//         }
//       });
//       //Toggle-Button
//     layers[layerId] = geojson.features; // Speichere die Features des Layers
//     addLayerCheckbox(layerId, layerName); // Füge Checkbox für den Layer hinzu

//     }

//     //Zoom
//     const bounds = turf.bbox(geojson); // Assuming you have turf.js library for bbox
//         // Fit the map to the bounds of the data
//         map.fitBounds(bounds, {
//         padding: 20, // Adjust padding as needed
//         maxZoom: 15, // Set maximum zoom level if necessary
//         });
// }

// // Funktion zum Hinzufügen eines GeoJSON-Layers zur Karte
// function addLineLayerToMap(geojson, layerName) {
//     const layerId = layerName.replace(/\.[^/.]+$/, ''); // Entferne die Dateiendung für den Layer-ID
//     if (!map.getSource(layerId)) {
//         map.addSource(layerId, {
//             type: 'geojson',
//             data: geojson
//           });
//           map.addLayer({
//             id: layerId,
//             type: 'line',
//             source: layerId,
//             paint: {
//               'line-color': '#FF0000', // Red color for the line (you can change this)
//               'line-width': 2, // Adjust line width as needed
//             },
              
//             layout: {
//                 'line-join': 'round',
//                 'line-cap': 'round'
//               },
//               visibility: 'visible' // Ensure layer visibility is set to visible
//             });
//             //Toggle-Button
//             layers[layerId] = geojson.features; // Speichere die Features des Layers
//             addLayerCheckbox(layerId, layerName); // Füge Checkbox für den Layer hinzu

//         }

        
//         //Zoom
//         const bounds = turf.bbox(geojson); // Assuming you have turf.js library for bbox
//         // Fit the map to the bounds of the data
//         map.fitBounds(bounds, {
//         padding: 20, // Adjust padding as needed
//         maxZoom: 15, // Set maximum zoom level if necessary
//         });
//     }


//     function addLayerCheckbox(layerId, layerName) {
//         const layerList = document.getElementById('layerList');
    
//         const layerItem = document.createElement('div');
//         layerItem.className = 'layer-item';
    
//         const checkbox = document.createElement('input');
//         checkbox.type = 'checkbox';
//         checkbox.checked = true;
//         checkbox.className = 'layer-checkbox';
//         checkbox.id = layerId;
//         checkbox.addEventListener('change', function(e) {
//             const visibility = e.target.checked ? 'visible' : 'none';
//             map.setLayoutProperty(layerId, 'visibility', visibility);
//             if (e.target.checked) {
//                 const bounds = new mapboxgl.LngLatBounds();
//                 if (layers[layerId]) { // Check if the layer exists in 'layers'
//                     layers[layerId].forEach(feature => bounds.extend(feature.geometry.coordinates));
//                     map.fitBounds(bounds, { padding: 20, maxZoom: 15 });
//                 } else {
//                     console.error(`Layer with ID '${layerId}' not found in layers.`);
//                 }
//             }

//         });

    
//         const label = document.createElement('label');
//         label.htmlFor = layerId;
//         label.textContent = layerName;
    
//         layerItem.appendChild(checkbox);
//         layerItem.appendChild(label);
//         layerList.appendChild(layerItem);
//     }

// // Function to handle video upload
// document.getElementById('videoFile').addEventListener('change', handleVideoUpload);

// function handleVideoUpload(event) {
//   const file = event.target.files[0];
//   const video = document.getElementById('mapVideo');
//   const videoContainer = document.getElementById('videoContainer');
//   const reader = new FileReader();

//   reader.onload = () => {
//     video.src = reader.result;
//     videoContainer.style.display = 'block'; // Show the video container after upload
//   };

//   if (file) {
//     if (file.type.match('video.*')) {
//       reader.readAsDataURL(file);
//     } else {
//       alert('Please select a valid video file.');
//     }
//   }
// }

// // Functionality for toggle buttons and layer display
// // Implement code to toggle layers and show/hide legends

// // Functionality for download button
// document.getElementById('downloadButton').addEventListener('click', () => {
//   // Implement code to generate an image of the map with layers and enable download
// });




function handleCSVUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
  
    reader.onload = () => {
      const csv = reader.result;
      const pointGeoJSON = csvToPointGeoJSON(csv);
      const lineGeoJSON = csvToLineGeoJSON(csv);
      console.log(pointGeoJSON);
      console.log(lineGeoJSON)
      //addPointLayersToMap(pointGeoJSON, file.name);
      addLineLayerToMap(lineGeoJSON, file.name)
    };
  
    if (file) {
      reader.readAsText(file);
    }
  }
  /*
  function csvToGeoJSON(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].replace('\r', '').split(',');
    console.log(headers)
  
    const sensorData = {
      timestamp:[],  
      temperature: [],
      humidity: [],
      pm1: [],
      pm2_5: [],
      pm4: [],
      pm10: [],
      acceleration_x: [],
      acceleration_y: [],
      acceleration_z: [],
      distance_l: [],
      speed: [],
      latitude: [],
      longitude: []
    };

    
  
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(',');
  
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j].toLowerCase();
        const value = currentLine[j];
  
        if (header in sensorData && !isNaN(parseFloat(value))) {
          sensorData[header].push(parseFloat(value));
        }
      }
    }
  
    const geoJSONLayers = {};
  
    for (const sensorType in sensorData) {
      const features = [];
      if (sensorData[sensorType].length > 0) {
        for (let i = 0; i < sensorData[sensorType].length; i++) {
          const feature = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [sensorData['longitude'][i], sensorData['latitude'][i]]
            }
          };
          feature.properties[sensorType] = sensorData[sensorType][i];
          features.push(feature);
        }
        geoJSONLayers[sensorType] = {
          type: 'FeatureCollection',
          features: features
        };
      }
    }

  
    return geoJSONLayers;
  }
  
  */
 
  function addPointLayersToMap(geoJSONLayer, layerName) {
    const layerId = layerName.replace(/\.[^/.]+$/, ''); // Entferne die Dateiendung für den Layer-ID
    map.addSource(layerId, {
        type: 'geojson',
        data: geoJSONLayer
      });
      for (const sensorType in geoJSONLayer) {
        map.addLayer({
          id: sensorType,
          type: 'circle',
          source: {
            type: 'geojson',
            data: geoJSONLayer
          },
          paint: {
            'circle-radius': 5,
            'circle-color': '#FF0000'// Define colors based on sensor type
          },
          layout: {
            visibility: 'visible'
          }
        });
      }
    }
  /*
  function getColorForSensor(sensorType) {
    // Define colors based on sensor type
    // Return a color code or variable based on the sensor type
    // For example:
    if (sensorType === 'temperature') {
      return '#FF0000'; // Red for temperature
    } else if (sensorType === 'acceleration') {
      return '#00FF00'; // Green for acceleration
    }
    // Define colors for other sensor types as needed
    return '#000000'; // Default color
  }
  */

  document.getElementById('csvFile').addEventListener('change', handleCSVUpload);


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



  function addLineLayerToMap(geojson, layerName) {
        const layerId = layerName.replace(/\.[^/.]+$/, ''); // Entferne die Dateiendung für den Layer-ID
            map.addSource(layerId, {
                type: 'geojson',
                data: geojson
              });
              map.addLayer({
                id: layerId,
                type: 'line',
                source: layerId,
                paint: {
                  'line-color': '#0000ff', // Red color for the line (you can change this)
                  'line-width': 2, // Adjust line width as needed
                },
                  
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                  },
                  visibility: 'visible' // Ensure layer visibility is set to visible
                });
        }
