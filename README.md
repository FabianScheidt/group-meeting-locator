# Group Meeting Locator

**Group Meeting Locator** is a browser-based web application that helps a group of people find an optimal meeting location by minimizing total travel distances. It provides a simple interface for entering participant locations, visualizes these on an interactive map, and suggests a central meeting point based on geographical mean. The app includes a dynamic heat map to visualize optimality across the map.

## Features

- Enter any number of people and their locations
- Automatically geocodes location names to coordinates using OpenStreetMap Nominatim
- Shows all locations on an interactive Leaflet map
- Computes and marks the geographic mean of all locations
- Supports a configurable cost function to reflect travel time and accommodation
- Allows dragging the suggested meeting point to see how total travel distance or cost changes
- Displays individual distances to the meeting point and the total distance
- Persists entered locations in local storage for convenience
- Adds a heat map overlay showing the relative optimality of all areas in the current map view

## How It Works

- The app uses Leaflet.js for interactive mapping and geospatial calculations.
- Geocoding is performed via the Nominatim API.
- Distance calculations use Leaflet's built-in methods (based on Haversine).
- Heat maps are generated with `leaflet.heat`, normalized across the current viewport to highlight optimal regions.

## Usage

1. Open the demo page: https://fabianscheidt.github.io/group-meeting-locator/
2. Enter the names or addresses of participants in the left sidebar.
3. Click **"Update Map"** to visualize locations and compute the optimal meeting point.
4. Optionally, drag the red marker to adjust the meeting point manually.
5. View distances and total travel effort, as well as a heat map of alternative options.

## Dependencies

- [Leaflet.js](https://leafletjs.com/) (Map rendering and utilities)
- [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat) (Heat map overlay)
- [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) (Geocoding)

All dependencies are loaded via public CDNs—no build tools required.

## License

This project is open source and free to use under the MIT License.

---

**Made with HTML, JavaScript, CSS and a touch of AI.**
