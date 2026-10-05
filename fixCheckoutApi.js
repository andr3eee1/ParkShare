const fs = require('fs');
let content = fs.readFileSync('frontend/src/screens/PaymentCheckoutScreen.tsx', 'utf8');

// Add AuthContext import if not present (Wait, token is needed for fetch!)
if (!content.includes('AuthContext')) {
  content = content.replace(
    "import { useNavigation, useRoute } from '@react-navigation/native';",
    "import { useNavigation, useRoute } from '@react-navigation/native';\nimport { AuthContext } from '../context/AuthContext';"
  );
  content = content.replace(
    "const { amount, title, actionType, targetId } = route.params as any;",
    "const { amount, title, actionType, targetId, startTime, endTime } = route.params as any;\n  const { token, updateUser, user } = React.useContext(AuthContext);"
  );
} else {
  content = content.replace(
    "const { amount, title, actionType, targetId } = route.params as any;",
    "const { amount, title, actionType, targetId, startTime, endTime } = route.params as any;"
  );
}

// Replace the mock delay
const oldBookingLogic = `      } else if (actionType === 'BOOKING') {
        // In a real app, call POST /bookings here
        await new Promise((resolve) => setTimeout(resolve, 500));
      }`;

const newBookingLogic = `      } else if (actionType === 'BOOKING') {
        const res = await fetch('http://pana.com.ro:8745/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: \`Bearer \${token}\`
          },
          body: JSON.stringify({
            spotId: targetId,
            startTime,
            endTime,
            totalPrice: amount,
            paymentMethod: selectedMethod === 'wallet' ? 'wallet' : 'card'
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Booking failed');
        
        if (selectedMethod === 'wallet' && user) {
          updateUser({ ...user, walletBalance: user.walletBalance - amount });
        }
      }`;

content = content.replace(oldBookingLogic, newBookingLogic);
fs.writeFileSync('frontend/src/screens/PaymentCheckoutScreen.tsx', content);
