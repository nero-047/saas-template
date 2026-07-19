//@ts-check

const { resolve } = require('node:path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: resolve(__dirname, '../..'),
  },
};

module.exports = nextConfig;
