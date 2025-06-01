let map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
}).addTo(map);

let personCount = 0;
let personInputs = document.getElementById('inputs');
let markers = [];
let meanMarker = null;
let coords = [];
let heatLayer = null;
const totalDistanceElem = document.getElementById('total-distance');

function showTab(tabId) {
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

function saveInputsToLocalStorage() {
    const values = Array.from(document.querySelectorAll('#inputs input[type=text]')).map((input) => input.value.trim());
    localStorage.setItem('locations', JSON.stringify(values));
}

function loadInputsFromLocalStorage() {
    const saved = JSON.parse(localStorage.getItem('locations') || '[]');
    saved.forEach((value) => addPersonInput(value));
    if (saved.length > 0) {
        updateMap();
    }
}

function addPersonInput(value = '') {
    const div = document.createElement('div');
    div.className = 'person-input';
    div.innerHTML = `
        <div class="top-row">
            <input type="text" placeholder="Location" id="person-${personCount}" value="${value}" onchange="saveInputsToLocalStorage()" />
            <button onclick="this.parentElement.parentElement.remove(); saveInputsToLocalStorage();">X</button>
        </div>
        <div class="distance" id="distance-${personCount}">Distance: –</div>
        <div class="error-message" id="error-${personCount}"></div>
    `;
    personInputs.appendChild(div);
    personCount++;
}

function getGeocodeCache(location) {
    const cache = JSON.parse(localStorage.getItem('geocodes') || '{}');
    return cache[location];
}

function setGeocodeCache(location, value) {
    const cache = JSON.parse(localStorage.getItem('geocodes') || '{}');
    cache[location] = value;
    localStorage.setItem('geocodes', JSON.stringify(cache));
}

async function geocodeLocation(location) {
    const cache = getGeocodeCache(location);
    if (cache) {
        return cache;
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        if (data.length === 0) return null;
        const res = {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            display_name: data[0].display_name,
        };
        setGeocodeCache(location, res);
        return res;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

function computeDistance(latlng1, latlng2) {
    return map.distance(latlng1, latlng2) / 1000;
}

function computeCost(distance) {
    const costPerKm = parseFloat(document.getElementById('cost-per-km').value);
    const threshold1 = parseFloat(document.getElementById('threshold1').value);
    const cost1 = parseFloat(document.getElementById('cost1').value);
    const threshold2 = parseFloat(document.getElementById('threshold2').value);
    const cost2 = parseFloat(document.getElementById('cost2').value);
    let cost = distance * costPerKm;
    if (distance > threshold1) cost += cost1;
    if (distance > threshold2) cost += cost2;
    return cost;
}

function geometricMedian(coords, costMode) {
    const minLat = Math.min(...coords.map((c) => c.lat));
    const maxLat = Math.max(...coords.map((c) => c.lat));
    const minLon = Math.min(...coords.map((c) => c.lon));
    const maxLon = Math.max(...coords.map((c) => c.lon));
    const step = 0.1;

    let bestPoint = null;
    let bestValue = Infinity;

    for (let lat = minLat; lat <= maxLat; lat += step) {
        for (let lon = minLon; lon <= maxLon; lon += step) {
            const total = coords.reduce((acc, c) => {
                const dist = computeDistance({ lat, lng: lon }, { lat: c.lat, lng: c.lon });
                return acc + (costMode ? computeCost(dist) : dist);
            }, 0);
            if (total < bestValue) {
                bestValue = total;
                bestPoint = { lat, lng: lon };
            }
        }
    }
    return bestPoint;
}

async function updateMap() {
    markers.forEach((marker) => map.removeLayer(marker));
    markers = [];
    coords = [];

    const inputs = document.querySelectorAll('#inputs input[type=text]');
    const distances = document.querySelectorAll('.distance');
    const errors = document.querySelectorAll('.error-message');

    const tasks = Array.from(inputs)
        .map((input, i) => {
            const value = input.value.trim();
            const distanceElem = distances[i];
            const errorElem = errors[i];

            errorElem.textContent = '';
            distanceElem.textContent = 'Distance: –';

            if (!value) return null;

            return geocodeLocation(value).then((result) => {
                if (result) {
                    const marker = L.marker([result.lat, result.lon]).addTo(map).bindPopup(result.display_name);
                    markers.push(marker);
                    coords.push({ lat: result.lat, lon: result.lon, distanceElem });
                } else {
                    errorElem.textContent = 'Location not found.';
                }
            });
        })
        .filter(Boolean);

    await Promise.all(tasks);

    if (meanMarker) map.removeLayer(meanMarker);
    if (heatLayer) map.removeLayer(heatLayer);

    if (coords.length > 0) {
        const useCost = document.getElementById('use-cost').checked;
        const median = geometricMedian(coords, useCost);

        meanMarker = L.marker([median.lat, median.lng], {
            draggable: true,
            icon: L.icon({
                iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
            }),
        })
            .addTo(map)
            .bindPopup(useCost ? 'Optimal Location (Cost)' : 'Geometric Median')
            .on('drag', () => updateDistances(meanMarker.getLatLng()));

        map.setView([median.lat, median.lng], 6);
        await new Promise((resolve) => setTimeout(resolve, 300));

        updateDistances({ lat: median.lat, lng: median.lng });
        addHeatMapAround([median.lat, median.lng], useCost);
    } else {
        map.setView([0, 0], 2);
        totalDistanceElem.textContent = 'Total Distance: –';
    }
}

function updateDistances(center) {
    let total = 0;
    const useCost = document.getElementById('use-cost').checked;
    coords.forEach((c) => {
        const dist = computeDistance(center, { lat: c.lat, lng: c.lon });
        const value = useCost ? computeCost(dist) : dist;
        total += value;
        c.distanceElem.textContent = useCost ? `Cost: ${value.toFixed(2)} €` : `Distance: ${dist.toFixed(2)} km`;
    });
    totalDistanceElem.textContent = useCost
        ? `Total Cost: ${total.toFixed(2)} €`
        : `Total Distance: ${total.toFixed(1)} km`;
}

function addHeatMapAround(center, useCost) {
    const bounds = map.getBounds();
    const step = 0.1;
    const heatData = [];
    const values = [];

    for (let lat = bounds.getSouth(); lat <= bounds.getNorth(); lat += step) {
        for (let lon = bounds.getWest(); lon <= bounds.getEast(); lon += step) {
            const total = coords.reduce((acc, c) => {
                const dist = computeDistance({ lat, lng: lon }, { lat: c.lat, lng: c.lon });
                return acc + (useCost ? computeCost(dist) : dist);
            }, 0);
            values.push(total);
            heatData.push([lat, lon, total]);
        }
    }

    const min = values.reduce((v1, v2) => (v1 < v2 ? v1 : v2));
    const max = values.reduce((v1, v2) => (v1 > v2 ? v1 : v2));

    const normalizedData = heatData.map(([lat, lon, val]) => [lat, lon, (val - min) / (max - min)]);

    heatLayer = L.heatLayer(normalizedData, {
        radius: 0,
        blur: 0,
        maxZoom: 10,
        max: 0.5,
        gradient: { 0.0: 'green', 0.5: 'yellow', 1.0: 'red' },
    }).addTo(map);
}

loadInputsFromLocalStorage();
if (personCount === 0) addPersonInput();
