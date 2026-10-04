import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { tokens } from '../theme/tokens';

let MapContainer: any, TileLayer: any, Marker: any, DivIcon: any, useMapEvents: any;
if (Platform.OS === 'web') {
  require('leaflet/dist/leaflet.css');
  const RL = require('react-leaflet');
  MapContainer = RL.MapContainer;
  TileLayer = RL.TileLayer;
  Marker = RL.Marker;
  useMapEvents = RL.useMapEvents;
  const L = require('leaflet');
  DivIcon = L.divIcon;
}

interface MapDestination {
  name: string;
  latitude: number;
  longitude: number;
}

const getDestinationCoordinates = (destination?: MapDestination): [number, number] => (
  destination ? [destination.latitude, destination.longitude] : [44.4820, 26.1130]
);

export const Map = forwardRef(({ spots, selectedSpot, onSelectSpot, destination }: {
  spots: any[];
  selectedSpot: any;
  onSelectSpot: (spot: any) => void;
  destination?: MapDestination;
}, ref) => {
  const webviewRef = useRef<WebView>(null);
  const webMapRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (Platform.OS === 'web' && webMapRef.current) {
        webMapRef.current.zoomIn();
      } else if (webviewRef.current) {
        webviewRef.current.injectJavaScript(`if (typeof map !== 'undefined') { map.zoomIn(); } true;`);
      }
    },
    zoomOut: () => {
      if (Platform.OS === 'web' && webMapRef.current) {
        webMapRef.current.zoomOut();
      } else if (webviewRef.current) {
        webviewRef.current.injectJavaScript(`if (typeof map !== 'undefined') { map.zoomOut(); } true;`);
      }
    }
  }));

  const getCoordinates = (spot: any): [number, number] => {
    if (typeof spot.latitude === 'number' && typeof spot.longitude === 'number') {
      return [spot.latitude, spot.longitude];
    }

    const baseLat = 44.4820;
    const baseLng = 26.1130;
    const lat = baseLat + (parseFloat(spot.y) - 50) * -0.0003; 
    const lng = baseLng + (parseFloat(spot.x) - 50) * 0.0003;
    return [lat, lng];
  };

  useEffect(() => {
    const targetCoordinates = selectedSpot
      ? getCoordinates(selectedSpot)
      : getDestinationCoordinates(destination);

    if (Platform.OS === 'web' && webMapRef.current) {
      webMapRef.current.panTo(targetCoordinates);
    } else if (webviewRef.current) {
      let script = `if (typeof updateSelection === 'function') { updateSelection('${selectedSpot?.id || ''}'); }`;
      script += `if (typeof map !== 'undefined') { map.panTo([${targetCoordinates[0]}, ${targetCoordinates[1]}]); }`;
      script += 'true;';
      webviewRef.current.injectJavaScript(script);
    }
  }, [selectedSpot, destination]);

  if (Platform.OS === 'web') {
    const WebMapEvents = () => {
      useMapEvents({
        click: () => onSelectSpot(null)
      });
      return null;
    };

    return (
      <View style={styles.container}>
        <style type="text/css">{`
          .leaflet-container { width: 100%; height: 100%; position: absolute; }
          .custom-leaflet-marker { background: transparent; border: none; }
          .destination-leaflet-marker { background: transparent; border: none; }
          .marker-content {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            border-radius: 9999px;
            color: white;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: transform 0.2s;
            white-space: nowrap;
          }
          .marker-price { margin-right: 4px; }
          .marker-badge {
            background-color: rgba(255,255,255,0.2);
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 4px;
          }
          .destination-marker {
            width: 34px;
            height: 34px;
            border-radius: 50% 50% 50% 0;
            background-color: #23262B;
            border: 3px solid #FFFFFF;
            box-shadow: 0 4px 8px rgba(0,0,0,0.25);
            transform: rotate(-45deg);
            position: relative;
          }
          .destination-marker::after {
            content: '';
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #FFFFFF;
            top: 9px;
            left: 9px;
          }
          .leaflet-control-attribution { display: none; }
        `}</style>
        
        <MapContainer 
          center={getDestinationCoordinates(destination)}
          zoom={14.5} 
          zoomControl={false}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          ref={webMapRef}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <WebMapEvents />
          {destination && (
            <Marker
              key="destination"
              position={getDestinationCoordinates(destination) as any}
              icon={new DivIcon({
                className: 'destination-leaflet-marker',
                html: '<div class="destination-marker"></div>',
                iconSize: [40, 48],
                iconAnchor: [20, 48],
              })}
              zIndexOffset={2000}
            />
          )}
          {spots.map((spot: any) => {
            const isSelected = selectedSpot?.id === spot.id;
            const isMunicipal = spot.type === 'municipal';
            
            const bgColor = isMunicipal 
              ? (isSelected ? '#1E3A8A' : '#3B82F6') // Dark Blue : Light Blue
              : (isSelected ? '#14532D' : '#22C55E'); // Dark Green : Light Green
              
            const scale = isSelected ? 'scale(1.2)' : 'scale(1)';
            const zIndexOffset = isSelected ? 1000 : 0;
            
            const html = `
              <div class="marker-content" style="background-color: ${bgColor}; transform: ${scale};">
                <span class="marker-price">${spot.price} RON</span>
                <span class="marker-badge">${isMunicipal ? 'M' : 'P'}</span>
              </div>
            `;
            
            const icon = new DivIcon({
              className: 'custom-leaflet-marker',
              html: html,
              iconSize: [80, 30],
              iconAnchor: [40, 15]
            });

            return (
              <Marker 
                key={spot.id} 
                position={getCoordinates(spot) as any} 
                icon={icon} 
                zIndexOffset={zIndexOffset}
                eventHandlers={{ click: () => onSelectSpot(spot) }}
              />
            );
          })}
        </MapContainer>
      </View>
    );
  }

  const htmlContent = (() => {
    const markersHtml = spots.map((spot: any) => {
      const isMunicipal = spot.type === 'municipal';
      const coords = getCoordinates(spot);
      const markerKey = String(spot.id).replace(/[^a-zA-Z0-9_$]/g, '_');
      const spotId = JSON.stringify(spot.id);
      
      const bgColor = isMunicipal ? '#3B82F6' : '#22C55E'; // Light Blue : Light Green
      const scale = 'scale(1)';
      const zIndex = 1;

      return `
        var el_${markerKey} = document.createElement('div');
        el_${markerKey}.id = 'marker_${markerKey}';
        el_${markerKey}.className = 'marker-content';
        el_${markerKey}.style.backgroundColor = '${bgColor}';
        el_${markerKey}.style.transform = '${scale}';
        el_${markerKey}.style.zIndex = '${zIndex}';
        el_${markerKey}.innerHTML = '<span class="marker-price">${spot.price} RON</span><span class="marker-badge">${isMunicipal ? 'M' : 'P'}</span>';
        
        var m_${markerKey} = L.marker([${coords[0]}, ${coords[1]}], {
          icon: L.divIcon({
            className: 'custom-leaflet-marker',
            html: el_${markerKey}.outerHTML,
            iconSize: [80, 30],
            iconAnchor: [40, 15]
          })
        }).addTo(map).on('click', function(e) {
           L.DomEvent.stopPropagation(e);
           window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id: ${spotId} }));
        });
      `;
    }).join('\n');

    const updateSelectionLogic = spots.map((spot: any) => `
      var el_${String(spot.id).replace(/[^a-zA-Z0-9_$]/g, '_')} = document.getElementById('marker_${String(spot.id).replace(/[^a-zA-Z0-9_$]/g, '_')}');
      if (el_${String(spot.id).replace(/[^a-zA-Z0-9_$]/g, '_')}) {
        var isSelected = (${JSON.stringify(spot.id)} === selectedId);
        var isMunicipal = ${spot.type === 'municipal'};
        el_${String(spot.id).replace(/[^a-zA-Z0-9_$]/g, '_')}.style.backgroundColor = isMunicipal ? (isSelected ? '#1E3A8A' : '#3B82F6') : (isSelected ? '#14532D' : '#22C55E');
        el_${String(spot.id).replace(/[^a-zA-Z0-9_$]/g, '_')}.style.transform = isSelected ? 'scale(1.2)' : 'scale(1)';
        el_${String(spot.id).replace(/[^a-zA-Z0-9_$]/g, '_')}.style.zIndex = isSelected ? '1000' : '1';
      }
    `).join('\n');

    const destinationCoordinates = getDestinationCoordinates(destination);
    const destinationMarker = destination ? `
      L.marker([${destinationCoordinates[0]}, ${destinationCoordinates[1]}], {
        icon: L.divIcon({
          className: 'destination-leaflet-marker',
          html: '<div class="destination-marker"></div>',
          iconSize: [40, 48],
          iconAnchor: [20, 48]
        }),
        zIndexOffset: 2000
      }).addTo(map);
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; background-color: #EEF2F5; }
          #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; }
          .custom-leaflet-marker { background: transparent; border: none; }
          .destination-leaflet-marker { background: transparent; border: none; }
          .marker-content {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            border-radius: 9999px;
            color: white;
            font-family: sans-serif;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            white-space: nowrap;
            transition: transform 0.2s, background-color 0.2s;
            cursor: pointer;
          }
          .marker-price { margin-right: 4px; }
          .marker-badge {
            background-color: rgba(255,255,255,0.2);
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 4px;
          }
          .destination-marker {
            width: 34px;
            height: 34px;
            border-radius: 50% 50% 50% 0;
            background-color: #23262B;
            border: 3px solid #FFFFFF;
            box-shadow: 0 4px 8px rgba(0,0,0,0.25);
            transform: rotate(-45deg);
            position: relative;
          }
          .destination-marker::after {
            content: '';
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #FFFFFF;
            top: 9px;
            left: 9px;
          }
          .leaflet-control-attribution { display: none; }
          .leaflet-control-zoom { display: none; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([${destinationCoordinates[0]}, ${destinationCoordinates[1]}], 14.5);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          
          map.on('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_click' }));
          });

          function updateSelection(selectedId) {
            ${updateSelectionLogic}
          }

          ${destinationMarker}
          ${markersHtml}
        </script>
      </body>
      </html>
    `;
  })();

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.mapGrid}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'map_click') {
              onSelectSpot(null);
            } else if (data.type === 'select') {
              const tappedSpot = spots.find((s: any) => s.id === data.id);
              if (tappedSpot) {
                onSelectSpot(tappedSpot);
              }
            }
          } catch {}
        }}
      />
    </View>
  );
});

Map.displayName = 'Map';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paleMapBackground,
  },
  mapGrid: {
    flex: 1,
  },
});
