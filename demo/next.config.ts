import type { NextConfig } from 'next'

// Sprites and frames are already optimised webp with alpha; the optimizer would re-encode them as JPEG.
const config: NextConfig = { images: { unoptimized: true } }

export default config
