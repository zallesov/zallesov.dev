/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    productionBrowserSourceMaps: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        unoptimized: true
    },

    webpack(config, options) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ["@svgr/webpack"]
        });

        return config;
    },
}

export default nextConfig;
