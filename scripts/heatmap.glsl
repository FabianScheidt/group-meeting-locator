// Cost parameters
uniform bool uCalculateCost;
uniform float uCostPerKilometer;
uniform float uThreshold1;
uniform float uThreshold1Cost;
uniform float uThreshold2;
uniform float uThreshold2Cost;

// Locations
uniform vec2 uLocationCoordinates[100];
uniform int uLocationCoordinatesCount;
uniform float uMinDistance;
uniform float uMaxDistance;

// Convert degrees to radians
float deg2rad(float deg) {
    return deg * 0.017453292519943295; // PI / 180.0
}

// Haversine distance in kilometers
float haversineDistance(vec2 coord1, vec2 coord2) {
    float lat1 = deg2rad(coord1.x);
    float lon1 = deg2rad(coord1.y);
    float lat2 = deg2rad(coord2.x);
    float lon2 = deg2rad(coord2.y);

    float dLat = lat2 - lat1;
    float dLon = lon2 - lon1;

    float havDLat = pow(sin(dLat / 2.0), 2.0);
    float havDLon = pow(sin(dLon / 2.0), 2.0);
    float havTheta = havDLat + cos(lat1) * cos(lat2) * havDLon;
    float theta = 2.0 * asin(sqrt(havTheta));

    float earthRadius = 6371.0; // in kilometers
    return earthRadius * theta;
}

// Cost based on distance in kilometers
float calculateCost(float distance) {
    float cost = distance * uCostPerKilometer;
    if (distance > uThreshold1) {
        cost += uThreshold1Cost;
    }
    if (distance > uThreshold2) {
        cost += uThreshold2Cost;
    }
    return cost;
}

// Maps a value to the heatmap containing RGB + alpha.
vec4 heatmap(float t) {
    const int count = 6;
    float positions[count];
    vec4 colors[count];

    // Green
    positions[0] = 0.0;
    colors[0] = vec4(68.0, 206.0, 27.0, 140.0) / 255.0;

    // Light Green
    positions[1] = 0.1;
    colors[1] = vec4(187.0, 219.0, 68.0, 140.0) / 255.0;

    // Yellow
    positions[2] = 0.2;
    colors[2] = vec4(247.0, 227.0, 121.0, 140.0) / 255.0;

    // Orange
    positions[3] = 0.5;
    colors[3] = vec4(242.0, 161.0, 52.0, 140.0) / 255.0;

    // Red
    positions[4] = 0.7;
    colors[4] = vec4(229.0, 31.0, 31.0, 180.0) / 255.0;

    // Dark Red
    positions[5] = 1.0;
    colors[5] = vec4(100.0, 0.0, 0.0, 200.0) / 255.0;

    t = clamp(t, 0.0, 1.0);
    for (int i = 0; i < count - 1; i++) {
        if (t >= positions[i] && t <= positions[i + 1]) {
            float localT = (t - positions[i]) / (positions[i + 1] - positions[i]);
            return mix(colors[i], colors[i + 1], localT);
        }
    }
}

void main(void) {
    // Load original map texture
    vec4 texelColor = texture2D(uTexture0, vec2(vTextureCoords.s, vTextureCoords.t));

    // Return a darkened version of the map if we don't have coordinates set.
    if (uLocationCoordinatesCount == 0) {
        gl_FragColor = mix(texelColor, vec4(0.0, 0.0, 0.0, 1.0), 0.5);
        return;
    }

    // Calculate the cost for the current coordinates
    float totalCost = 0.0;
    for (int i = 0; i < 100; ++i) {
        if (i >= uLocationCoordinatesCount) break;
        float distance = haversineDistance(uLocationCoordinates[i], vLatLngCoords.yx);
        totalCost += uCalculateCost ? calculateCost(distance) : distance;
    }

    // Put the calculated cost on a scale from zero to one
    float minCost = calculateCost(uMinDistance);
    float maxCost = calculateCost(uMaxDistance);
    float res = clamp((totalCost - minCost) / (maxCost - minCost), 0.0, 1.0);

    // Compute heatmap
    vec4 resHeatmap = heatmap(res);

    // Mix the colours together
    vec3 resColor = mix(texelColor.rgb, resHeatmap.rgb, resHeatmap.a);
    gl_FragColor = vec4(resColor, 1.0);
}
