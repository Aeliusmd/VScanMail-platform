import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/customer/dashboard", destination: "/customer", permanent: true },
      { source: "/dashboard", destination: "/admin", permanent: true },
      { source: "/dashboard/:path*", destination: "/admin/:path*", permanent: true },
      { source: "/customer/login", destination: "/login", permanent: true },
      { source: "/register1", destination: "/register", permanent: true },
      { source: "/Register2", destination: "/register/step-2", permanent: true },
      { source: "/Register3", destination: "/register/step-3", permanent: true },
      { source: "/super-admin-login", destination: "/login", permanent: true },
      { source: "/admin/login", destination: "/login", permanent: true },
    ];
  },
};

export default nextConfig;
