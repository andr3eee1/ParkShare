import { registerRoot } from "remotion";
import { RemotionVideo } from "./Root";

// Load Plus Jakarta Sans font
const font = document.createElement("link");
font.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap";
font.rel = "stylesheet";
document.head.appendChild(font);

registerRoot(RemotionVideo);

// Inject global styles for maximum render crispness
const style = document.createElement("style");
style.textContent = `
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
`;
document.head.appendChild(style);
