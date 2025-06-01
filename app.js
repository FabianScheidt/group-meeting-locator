let coords = [];
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

function geometricMedian(costMode) {
    // Since our cost function is not continuous, we can't rely on optimization techniques like Weiszfeld’s
    // algorithm or gradient descent. Instead, we just sample points in a grid and pick the best one.

    const minLat = Math.min(...coords.map((c) => c.lat));
    const maxLat = Math.max(...coords.map((c) => c.lat));
    const minLng = Math.min(...coords.map((c) => c.lng));
    const maxLng = Math.max(...coords.map((c) => c.lng));
    const step = 0.05;

    let bestPoint = null;
    let bestValue = Infinity;

    for (let lat = minLat; lat <= maxLat; lat += step) {
        for (let lng = minLng; lng <= maxLng; lng += step) {
            const total = coords.reduce((acc, c) => {
                const dist = computeDistance({ lat, lng }, { lat: c.lat, lng: c.lng });
                return acc + (costMode ? computeCost(dist) : dist);
            }, 0);
            if (total < bestValue) {
                bestValue = total;
                bestPoint = { lat, lng };
            }
        }
    }
    return bestPoint;
}

async function geocodeAllInputs() {
    const locations = inputsHandler.getValues();
    const tasks = locations
        .map((value, i) => {
            inputsHandler.setErrorStr(i, '');
            inputsHandler.setDistanceStr(i, 'Distance: –');

            if (!value) return null;

            return geocoder.geocodeLocation(value).then((result) => {
                if (result) {
                    return { lat: result.lat, lng: result.lon };
                } else {
                    inputsHandler.setErrorStr(i, 'Location not found.');
                }
            });
        })
        .filter(Boolean);
    coords = await Promise.all(tasks);
    coords = coords.filter(Boolean);
}

async function updateMap() {
    mapHandler.clearAllMarkers();
    await geocodeAllInputs();

    const settings = settingsHandler.getSettings();
    mapHandler.updateSettings(settings);

    // Todo: Figure out proper way to scale the heatmap
    const minDistance = settings.calculateCost ? 200 : 60;
    const maxDistance = settings.calculateCost ? 600 : 150;
    mapHandler.updateCoordinates(coords, minDistance, maxDistance);

    if (coords.length > 0) {
        const median = geometricMedian(settings.calculateCost);

        mapHandler.setMeanMarker(median.lat, median.lng);
        mapHandler.meanMarker
            .bindPopup(settings.calculateCost ? 'Optimal Location (Cost)' : 'Geometric Median')
            .on('drag', () => updateDistances(mapHandler.meanMarker.getLatLng()));
        mapHandler.map.setView([median.lat, median.lng], 6);

        updateDistances(median);
    } else {
        mapHandler.map.setView([0, 0], 2);
        totalDistanceElem.textContent = 'Total Distance: –';
    }
}

function updateDistances(center) {
    let total = 0;

    const settings = settingsHandler.getSettings();
    coords.forEach((c, i) => {
        const dist = computeDistance(center, { lat: c.lat, lng: c.lng });
        const value = settings.calculateCost ? computeCost(dist) : dist;
        total += value;
        const distanceStr = settings.calculateCost ? `Cost: ${value.toFixed(2)} €` : `Distance: ${dist.toFixed(2)} km`;
        inputsHandler.setDistanceStr(i, distanceStr);
    });
    totalDistanceElem.textContent = settings.calculateCost
        ? `Total Cost: ${total.toFixed(2)} €`
        : `Total Distance: ${total.toFixed(1)} km`;
}

(async () => {
    inputsHandler.initialize();
    await mapHandler.initialize();
    updateMap();
})();
