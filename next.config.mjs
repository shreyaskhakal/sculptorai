/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/auth/login",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/auth/signup",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/login",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/signup",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
