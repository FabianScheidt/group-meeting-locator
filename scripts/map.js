class MapHandler {
    MAP_WRAPPER = document.getElementById('map');
    map;
    markers = [];
    meanMarker = null;

    initialize() {
        this.map = L.map(this.MAP_WRAPPER).setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        }).addTo(this.map);
    }

    addMarker(lat, lng, displayName) {
        const marker = L.marker([lat, lng]).addTo(this.map).bindPopup(displayName);
        this.markers.push(marker);
    }

    setMeanMarker(lat, lng) {
        if (this.meanMarker) {
            this.map.removeLayer(this.meanMarker);
        }
        this.meanMarker = L.marker([lat, lng], {
            draggable: true,
            icon: L.icon({
                iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
            }),
        }).addTo(mapHandler.map);
    }

    clearAllMarkers() {
        markers.forEach((marker) => this.map.removeLayer(marker));
        this.markers = [];

        if (this.meanMarker) {
            this.map.removeLayer(this.meanMarker);
            this.meanMarker = null;
        }
    }
}
