const fs = require('fs');
let content = fs.readFileSync('frontend/App.tsx', 'utf8');

const oldTabBar = `            tabBarStyle: {
              backgroundColor: tokens.colors.white,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              paddingTop: 8,
              paddingBottom: 8, // Base padding, React Navigation will automatically add safe area insets on top of this
            },`;

const newTabBar = `            tabBarStyle: {
              backgroundColor: tokens.colors.white,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              height: Platform.OS === 'ios' ? 88 : 80,
              paddingBottom: Platform.OS === 'ios' ? 28 : 20,
              paddingTop: 8,
            },`;

content = content.replace(oldTabBar, newTabBar);

fs.writeFileSync('frontend/App.tsx', content);
