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
    vec4 green = vec4(0.0, 1.0, 0.0, 0.55);
    vec4 yellow = vec4(0.8, 0.6, 0.0, 0.55);
    vec4 red = vec4(0.6, 0.0, 0.05, 0.7);
    vec4 darkRed = vec4(0.4, 0.0, 0.0, 0.8);
    t = clamp(t, 0.0, 1.0);
    if (t < 0.4) {
        return mix(green, yellow, t / 0.4);
    }
    if (t < 0.8) {
        return mix(yellow, red, (t - 0.4) / 0.4);
    }
    return mix(red, darkRed, (t - 0.8) / 0.2);
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
    float averageCost = totalCost / float(uLocationCoordinatesCount);

    // Put the calculated cost on a scale from zero to one
    float minCost = calculateCost(uMinDistance);
    float maxCost = calculateCost(uMaxDistance);
    float res = clamp((averageCost - minCost) / (maxCost - minCost), 0.0, 1.0);

    // Compute heatmap
    vec4 resHeatmap = heatmap(res);

    // Mix the colours together
    vec3 resColor = mix(texelColor.rgb, resHeatmap.rgb, resHeatmap.a);
    gl_FragColor = vec4(resColor, 1.0);
}
