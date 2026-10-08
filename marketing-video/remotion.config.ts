import { Config } from "@remotion/cli/config";

// Ultra-High Quality Export Settings
Config.setCrf(14); // Lower CRF means higher quality (Visually lossless)
Config.setCodec("h264"); // Can be changed to "h265" or "prores" for even higher quality
Config.setPixelFormat("yuv420p"); // Better color subsampling (prevents color bleeding on red/green borders)
Config.setConcurrency(8); // Speed up rendering
