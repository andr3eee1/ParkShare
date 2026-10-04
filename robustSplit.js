const fs = require('fs');
let content = fs.readFileSync('frontend/src/screens/ExploreScreen.tsx', 'utf8');

// 1. Add useWindowDimensions
if (!content.includes('useWindowDimensions')) {
  content = content.replace(
    `import React, { useState, useRef, useEffect, useMemo } from 'react';\nimport { Keyboard, View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';`,
    `import React, { useState, useRef, useEffect, useMemo } from 'react';\nimport { Keyboard, View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, Modal, useWindowDimensions } from 'react-native';`
  );
}

// 2. Extract blocks
const mapMatch = content.match(/(<Map[\s\S]*?userLocation=\{userLocation \|\| DEFAULT_USER_LOCATION\}\n\s*\/>)/);
const searchMatch = content.match(/(<View pointerEvents="box-none" style=\{styles\.headerContainer\}>[\s\S]*?<\/View>\n)/);
const controlsMatch = content.match(/(<View pointerEvents="box-none" style=\{\[styles\.mapControls, selectedSpot && \{ bottom: 300 \}\]\}>[\s\S]*?<\/View>\n)/);
const sheetMatch = content.match(/({\/\* Booking Sheet \(Simplified\) \*\/}\n\s*\{selectedSpot && \([\s\S]*?<\/View>\n\s*\)}\n)/);
const modalMatch = content.match(/({\/\* Reservation Details Modal \*\/}\n\s*\{selectedSpot && \([\s\S]*?<\/Modal>\n\s*\)}\n)/);

if (!mapMatch || !searchMatch || !controlsMatch || !sheetMatch || !modalMatch) {
  console.log("Failed to match blocks!");
  process.exit(1);
}

const mapBlock = mapMatch[1];
const searchBlock = searchMatch[1];
const controlsBlock = controlsMatch[1];
const sheetBlock = sheetMatch[1];
const modalBlock = modalMatch[1];

// 3. Find the main return block and replace it
const returnStart = content.indexOf('  return (\n    <View style={styles.container}>');
const returnEnd = content.indexOf('      {/* Reservation Details Modal */}');

if (returnStart === -1 || returnEnd === -1) {
  console.log("Failed to find return block!");
  process.exit(1);
}

const endOfReturn = content.indexOf('  );\n};', returnEnd);

const beforeReturn = content.substring(0, returnStart);
const afterReturn = content.substring(endOfReturn);

const newReturnBlock = `  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;

  const renderMap = () => (
    ${mapBlock.trim()}
  );

  const renderSearchPanel = () => (
    ${searchBlock.trim()}
  );

  const renderMapControls = () => (
    ${controlsBlock.trim().replace('selectedSpot && { bottom: 300 }', '!isDesktop && selectedSpot && { bottom: 300 }')}
  );

  const renderBookingSheet = () => (
    ${sheetBlock.trim().replace('style={styles.bookingSheetWrapper}', 'style={isDesktop ? { marginTop: 16 } : styles.bookingSheetWrapper}').replace('style={styles.bookingSheet}', 'style={isDesktop ? [styles.bookingSheet, { marginBottom: 0, marginHorizontal: 0 }] : styles.bookingSheet}')}
  );

  const renderModal = () => (
    ${modalBlock.trim()}
  );

  return (
    <>
      {isDesktop ? (
        <View style={[styles.container, { flexDirection: 'row' }]}>
          <View style={{ width: 420, height: '100%', backgroundColor: tokens.colors.paleMapBackground, zIndex: 10, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.1, shadowRadius: 12, padding: 16 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {renderSearchPanel()}
                {renderBookingSheet()}
              </ScrollView>
            </SafeAreaView>
          </View>
          <View style={{ flex: 1, position: 'relative' }}>
            {renderMap()}
            {renderMapControls()}
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          {renderMap()}
          <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
            {renderSearchPanel()}
            {renderMapControls()}
            {renderBookingSheet()}
          </SafeAreaView>
        </View>
      )}
      {renderModal()}
    </>
`;

fs.writeFileSync('frontend/src/screens/ExploreScreen.tsx', beforeReturn + newReturnBlock + afterReturn);
