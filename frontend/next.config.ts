import type { NextConfig } from "next";

// AccountPulse front end. The Python agent (FastAPI) runs separately;
// point NEXT_PUBLIC_API_URL at it to replace the demo data.
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
