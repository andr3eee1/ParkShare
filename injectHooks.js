const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Map.tsx', 'utf8');

const newHooks = `
  useEffect(() => {
    if (Platform.OS !== 'web' && webviewRef.current) {
      if (destination) {
        webviewRef.current.injectJavaScript(\`
          if (typeof setDestination !== 'undefined') {
            setDestination(\${destination.latitude}, \${destination.longitude});
          }
          true;
        \`);
      } else {
        webviewRef.current.injectJavaScript(\`
          if (typeof setDestination !== 'undefined') {
            setDestination(null, null);
          }
          true;
        \`);
      }
    }
  }, [destination]);

  useEffect(() => {
    if (Platform.OS !== 'web' && webviewRef.current) {
      if (userLocation) {
        webviewRef.current.injectJavaScript(\`
          if (typeof setUserLocation !== 'undefined') {
            setUserLocation(\${userLocation.latitude}, \${userLocation.longitude});
          }
          true;
        \`);
      } else {
        webviewRef.current.injectJavaScript(\`
          if (typeof setUserLocation !== 'undefined') {
            setUserLocation(null, null);
          }
          true;
        \`);
      }
    }
  }, [userLocation]);
`;

// Insert the new hooks before `useEffect` for targetCoordinates
content = content.replace(
  `  useEffect(() => {
    const targetCoordinates = selectedSpot`,
  newHooks + `\n  useEffect(() => {
    const targetCoordinates = selectedSpot`
);

fs.writeFileSync('frontend/src/components/Map.tsx', content);
