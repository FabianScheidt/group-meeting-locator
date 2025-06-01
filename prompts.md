# Prompts

This app is 98% created by ChatGPT. Here are the prompts that made it happen:

> I'm looking to build a web app that helps to find the best location for a group of people to meet, minimizing the overall travel time. Can you help me write the code for that?
>
> Requirements:
> - The web page should show some configuration on the left side and a map that visualizes the result on the right side.
> - On the left side, it should be possible to enter a list of people and their location. It should be possible to enter any amount of people and their location.
> - Each location input should be geocoded and visualized on the map on the right side
> - The UI should compute the mean of all entered locations and visualize it using a separate pin on the map
> - The web app should be built using plain HTML, CSS and Javascript with no build tooling. Its ok to add external dependencies using a public CDN.

> This mostly works. Can you do the following changes?
> - Remove the integrity checks for external dependencies, as they seem to fail.
> - Compute the distance in Kilometer to the mean location for each entered location and show it next to the text input.
> - Allow to move the calculated mean location via drag and drop and update the distances accordingly.

> Can you also output the sum of all distances?

> Great! Two enhancements:
> - Can we store the state of the inputs in local storage?
> - Do we need to implement haversine ourselves or could we rely on something in leaflet?

> Would it be possible to overlay the map with a heat map that encodes the total distance at each coordinate?

> The heat map only shows a blurry blue box around the mean location. I was expecting the following:
> - The heap map should cover the entire visible map.
> - It should be green in the location that minimizes the sum of all distances.
> - It should be yellow and red in the locations with a higher sum of distances.

> The heat map still does not work as expected. Can you please update addHeatMapAround, so that:
> - The points of the heatmap as sampled in a grid relative the the current viewport (e.g., using leaflets map.getBounds or some other method)
> - The values are normalized to the minimum and maximum sampled point, so that the minimum point will be 0.0 and the maximum will be 1.0

> Please write a Readme.md file about the app. Please mention that it was created in collaboration with ChatGPT.

> Can you adjust the code to place the marker at the actual geometric median instead of just the average coordinates?

> The calculation of the location where the cost is minimal does not always find the ideal location. Can you use a grid-based optimization approach instead?

> Can you update the code so that:
> - Geocoding uses concurrent requests
> - Cost is shown in EUR
> - Settings are shown in a separate tab
