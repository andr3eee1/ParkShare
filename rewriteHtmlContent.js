const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Map.tsx', 'utf8');

if (!content.includes('useMemo')) {
  content = content.replace("import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';", "import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useMemo } from 'react';");
}

const oldHtmlStart = `  const htmlContent = (() => {
    const spotsJson = JSON.stringify(spots).replace(/</g, '\\\\u003c');
    const destinationCoordinates = getDestinationCoordinates(destination);

    const userLocationMarker = userLocation ? \`
      L.marker([\${userLocation.latitude}, \${userLocation.longitude}], {
        icon: L.divIcon({
          className: 'user-leaflet-marker',
          html: '<div class="user-location-dot"><div class="user-location-pulse"></div></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        }),
        zIndexOffset: 3000
      }).addTo(map);
    \` : '';

    const destinationMarker = destination ? \`
      var destinationMarker = L.marker([\${destinationCoordinates[0]}, \${destinationCoordinates[1]}], {
        icon: L.divIcon({
          className: 'destination-leaflet-marker',
          html: '<div class="destination-marker"></div>',
          iconSize: [28, 34],
          iconAnchor: [14, 34]
        }),
        zIndexOffset: 2000
      }).addTo(map);
      function updateDestinationVisibility() {
        if (!destinationMarker) return;
        if (map.getZoom() < \${DESTINATION_ZOOM_THRESHOLD}) {
          if (map.hasLayer(destinationMarker)) map.removeLayer(destinationMarker);
        } else if (!map.hasLayer(destinationMarker)) {
          destinationMarker.addTo(map);
        }
      }
      map.on('zoomend', updateDestinationVisibility);
    \` : 'var destinationMarker = null;';`;

const newHtmlStart = `  const htmlContent = useMemo(() => {
    const spotsJson = JSON.stringify(spots).replace(/</g, '\\\\u003c');`;

content = content.replace(oldHtmlStart, newHtmlStart);

const oldScriptInit = `        <script>
          var map = L.map('map', { zoomControl: false }).setView([\${destinationCoordinates[0]}, \${destinationCoordinates[1]}], 14.5);`;

const newScriptInit = `        <script>
          var map = L.map('map', { zoomControl: false }).setView([44.4820, 26.1130], 14.5);
          var destinationMarker = null;
          var userLocationMarker = null;
          
          function updateDestinationVisibility() {
            if (!destinationMarker) return;
            if (map.getZoom() < \${DESTINATION_ZOOM_THRESHOLD}) {
              if (map.hasLayer(destinationMarker)) map.removeLayer(destinationMarker);
            } else if (!map.hasLayer(destinationMarker)) {
              destinationMarker.addTo(map);
            }
          }
          map.on('zoomend', updateDestinationVisibility);
          
          function setDestination(lat, lng) {
            if (destinationMarker) {
              map.removeLayer(destinationMarker);
            }
            if (lat !== null && lng !== null) {
              destinationMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                  className: 'destination-leaflet-marker',
                  html: '<div class="destination-marker"></div>',
                  iconSize: [28, 34],
                  iconAnchor: [14, 34]
                }),
                zIndexOffset: 2000
              });
              updateDestinationVisibility();
            } else {
              destinationMarker = null;
            }
          }

          function setUserLocation(lat, lng) {
            if (userLocationMarker) {
              map.removeLayer(userLocationMarker);
            }
            if (lat !== null && lng !== null) {
              userLocationMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                  className: 'user-leaflet-marker',
                  html: '<div class="user-location-dot"><div class="user-location-pulse"></div></div>',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                }),
                zIndexOffset: 3000
              }).addTo(map);
            } else {
              userLocationMarker = null;
            }
          }`;

content = content.replace(oldScriptInit, newScriptInit);

const oldMarkerInjection = `          \${destinationMarker}
          \${userLocationMarker}
          renderSpots();`;

const newMarkerInjection = `          renderSpots();`;

content = content.replace(oldMarkerInjection, newMarkerInjection);

content = content.replace(`    \`;\n  })();`, `    \`;\n  }, [spots]);`);

fs.writeFileSync('frontend/src/components/Map.tsx', content);
