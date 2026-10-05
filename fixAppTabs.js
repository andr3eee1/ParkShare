const fs = require('fs');
let content = fs.readFileSync('frontend/App.tsx', 'utf8');

if (!content.includes('import { MySpotsScreen }')) {
  content = content.replace(
    "import { PassesScreen } from './src/screens/PassesScreen';",
    "import { PassesScreen } from './src/screens/PassesScreen';\nimport { MySpotsScreen } from './src/screens/MySpotsScreen';\nimport { AddSpotScreen } from './src/screens/AddSpotScreen';"
  );
}

// Modify MainNavigator to switch based on role
const oldTabs = `  const MainNavigator = () => {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({`;

const newTabs = `  const MainNavigator = () => {
    const { user } = useContext(AuthContext);
    const isProvider = user?.role === 'PROVIDER' || user?.role === 'ADMIN';

    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({`;

content = content.replace(oldTabs, newTabs);

const oldTabScreens = `          <Tab.Screen name="Explore" component={ExploreScreen} />
          <Tab.Screen name="History" component={HistoryScreen} />
          <Tab.Screen name="Passes" component={PassesScreen} />
          <Tab.Screen name="Account" component={AccountScreen} />
        </Tab.Navigator>
    );
  };`;

const newTabScreens = `          {!isProvider ? (
            <>
              <Tab.Screen name="Explore" component={ExploreScreen} />
              <Tab.Screen name="History" component={HistoryScreen} />
              <Tab.Screen name="Passes" component={PassesScreen} />
            </>
          ) : (
            <>
              <Tab.Screen name="My Spots" component={MySpotsScreen} />
              <Tab.Screen name="History" component={HistoryScreen} />
            </>
          )}
          <Tab.Screen name="Account" component={AccountScreen} />
        </Tab.Navigator>
    );
  };`;

content = content.replace(oldTabScreens, newTabScreens);

// Add AddSpotScreen to Stack
const stackInsert = `              <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
              <Stack.Screen name="AddSpot" component={AddSpotScreen} options={{ presentation: "modal" }} />`;

content = content.replace(
  '<Stack.Screen name="HelpSupport" component={HelpSupportScreen} />',
  stackInsert
);

// Update icon mapping logic
const oldIconLogic = `            if (route.name === 'Explore') iconName = focused ? 'map' : 'map-outline';
            else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
            else if (route.name === 'Passes') iconName = focused ? 'card' : 'card-outline';
            else if (route.name === 'Account') iconName = focused ? 'person' : 'person-outline';`;

const newIconLogic = `            if (route.name === 'Explore') iconName = focused ? 'map' : 'map-outline';
            else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
            else if (route.name === 'Passes') iconName = focused ? 'card' : 'card-outline';
            else if (route.name === 'Account') iconName = focused ? 'person' : 'person-outline';
            else if (route.name === 'My Spots') iconName = focused ? 'business' : 'business-outline';`;

content = content.replace(oldIconLogic, newIconLogic);

fs.writeFileSync('frontend/App.tsx', content);
