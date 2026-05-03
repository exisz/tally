/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloud sync clients post large encrypted blobs; bump the body limit.
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
};
export default nextConfig;
