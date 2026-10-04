const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Map.tsx', 'utf8');

// 1. Make the subtext more visible
content = content.replace(
  `\${avail.text ? \`<span style="font-size:9px;font-weight:normal;opacity:0.8;margin-top:2px;">\${avail.text}</span>\` : ''}`,
  `\${avail.text ? \`<span style="font-size:11px;font-weight:600;opacity:1;margin-top:2px;">\${avail.text}</span>\` : ''}`
);
content = content.replace(
  `+ (avail.text ? '<span style="font-size:9px;font-weight:normal;opacity:0.8;margin-top:2px;">' + avail.text + '</span>' : '') +`,
  `+ (avail.text ? '<span style="font-size:11px;font-weight:600;opacity:1;margin-top:2px;">' + avail.text + '</span>' : '') +`
);

// 2. Make spots unavailable if they close in < 30 mins
const oldJsFn = `            var isAvailable = false;
            if (endMins < startMins) {
              isAvailable = currentMins >= startMins || currentMins < endMins;
            } else {
              isAvailable = currentMins >= startMins && currentMins < endMins;
            }
            if (!isAvailable) {
              return { isAvailable: false, text: 'Opens ' + parts[0].trim() };
            }`;

const newJsFn = `            var isAvailable = false;
            var timeRemaining = 0;
            if (endMins < startMins) {
              isAvailable = currentMins >= startMins || currentMins < endMins;
              timeRemaining = currentMins < endMins ? (endMins - currentMins) : (endMins + 1440 - currentMins);
            } else {
              isAvailable = currentMins >= startMins && currentMins < endMins;
              timeRemaining = endMins - currentMins;
            }
            if (!isAvailable || timeRemaining < 30) {
              return { isAvailable: false, text: 'Opens ' + parts[0].trim() };
            }`;

content = content.replace(oldJsFn, newJsFn);

const oldTsFn = `  let isAvailable = false;
  if (endMins < startMins) {
    isAvailable = currentMins >= startMins || currentMins < endMins;
  } else {
    isAvailable = currentMins >= startMins && currentMins < endMins;
  }
  
  if (!isAvailable) {
    return { isAvailable: false, text: 'Opens ' + parts[0].trim() };
  }`;

const newTsFn = `  let isAvailable = false;
  let timeRemaining = 0;
  if (endMins < startMins) {
    isAvailable = currentMins >= startMins || currentMins < endMins;
    timeRemaining = currentMins < endMins ? (endMins - currentMins) : (endMins + 1440 - currentMins);
  } else {
    isAvailable = currentMins >= startMins && currentMins < endMins;
    timeRemaining = endMins - currentMins;
  }
  
  if (!isAvailable || timeRemaining < 30) {
    return { isAvailable: false, text: 'Opens ' + parts[0].trim() };
  }`;

content = content.replace(oldTsFn, newTsFn);

fs.writeFileSync('frontend/src/components/Map.tsx', content);
