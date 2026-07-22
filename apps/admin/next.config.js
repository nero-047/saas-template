//@ts-check

const { resolve } = require('node:path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: resolve(__dirname, '../..'),
  turbopack: {
    root: resolve(__dirname, '../..'),
  },
};

module.exports = nextConfig;
