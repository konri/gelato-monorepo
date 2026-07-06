# Sharp and Canvas - Removed from Dependencies

## Problem

Sharp and Canvas require native binaries that don't compile on FreeBSD (MyDevil).

**Root Cause:** Platform mismatch

- Local (macOS): `sharp.node` compiled for darwin-arm64
- FreeBSD: Needs freebsd-x64 binary (not available)
- Rebuild fails: No prebuilt binaries + limited build tools on MyDevil

## Why Rebuild Was Required on FreeBSD

Native addons (`.node` files) are platform-specific binaries:

```
1. npm install on macOS → downloads sharp.node for darwin-arm64
2. rsync uploads macOS binary to FreeBSD
3. Node.js on FreeBSD tries to load darwin binary → Error: Wrong platform
4. Node.js attempts: npm rebuild sharp
5. Rebuild fails: No prebuilt freebsd binary + compilation errors
```

**Sharp checks platform on require():**

```javascript
require('sharp') → loads sharp.node → checks: is this freebsd-x64? NO → Error
```

## Current Status

- ✅ Sharp and Canvas **REMOVED** from package.json
- ✅ Code already commented out (not used)
- ✅ Deployment works without rebuild issues
- ⚠️ Image processing disabled (uploads duplicate files instead of thumbnails)

## Solutions

### Option 1: Jimp (Pure JavaScript - RECOMMENDED)

```bash
yarn add jimp
```

```typescript
import Jimp from 'jimp'

export async function createPreview(file: Buffer) {
  const image = await Jimp.read(file)
  return image.resize(200, Jimp.AUTO).quality(80).getBufferAsync(Jimp.MIME_JPEG)
}
```

**Pros:** Pure JS, works everywhere, no native dependencies
**Cons:** 2-3x slower than Sharp (still fast enough for most cases)

### Option 2: Client-Side Processing

- Resize images in browser before upload
- Use Canvas API or libraries like `browser-image-compression`
- Backend only stores files
- Best performance, zero server load

### Option 3: External Service

- AWS Lambda with Sharp layer (Linux binaries work)
- Cloudinary, Imgix, or similar CDN services
- Process images after upload via webhook

## Recommendation

Use **Jimp** for server-side processing or implement client-side resizing in your frontend app.
