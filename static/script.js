// NYC Taxi Fare Predictor - Interactive Map JavaScript

// NYC Locations data
const NYC_LOCATIONS = {
    jfk: { pickup: { lat: 40.6413, lon: -73.7781 }, dropoff: { lat: 40.7580, lon: -73.9855 }, name: 'JFK → Times Square' },
    lga: { pickup: { lat: 40.7769, lon: -73.8740 }, dropoff: { lat: 40.7580, lon: -73.9855 }, name: 'LaGuardia → Times Square' },
    newark: { pickup: { lat: 40.6895, lon: -74.1745 }, dropoff: { lat: 40.7580, lon: -73.9855 }, name: 'Newark → Times Square' },
    manhattan: { pickup: { lat: 40.7831, lon: -73.9712 }, dropoff: { lat: 40.7484, lon: -73.9857 }, name: 'Manhattan → Empire State' },
    times_square: { pickup: { lat: 40.7580, lon: -73.9855 }, dropoff: { lat: 40.7614, lon: -73.9776 }, name: 'Times Square → St Patrick\'s' },
    central_park: { pickup: { lat: 40.7829, lon: -73.9654 }, dropoff: { lat: 40.7681, lon: -73.9817 }, name: 'Central Park → Columbus Circle' },
    wall_st: { pickup: { lat: 40.7074, lon: -74.0113 }, dropoff: { lat: 40.7580, lon: -73.9855 }, name: 'Wall St → Times Square' },
    brooklyn: { pickup: { lat: 40.7061, lon: -73.9969 }, dropoff: { lat: 40.7484, lon: -73.9857 }, name: 'Brooklyn → Empire State' }
};

// Map variables
let map;
let pickupMarker = null;
let dropoffMarker = null;
let routeLine = null;
let clickState = 0;

// Initialize the map when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    initForm();
});

function initMap() {
    // Create map centered on NYC
    map = L.map('map').setView([40.7580, -73.9855], 12);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Add click handler for setting markers
    map.on('click', onMapClick);
    
    // Set default date/time
    const now = new Date();
    document.getElementById('pickup_date').value = now.toISOString().split('T')[0];
    document.getElementById('pickup_time').value = now.toTimeString().slice(0, 5);
    
    // Set default NYC coordinates and show markers
    setDefaultCoordinates();
}

function initForm() {
    document.getElementById('fareForm').addEventListener('submit', handleSubmit);
    
    // Add input listeners to update map when coordinates change
    ['pickup_lat', 'pickup_lon', 'dropoff_lat', 'dropoff_lon'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateMarkersFromInputs);
    });
}

function onMapClick(e) {
    const { lat, lng } = e.latlng;
    
    if (clickState === 0 || clickState === 2) {
        // Set pickup location
        setPickupMarker(lat, lng);
        clickState = 1;
    } else if (clickState === 1) {
        // Set dropoff location
        setDropoffMarker(lat, lng);
        clickState = 2;
        drawRoute();
    }
    
    updateMapInstructions();
}

function setPickupMarker(lat, lon) {
    // Remove existing pickup marker
    if (pickupMarker) {
        map.removeLayer(pickupMarker);
    }
    
    // Create custom green icon
    const pickupIcon = L.divIcon({
        className: 'custom-marker pickup-marker',
        html: '<div style="width:24px;height:24px;background:#34a853;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;">A</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
    
    pickupMarker = L.marker([lat, lon], { icon: pickupIcon })
        .addTo(map)
        .bindPopup('<b>Pickup Location</b><br>Click to set dropoff')
        .openPopup();
    
    // Update form inputs
    document.getElementById('pickup_lat').value = lat.toFixed(6);
    document.getElementById('pickup_lon').value = lon.toFixed(6);
}

function setDropoffMarker(lat, lon) {
    // Remove existing dropoff marker
    if (dropoffMarker) {
        map.removeLayer(dropoffMarker);
    }
    
    // Remove existing route
    if (routeLine) {
        map.removeLayer(routeLine);
    }
    
    // Create custom red icon
    const dropoffIcon = L.divIcon({
        className: 'custom-marker dropoff-marker',
        html: '<div style="width:24px;height:24px;background:#ea4335;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;">B</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
    
    dropoffMarker = L.marker([lat, lon], { icon: dropoffIcon })
        .addTo(map)
        .bindPopup('<b>Dropoff Location</b><br>Click map to reset');
    
    // Update form inputs
    document.getElementById('dropoff_lat').value = lat.toFixed(6);
    document.getElementById('dropoff_lon').value = lon.toFixed(6);
}

function drawRoute() {
    if (!pickupMarker || !dropoffMarker) return;
    
    // Remove existing route
    if (routeLine) {
        map.removeLayer(routeLine);
    }
    
    const pickup = pickupMarker.getLatLng();
    const dropoff = dropoffMarker.getLatLng();
    
    // Draw a straight line route
    routeLine = L.polyline([pickup, dropoff], {
        color: '#1a73e8',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10'
    }).addTo(map);
    
    // Fit map to show both markers
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
}

function updateMapInstructions() {
    const instructions = document.querySelector('.map-instructions span:last-child');
    if (clickState === 0) {
        instructions.textContent = 'Click on map to set pickup location (green marker)';
    } else if (clickState === 1) {
        instructions.textContent = 'Pickup set! Click to set dropoff location (red marker)';
    } else {
        instructions.textContent = 'Route shown! Click map to reset and start over';
    }
}

function updateMarkersFromInputs() {
    const pickupLat = parseFloat(document.getElementById('pickup_lat').value);
    const pickupLon = parseFloat(document.getElementById('pickup_lon').value);
    const dropoffLat = parseFloat(document.getElementById('dropoff_lat').value);
    const dropoffLon = parseFloat(document.getElementById('dropoff_lon').value);
    
    if (!isNaN(pickupLat) && !isNaN(pickupLon)) {
        setPickupMarker(pickupLat, pickupLon);
    }
    
    if (!isNaN(dropoffLat) && !isNaN(dropoffLon)) {
        setDropoffMarker(dropoffLat, dropoffLon);
        drawRoute();
        clickState = 2;
    } else {
        clickState = 1;
    }
    
    updateMapInstructions();
}

function focusOnPickup() {
    if (pickupMarker) {
        map.setView(pickupMarker.getLatLng(), 15);
        pickupMarker.openPopup();
    } else {
        alert('Please set a pickup location first by clicking on the map.');
    }
}

function focusOnDropoff() {
    if (dropoffMarker) {
        map.setView(dropoffMarker.getLatLng(), 15);
        dropoffMarker.openPopup();
    } else {
        alert('Please set a dropoff location first by clicking on the map.');
    }
}

function resetMap() {
    if (pickupMarker) {
        map.removeLayer(pickupMarker);
        pickupMarker = null;
    }
    if (dropoffMarker) {
        map.removeLayer(dropoffMarker);
        dropoffMarker = null;
    }
    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
    clickState = 0;
    updateMapInstructions();
    map.setView([40.7580, -73.9855], 12);
}

function setDefaultCoordinates() {
    // Set default values for pickup and dropoff
    document.getElementById('pickup_lat').value = '40.7128';
    document.getElementById('pickup_lon').value = '-74.0060';
    document.getElementById('dropoff_lat').value = '40.7580';
    document.getElementById('dropoff_lon').value = '-73.9855';
    
    // Add markers to map
    updateMarkersFromInputs();
}

function setLocation(locationType) {
    const loc = NYC_LOCATIONS[locationType];
    if (!loc) return;
    
    // Clear previous markers
    resetMap();
    
    // Set pickup
    document.getElementById('pickup_lat').value = loc.pickup.lat;
    document.getElementById('pickup_lon').value = loc.pickup.lon;
    setPickupMarker(loc.pickup.lat, loc.pickup.lon);
    
    // Set dropoff
    document.getElementById('dropoff_lat').value = loc.dropoff.lat;
    document.getElementById('dropoff_lon').value = loc.dropoff.lon;
    setDropoffMarker(loc.dropoff.lat, loc.dropoff.lon);
    
    // Draw route
    drawRoute();
    clickState = 2;
    updateMapInstructions();
    
    // Show feedback
    const instructions = document.querySelector('.map-instructions span:last-child');
    instructions.textContent = 'Loaded: ' + loc.name;
}

async function handleSubmit(event) {
    event.preventDefault();
    const btn = document.querySelector('.predict-btn');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Calculating...';
    
    const data = {
        pickup_latitude: parseFloat(document.getElementById('pickup_lat').value),
        dropoff_latitude: parseFloat(document.getElementById('dropoff_lat').value),
        pickup_longitude: parseFloat(document.getElementById('pickup_lon').value),
        dropoff_longitude: parseFloat(document.getElementById('dropoff_lon').value),
        pickup_datetime: document.getElementById('pickup_date').value + 'T' + document.getElementById('pickup_time').value + ':00',
        precipitation: parseFloat(document.getElementById('precipitation').value) || 0,
        max_temp: parseFloat(document.getElementById('max_temp').value) || 20
    };
    
    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('fareAmount').textContent = '$' + result.predicted_fare;
            document.getElementById('distanceKm').textContent = result.distance_km;
            document.getElementById('distanceMiles').textContent = result.distance_miles;
            document.getElementById('modelUsed').textContent = result.model_used.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            document.getElementById('results').style.display = 'block';
            
            // Scroll to results
            document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>��</span> Predict Fare';
    }
}
