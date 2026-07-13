# Celestial Texture Candidates — Earth & Moon

**Phase**: 0
**Source**: `docs/audit/CELESTIAL-TEXTURE-CANDIDATES.md`
**Date**: 2026-07-13
**Spec reference**: §34 — _Earth / Moon 贴图_, and Appendix C.2 — _三层视觉材料_

## Purpose

Per spec §34, Earth and Moon textures must enter the Asset Manifest with documented source, projection, resolution, color space, generation method, and SHA-256. "Real texture" is not a substitute for documentation; modern composites must be labelled as such. Per spec C.2, three visual layers are required:

| Layer               | Asset                                                  | Use                                   | Truth label                                                                    |
| ------------------- | ------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------ |
| Global celestial    | `NASA-MOON-CGI-KIT` (color + DEM) → Moon sphere        | Translunar approach, LOI, lunar orbit | `NASA IMAGERY-BASED TEXTURE` (modern LRO product, not 1969 visual)             |
| Local terrain       | Reconstructed landing-site terrain                     | DOI, PDI, touchdown, surface map      | `RECONSTRUCTED TERRAIN` (document projection, vertical scale, lighting method) |
| Historical evidence | Apollo 11 photography / TV / 16 mm / LROC site imagery | First step, EVA, archive comparison   | Show image/clip ID, time, capture position, source, processing note            |

The same three-layer pattern applies to Earth (global texture + Apollo 11 Earth photography as historical plates).

## Moon texture candidates

### Primary: NASA SVS CGI Moon Kit (`NASA-MOON-CGI-KIT`)

| Field                 | Value                                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ID             | `NASA-MOON-CGI-KIT`                                                                                                                                      |
| Original URL          | `https://svs.gsfc.nasa.gov/4720`                                                                                                                         |
| Publisher             | NASA GSFC Scientific Visualization Studio                                                                                                                |
| Publication date      | 2018 (per spec; page text TBD)                                                                                                                           |
| Rights                | NASA imagery — public domain; modern LRO product                                                                                                         |
| Landing page snapshot | `docs/sources/apollo11/NASA-MOON-CGI-KIT.page.html` (54,937 bytes, sha256 `83b4e4fcd0ea5aec56d2bb173a9720e4319ab64ef33ee777e21703288d76c7bb`)            |
| Sample archived       | `assets/raw/NASA-MOON-CGI-1k.jpg` (139,068 bytes, sha256 `b246064f217f8d479df78c49c7c8595a8f5fbda008a72fd539978d2e121e0109`) — `lroc_color_poles_1k.jpg` |

**Available variants** (parsed from the landing page):

| File                                                      | Type                           | Purpose                       | Phase 0 status           |
| --------------------------------------------------------- | ------------------------------ | ----------------------------- | ------------------------ |
| `lroc_color_poles_1k.jpg`                                 | Color JPG, 1K                  | Mobile / first-load           | Sample archived          |
| `lroc_color_poles_2k.tif`                                 | Color TIF, 2K                  | Mobile medium                 | Not archived (large TIF) |
| `lroc_color_poles_4k.tif`                                 | Color TIF, 4K                  | Desktop medium                | Not archived             |
| `lroc_color_poles_8k.tif`                                 | Color TIF, 8K                  | Desktop high                  | Not archived             |
| `lroc_color_poles_16k.tif`                                | Color TIF, 16K                 | Future ultra-high             | Not archived             |
| `lroc_color_poles_hw5x3.tif`                              | Color TIF, 5×3 horizontal wrap | Spherical projection          | Not archived             |
| `lroc_color_16bit_srgb_4k.tif`                            | 16-bit sRGB, 4K                | Higher dynamic range          | Not archived             |
| `lroc_color_16bit_srgb_8k.tif`                            | 16-bit sRGB, 8K                | Higher dynamic range          | Not archived             |
| `lroc_color_16bit_srgb_16k.tif`                           | 16-bit sRGB, 16K               | Higher dynamic range          | Not archived             |
| `ldem_4.tif`, `ldem_16.tif`, `ldem_64.tif`                | DEM                            | Displacement / normal mapping | Not archived             |
| `ldem_4_uint.tif`, `ldem_16_uint.tif`, `ldem_64_uint.tif` | DEM (unsigned int)             | Displacement / normal mapping | Not archived             |
| `ldem_hw5x3.tif`                                          | DEM horizontal wrap            | Spherical projection          | Not archived             |
| `plane2sphere.0220_print.jpg`                             | Reference print                | Documentation                 | Not archived             |

**Source URL pattern**: `https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/<filename>`

**CRITICAL TLS issue**: `svs.gsfc.nasa.gov` presents an **expired TLS certificate** as of 2026-07-13 (`SEC_E_CERT_EXPIRED`). All downloads require `curl -k` (insecure) or equivalent. Phase 3 must:

1. Re-probe the certificate status before re-fetching.
2. If the expiry is persistent, escalate to NASA SVS contact or find an alternative mirror.
3. Record each variant's SHA-256 in the Asset Manifest.

**Phase 3 actions**:

1. Download `lroc_color_poles_2k.tif` (mobile medium), `lroc_color_poles_4k.tif` (desktop medium), and `lroc_color_poles_8k.tif` (desktop high). Record SHA-256 for each.
2. Download `ldem_4.tif` (mobile) and `ldem_16.tif` (desktop) for displacement / normal mapping. Record SHA-256.
3. Convert each to KTX2 per spec §33 (color → ETC1S, normal/displacement → UASTC as needed).
4. Generate 1K / 2K / 4K runtime variants.
5. Verify pole handling — the SVS kit's `lroc_color_poles_*` variants include pole fill, which is important for full-sphere rendering.
6. Document in the Asset Manifest: original URL, accessedAt, SHA-256, projection (equirectangular), color space (sRGB for color, linear for DEM), generation method (LRO WAC + LOLA per SVS page text), and the `NASA IMAGERY-BASED TEXTURE` truth label.
7. UI must display `NASA IMAGERY-BASED TEXTURE` and not claim the texture is the 1969 visual appearance of the Moon.

### Fallback / cross-check: NASA A11 Landing Site LROC

| Field                  | Value                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Source ID              | `NASA-A11-LANDING-SITE-LRO`                                                                                                           |
| Original URL           | `https://science.nasa.gov/resource/apollo-11-landing-site/`                                                                           |
| Effective download URL | `https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/a/a11_lro.jpg`                                                 |
| Local file             | `assets/raw/NASA-A11-LANDING-SITE-LRO.jpg` (202,986 bytes, sha256 `c8ebab62a7c56b5320b7b9100787a048e262643f5d893b7ce079d706279b597b`) |
| Publication year       | Post-2009 (LRO launched June 2009)                                                                                                    |
| Rights                 | LROC imagery — public domain                                                                                                          |

This is a single high-resolution image of the Apollo 11 landing site taken by LROC in the 2010s or 2020s, showing the descent stage still in place. Per spec C.2, it must be labelled with its actual capture year (TBD in Phase 2 by parsing LROC image metadata) and must NOT be presented as a 1969 photo. It is a "modern site reference" and an "archive comparison" asset, not a runtime Moon sphere texture.

### Local terrain: Apollo 11 Landing Site STL (`NASA-A11-LANDING-TERRAIN`)

| Field                  | Value                                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ID              | `NASA-A11-LANDING-TERRAIN`                                                                                                                                        |
| Original URL           | `https://science.nasa.gov/3d-resources/apollo-11-landing-site/`                                                                                                   |
| Effective download URL | `https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/printable/apollo-11---landing-site/Apollo%2011%20-%20Landing%20Site.stl?emrc=6a546a354da1d` |
| Local file             | `assets/raw/NASA-A11-LANDING-TERRAIN.stl` (7,138,484 bytes, sha256 `72eae5e493d3966dae392ce7563d66676e5a0b72d9753609d39723c8e84b1c72`)                            |
| Rights                 | NASA model — public domain                                                                                                                                        |
| Critical note          | Source page states original STL exaggerates Z axis 60× for visual relief                                                                                          |

**Phase 3 actions** for local terrain:

1. Open the STL and verify bounds. Compare against known lunar terrain slopes at Tranquility Base (`0.6740°N, 23.4730°E`).
2. Either undo the 60× Z exaggeration in a documented recipe (Phase 3 Blender / glTF-transform script), or regenerate from raw LRO LOLA DEM with documented vertical scale.
3. Document the projection, vertical scale, lighting method, and any exaggeration in the Asset Manifest.
4. Label as `RECONSTRUCTED TERRAIN` in the UI per spec §34 / C.2.

### Apollo 11 historical Moon imagery

| Source ID            | Asset                                                                                                                                                                | Use                                     | Constraints                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `NASA-A11-MOON-VIEW` | AS11-44-6665 "Apollo 11 View of the Moon" (`assets/raw/NASA-A11-MOON-VIEW.jpg`, 2.96 MiB, sha256 `1318334a5089fb186d39996f60677b5f5b42cde74158ceff97b3e2283bfd41d4`) | Transearth archive plate                | Per spec C.2: taken on the return leg ~10,000 nm from the Moon. Must NOT be used as approach or LOI view. |
| `NASA-A11-IMAGES`    | Apollo 11 image gallery (landing page archived)                                                                                                                      | Archive plates from mission photography | Phase 2 must curate specific images for plates                                                            |

## Earth texture candidates

### Primary: NASA Visible Earth — Blue Marble

| Field                 | Value                                                                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ID             | `NASA-EARTH-BLUE-MARBLE`                                                                                                                            |
| Original URL          | `https://visibleearth.nasa.gov/images/57723/the-blue-marble`                                                                                        |
| Publisher             | NASA GSFC Visible Earth                                                                                                                             |
| Publication date      | 2002 (original Blue Marble); page sidebar references "Blue Marble: Next Generation"                                                                 |
| Rights                | NASA imagery — public domain; modern composite, not 1969 same-instant view                                                                          |
| Landing page snapshot | `docs/sources/apollo11/NASA-EARTH-BLUE-MARBLE.page.html` (301,513 bytes, sha256 `4ff52fb44296d6a91485bc441392c6487d56dd212e593175317b87ed1e103f1b`) |

**Problem**: Direct image URLs under `eoimages.gsfc.nasa.gov/images/imagerecords/57/57723/...` all return HTTP 404 as of 2026-07-13. Probed paths:

- `land_ocean_ice_cloud_2048.jpg` → 404
- `land_ocean_ice_cloud_360.jpg` → 404
- `world.topo.bathy.200408.3x5400x2700.jpg` → 404

The Visible Earth page itself loads but the direct texture URLs are broken.

**Phase 0 status**: HTML snapshot archived; **no texture downloaded**.

**Phase 3 actions**:

1. Try Internet Archive Wayback for the original `eoimages.gsfc.nasa.gov/images/imagerecords/57/57723/land_ocean_ice_cloud_2048.jpg` URL.
2. Try NASA SVS Blue Marble variants (svs.gsfc.nasa.gov likely has Blue Marble entries — but TLS cert is expired, see above).
3. Try "Blue Marble: Next Generation" referenced in the page sidebar — likely at `https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/` (probe needed).
4. If all fail, fall back to a public-domain Blue Marble from a NASA-affiliated mirror with documented rights status.
5. Document the texture's true generation method: 2002 composite of satellite observations (Terra/Moderate Resolution Imaging Spectroradiometer), not a single 1969 photograph.
6. UI must label `NASA IMAGERY-BASED TEXTURE` and not claim it is the 1969 visual appearance of Earth.

**OPEN QUESTION for Phase 3**: which Blue Marble variant is the canonical post-2002 source? The 2002 original, the 2007 "Next Generation", the 2012 "Black Marble" (night lights), or a more recent NASA SVS composite? Recommendation: 2002 original or "Next Generation" for the day map; Black Marble optional for night-side views.

### Apollo 11 historical Earth imagery

| Source ID         | Asset                                           | Use                                                                                                |
| ----------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `NASA-A11-IMAGES` | Apollo 11 image gallery (landing page archived) | Earth plates from mission photography (e.g., AS11-44-6552 Earthrise, AS11-36-5337 S-IC separation) |

Per spec C.2, Apollo 11 Earth photographs are **independent historical plates** and must not be claimed as the source of the global Earth texture. They are evidence, not runtime sphere material.

## Phase 0 readiness for Phase 3

- ✅ CGI Moon Kit landing page archived; sample 1K color map archived with SHA-256.
- ✅ Landing Site LROC image archived with SHA-256.
- ✅ Landing Site STL archived with SHA-256; 60× Z exaggeration documented.
- ✅ AS11-44-6665 Moon View photograph archived with SHA-256; transearth-only constraint documented.
- ✅ Blue Marble landing page archived; broken direct URLs documented.
- ⚠ Full-resolution Moon textures (2K/4K/8K TIF) not archived (bounded disk usage in Phase 0).
- ⚠ Blue Marble texture not archived (direct URLs broken; Phase 3 must find working URL via Wayback or alternative).
- ⚠ SVS GSFC TLS certificate expired as of 2026-07-13 — Phase 3 must re-probe.

## Open questions

1. **SVS cert expiry**: transient or persistent? If persistent, escalate to NASA SVS or use Internet Archive Wayback.
2. **Blue Marble working URL**: which variant is canonical, and where is it actually downloadable in 2026?
3. **Landing Site STL Z exaggeration**: does the STL itself encode the 60× exaggeration, or only the visualization on the source page? Phase 3 must verify by opening the STL.
4. **LROC landing-site image year**: the LROC image was taken sometime after LRO entered orbit (2009). Phase 2 must parse the image metadata (or the LROC product page) for the exact capture date and stamp it in the UI.
