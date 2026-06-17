/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@steady-state/db", "@steady-state/notifications"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // Note: Adjusted CSP to allow Clerk and standard Next.js features
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.steadystate.dev; connect-src 'self' https://*.clerk.accounts.dev https://clerk.steadystate.dev https://api.stripe.com; img-src 'self' data: https://img.clerk.com https://*.stripe.com; style-src 'self' 'unsafe-inline'; frame-src 'self' https://challenges.cloudflare.com; font-src 'self' data:;",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
