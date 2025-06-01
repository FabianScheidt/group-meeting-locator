class Geocoder {
    getCache(location) {
        const cache = JSON.parse(localStorage.getItem('geocodes') || '{}');
        return cache[location];
    }

    setCache(location, value) {
        const cache = JSON.parse(localStorage.getItem('geocodes') || '{}');
        cache[location] = value;
        localStorage.setItem('geocodes', JSON.stringify(cache));
    }

    async geocodeLocation(location) {
        const cache = this.getCache(location);
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
            this.setCache(location, res);
            return res;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }
}
