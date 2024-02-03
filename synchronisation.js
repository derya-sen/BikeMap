
/*
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
  
    const steps = lineLayer.features.length;
    let running = false;
    function animate() {
      running = true;
      document.getElementById('replay').disabled = true;
      const start =
      lineLayer.features[0].geometry.coordinates[
        counter >= steps ? counter - 1 : counter
        ];
      const end =
      lineLayer.features[0].geometry.coordinates[
        counter >= steps ? counter : counter + 1
        ];
      if (!start || !end) {
        running = false;
        document.getElementById('replay').disabled = false;
        return;
      }
      // Update point geometry to a new position based on counter denoting
      // the index to access the arc
      pointLayer.features[0].geometry.coordinates =
      lineLayer.features[0].geometry.coordinates[counter];
  
      // Calculate the bearing to ensure the icon is rotated to match the route arc
      // The bearing is calculated between the current point and the next point, except
      // at the end of the arc, which uses the previous point and the current point
      pointLayer.features[0].properties.bearing = turf.bearing(
        turf.point(start),
        turf.point(end)
      );
  
      // Update the source with this new data
      map.getSource('point').setData(pointLayer);
  
      // Request the next frame of animation as long as the end has not been reached
      if (counter < steps) {
        requestAnimationFrame(animate);
      }
  
      counter = counter + 1;
    }
  
    document.getElementById('replay').addEventListener('click', () => {
      if (running) {
        void 0;
      } else {
        // Set the coordinates of the original point back to origin
        pointLayer.features[0].geometry.coordinates = origin;
  
        // Update the source layer
        map.getSource('point').setData(pointLayer);
  
        // Reset the counter
        counter = 0;
  
        // Restart the animation
        animate(counter);
      }
    });
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
  
  */



  

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
  
    animate();
  }


  let counter = 0;
    let running = false;
  
    function animate() {
      running = true;
      const start = lineLayer.features[0].geometry.coordinates[counter];
      const end = lineLayer.features[0].geometry.coordinates[counter + 1];
  
      if (!start || !end) {
        running = false;
        return;
      }
  
      // Update point geometry to a new position based on counter denoting
      // the index to access the arc
      pointGeoJSON.features[0].geometry.coordinates = lineGeoJSON.features[0].geometry.coordinates[counter];
  
      // Calculate the bearing to ensure the icon is rotated to match the route arc
      pointGeoJSON.features[0].properties.bearing = turf.bearing(
        turf.point(start),
        turf.point(end)
      );
  
      // Update the source with this new data
      map.getSource('point').setData(pointGeoJSON);
  
      // Request the next frame of animation as long as the end has not been reached
      if (counter < steps - 1 && running) {
        requestAnimationFrame(animate);
      } else {
        running = false;
      }
  
      counter = counter + 1;
    }
  
    // Event listener for video playback
    videoElement.addEventListener('timeupdate', () => {
      const videoTime = videoElement.currentTime;
      const videoDuration = videoElement.duration;
  
      // Map video time to the corresponding step in the GeoJSON data
      counter = Math.floor((videoTime / videoDuration) * steps);
  
      // Start or resume animation based on video playback
      if (!running) {
        animate();
      }
    });
  
    // Event listener for replay button
    document.getElementById('replay').addEventListener('click', () => {
      // Set the coordinates of the original point back to origin
      pointGeoJSON.features[0].geometry.coordinates = lineGeoJSON.features[0].geometry.coordinates[0];
  
      // Update the source layer
      map.getSource('point').setData(pointGeoJSON);
  
      // Reset the counter
      counter = 0;
  
      // Restart the animation
      animate();
    });
  


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
  
  