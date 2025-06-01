class MapHandler {
    MAP_WRAPPER = document.getElementById('map');
    map;
    webglLayer;
    markers = [];
    meanMarker = null;

    async initialize() {
        // Initialize the map itself
        this.map = L.map(this.MAP_WRAPPER).setView([0, 0], 2);

        // Fetch the fragment shader
        const fragmentShaderReq = await fetch('./scripts/heatmap.glsl');
        const fragmentShader = await fragmentShaderReq.text();

        // Initialize the tile layer
        this.webglLayer = L.tileLayer
            .gl({
                fragmentShader: fragmentShader,
                tileUrls: ['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'],
                attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
                uniforms: { uPlaceholder: 0 },
            })
            .addTo(this.map);
    }

    updateSettings(settings) {
        const gl = this.webglLayer._gl;
        const loc = (locStr) => gl.getUniformLocation(this.webglLayer._glProgram, locStr);
        gl.uniform1f(loc('uCalculateCost'), settings.calculateCost);
        gl.uniform1f(loc('uCostPerKilometer'), settings.costPerKilometer);
        gl.uniform1f(loc('uThreshold1'), settings.threshold1);
        gl.uniform1f(loc('uThreshold1Cost'), settings.threshold1Cost);
        gl.uniform1f(loc('uThreshold2'), settings.threshold2);
        gl.uniform1f(loc('uThreshold2Cost'), settings.threshold2Cost);
        this.webglLayer.reRender();
    }

    updateCoordinates(coordinates, minDistance, maxDistance) {
        const coords = coordinates
            .map((c) => [c.lat, c.lng])
            .flat()
            .slice(0, 200);
        const padding = Array(200 - coords.length).fill(0);
        const locationCoordinates = new Float32Array([...coords, ...padding]);

        const gl = this.webglLayer._gl;
        const loc = (locStr) => gl.getUniformLocation(this.webglLayer._glProgram, locStr);
        gl.uniform2fv(loc('uLocationCoordinates'), locationCoordinates);
        gl.uniform1i(loc('uLocationCoordinatesCount'), coordinates.length);
        gl.uniform1f(loc('uMinDistance'), minDistance);
        gl.uniform1f(loc('uMaxDistance'), maxDistance);
        this.webglLayer.reRender();

        this.markers.forEach((m) => this.map.removeLayer(m));
        this.markers = coordinates.map((c) => L.marker([c.lat, c.lng]).addTo(this.map));
    }

    setMeanMarker(lat, lng) {
        if (this.meanMarker) {
            this.map.removeLayer(this.meanMarker);
        }
        this.meanMarker = L.marker([lat, lng], {
            draggable: true,
        }).addTo(mapHandler.map);
        this.meanMarker._icon.classList.add('mean-marker');
    }

    clearAllMarkers() {
        this.updateCoordinates([]);

        if (this.meanMarker) {
            this.map.removeLayer(this.meanMarker);
            this.meanMarker = null;
        }
    }
}
