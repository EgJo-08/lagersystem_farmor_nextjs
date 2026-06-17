const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {}, // <-- IMPORTANT FIX
};

module.exports = withPWA(nextConfig);