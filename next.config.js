const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in development to avoid caching issues
  // For more advanced caching strategies, you might need to configure workboxOptions
  // workboxOptions: {
  //   runtimeCaching: [
  //     // Add runtime caching strategies here if needed
  //   ],
  // },
});

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add other Next.js configurations here if you have them
  // For example, if you use experimental features or custom webpack configs
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Example for Google user profile pictures
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com", // Example for placeholder images
      },
      // Add other domains if your app uses external images
    ],
  },
};

module.exports = withPWA(nextConfig);

