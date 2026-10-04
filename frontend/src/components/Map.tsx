import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { tokens } from '../theme/tokens';

let MapContainer: any, TileLayer: any, Marker: any, DivIcon: any, useMapEvents: any, useMap: any;
if (Platform.OS === 'web') {
  require('leaflet/dist/leaflet.css');
  const RL = require('react-leaflet');
  MapContainer = RL.MapContainer;
  TileLayer = RL.TileLayer;
  Marker = RL.Marker;
  useMapEvents = RL.useMapEvents;
  useMap = RL.useMap;
  const L = require('leaflet');
  DivIcon = L.divIcon;
}

export const Map = forwardRef(({ spots, selectedSpot, onSelectSpot }: any, ref) => {
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

  const getCoordinates = (spot: any) => {
    const baseLat = 44.4820;
    const baseLng = 26.1130;
    const lat = baseLat + (parseFloat(spot.y) - 50) * -0.0003; 
    const lng = baseLng + (parseFloat(spot.x) - 50) * 0.0003;
    return [lat, lng];
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (selectedSpot && webMapRef.current) {
        const [lat, lng] = getCoordinates(selectedSpot);
        webMapRef.current.panTo([lat, lng]);
      }
    } else if (webviewRef.current) {
      let script = `if (typeof updateSelection === 'function') { updateSelection('${selectedSpot?.id || ''}'); }`;
      if (selectedSpot) {
        const [lat, lng] = getCoordinates(selectedSpot);
        script += `if (typeof map !== 'undefined') { map.panTo([${lat}, ${lng}]); }`;
      }
      script += 'true;';
      webviewRef.current.injectJavaScript(script);
    }
  }, [selectedSpot]);

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
          .leaflet-control-attribution { display: none; }
        `}</style>
        
        <MapContainer 
          center={[44.4820, 26.1130]} 
          zoom={14.5} 
          zoomControl={false}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          ref={webMapRef}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <WebMapEvents />
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

  const htmlContent = React.useMemo(() => {
    const markersHtml = spots.map((spot: any) => {
      const isMunicipal = spot.type === 'municipal';
      const coords = getCoordinates(spot);
      
      const bgColor = isMunicipal ? '#3B82F6' : '#22C55E'; // Light Blue : Light Green
      const scale = 'scale(1)';
      const zIndex = 1;

      return `
        var el_${spot.id} = document.createElement('div');
        el_${spot.id}.id = 'marker_${spot.id}';
        el_${spot.id}.className = 'marker-content';
        el_${spot.id}.style.backgroundColor = '${bgColor}';
        el_${spot.id}.style.transform = '${scale}';
        el_${spot.id}.style.zIndex = '${zIndex}';
        el_${spot.id}.innerHTML = '<span class="marker-price">${spot.price} RON</span><span class="marker-badge">${isMunicipal ? 'M' : 'P'}</span>';
        
        var m_${spot.id} = L.marker([${coords[0]}, ${coords[1]}], {
          icon: L.divIcon({
            className: 'custom-leaflet-marker',
            html: el_${spot.id}.outerHTML,
            iconSize: [80, 30],
            iconAnchor: [40, 15]
          })
        }).addTo(map).on('click', function(e) {
           L.DomEvent.stopPropagation(e);
           window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id: '${spot.id}' }));
        });
      `;
    }).join('\n');

    const updateSelectionLogic = spots.map((spot: any) => `
      var el_${spot.id} = document.getElementById('marker_${spot.id}');
      if (el_${spot.id}) {
        var isSelected = ('${spot.id}' === selectedId);
        var isMunicipal = ${spot.type === 'municipal'};
        el_${spot.id}.style.backgroundColor = isMunicipal ? (isSelected ? '#1E3A8A' : '#3B82F6') : (isSelected ? '#14532D' : '#22C55E');
        el_${spot.id}.style.transform = isSelected ? 'scale(1.2)' : 'scale(1)';
        el_${spot.id}.style.zIndex = isSelected ? '1000' : '1';
      }
    `).join('\n');

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
          .leaflet-control-attribution { display: none; }
          .leaflet-control-zoom { display: none; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([44.4820, 26.1130], 14.5);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          
          map.on('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_click' }));
          });

          function updateSelection(selectedId) {
            ${updateSelectionLogic}
          }

          ${markersHtml}
        </script>
      </body>
      </html>
    `;
  }, [spots]);

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
          } catch (e) {}
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paleMapBackground,
  },
  mapGrid: {
    flex: 1,
  },
});
