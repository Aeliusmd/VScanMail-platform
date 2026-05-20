/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; img-src 'self' data: blob: https: http://localhost:3000 http://localhost:3010 http://127.0.0.1:3000 http://127.0.0.1:3010; font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com; connect-src 'self' https: http://localhost:3000 http://localhost:3010 http://127.0.0.1:3000 http://127.0.0.1:3010; frame-src https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
];

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    optimizePackageImports: [
      "@aws-sdk/client-s3",
      "@aws-sdk/client-textract",
      "@aws-sdk/s3-request-presigner",
      "openai",
      "stripe",
    ],
  },
  async headers() {
    const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: frontendOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      }
    ]
  }
};

module.exports = nextConfig;
