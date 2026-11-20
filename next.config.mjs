/** Frontend-only demo: no API routes, server actions or runtime backend. */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
};
export default nextConfig;
