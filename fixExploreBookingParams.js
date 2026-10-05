const fs = require('fs');
let content = fs.readFileSync('frontend/src/screens/ExploreScreen.tsx', 'utf8');

const oldButton = `                  actionType: 'BOOKING',
                  targetId: selectedSpot.id
                });
              }}>
                <Text style={styles.reserveButtonText}>Proceed to Payment</Text>`;

const newButton = `                  actionType: 'BOOKING',
                  targetId: selectedSpot.id,
                  startTime: (() => {
                    const d = new Date();
                    d.setHours(Math.floor(actualStartMinutes / 60), actualStartMinutes % 60, 0, 0);
                    return d.toISOString();
                  })(),
                  endTime: (() => {
                    const d = new Date();
                    d.setHours(Math.floor(departureMinutes / 60), departureMinutes % 60, 0, 0);
                    if (d < new Date()) d.setDate(d.getDate() + 1);
                    return d.toISOString();
                  })()
                });
              }}>
                <Text style={styles.reserveButtonText}>Proceed to Payment</Text>`;

content = content.replace(oldButton, newButton);
fs.writeFileSync('frontend/src/screens/ExploreScreen.tsx', content);
