/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  basePath: "/panel",
  async redirects() {
    return [
      { source: "/transactions", destination: "/earnings", permanent: true },
      { source: "/workflows", destination: "/", permanent: true },
      { source: "/audit", destination: "/", permanent: true },
    ];
  },
};

module.exports = nextConfig;
