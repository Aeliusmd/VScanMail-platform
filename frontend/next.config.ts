import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; img-src 'self' data: blob: https: http://localhost:3000 http://localhost:3010 http://127.0.0.1:3000 http://127.0.0.1:3010 http://10.103.0.91:3000 http://10.103.0.91:3010; font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com; connect-src 'self' https: http://localhost:3000 http://localhost:3010 http://127.0.0.1:3000 http://127.0.0.1:3010 http://10.103.0.91:3000 http://10.103.0.91:3010; frame-src https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.103.0.91"],
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },
  async redirects() {
    return [
      {
        source: "/customer/dashboard",
        destination: "/customer",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/dashboard/:path*",
        destination: "/admin/:path*",
        permanent: true,
      },
      {
        source: "/customer/login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/register1",
        destination: "/register",
        permanent: true,
      },
      {
        source: "/Register2",
        destination: "/register/step-2",
        permanent: true,
      },
      {
        source: "/Register3",
        destination: "/register/step-3",
        permanent: true,
      },
      {
        source: "/super-admin-login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/admin/login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/customer-dashboard",
        destination: "/customer",
        permanent: true,
      },
      {
        source: "/super-admin-dashboard",
        destination: "/superadmin/dashboard",
        permanent: true,
      },
      {
        source: "/super-admin",
        destination: "/superadmin/dashboard",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3010/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:3010/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
