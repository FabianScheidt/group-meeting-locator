let coords = [];
let heatLayer = null;
const totalDistanceElem = document.getElementById('total-distance');

const inputsHandler = new InputsHandler();
const settingsHandler = new SettingsHandler();
const mapHandler = new MapHandler();
const geocoder = new Geocoder();

function showTab(tabId) {
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

function computeDistance(latlng1, latlng2) {
    return mapHandler.map.distance(latlng1, latlng2) / 1000;
}

function computeCost(distance) {
    const settings = settingsHandler.getSettings();
    let cost = distance * settings.costPerKilometer;
    if (distance > settings.threshold1) cost += settings.threshold1Cost;
    if (distance > settings.threshold2) cost += settings.threshold2Cost;
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
    mapHandler.clearAllMarkers();
    coords = [];

    const locations = inputsHandler.getValues();

    const tasks = locations
        .map((value, i) => {
            inputsHandler.setErrorStr(i, '');
            inputsHandler.setDistanceStr(i, 'Distance: –');

            if (!value) return null;

            return geocoder.geocodeLocation(value).then((result) => {
                if (result) {
                    mapHandler.addMarker(result.lat, result.lon, result.display_name);
                    coords.push({ lat: result.lat, lon: result.lon });
                } else {
                    inputsHandler.setErrorStr(i, 'Location not found.');
                }
            });
        })
        .filter(Boolean);

    await Promise.all(tasks);

    if (heatLayer) mapHandler.map.removeLayer(heatLayer);

    if (coords.length > 0) {
        const useCost = document.getElementById('use-cost').checked;
        const median = geometricMedian(coords, useCost);

        mapHandler.setMeanMarker(median.lat, median.lng);
        mapHandler.meanMarker
            .bindPopup(useCost ? 'Optimal Location (Cost)' : 'Geometric Median')
            .on('drag', () => updateDistances(mapHandler.meanMarker.getLatLng()));
        mapHandler.map.setView([median.lat, median.lng], 6);

        await new Promise((resolve) => setTimeout(resolve, 300));

        updateDistances({ lat: median.lat, lng: median.lng });
        addHeatMapAround([median.lat, median.lng], useCost);
    } else {
        mapHandler.map.setView([0, 0], 2);
        totalDistanceElem.textContent = 'Total Distance: –';
    }
}

function updateDistances(center) {
    let total = 0;
    const useCost = document.getElementById('use-cost').checked;
    coords.forEach((c, i) => {
        const dist = computeDistance(center, { lat: c.lat, lng: c.lon });
        const value = useCost ? computeCost(dist) : dist;
        total += value;
        const distanceStr = useCost ? `Cost: ${value.toFixed(2)} €` : `Distance: ${dist.toFixed(2)} km`;
        inputsHandler.setDistanceStr(i, distanceStr);
    });
    totalDistanceElem.textContent = useCost
        ? `Total Cost: ${total.toFixed(2)} €`
        : `Total Distance: ${total.toFixed(1)} km`;
}

function addHeatMapAround(center, useCost) {
    const bounds = mapHandler.map.getBounds();
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
    }).addTo(mapHandler.map);
}

inputsHandler.initialize();
mapHandler.initialize();
updateMap();
