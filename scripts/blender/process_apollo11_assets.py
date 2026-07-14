"""Apollo 11 Phase 3 deterministic vehicle asset recipe.

Blender 4.3.2 only. Raw files are never modified. Semantic splits are
reconstructions based on source-model height bands and are not flight CAD.
"""

import argparse
from collections import Counter
import hashlib
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector


BLENDER_VERSION = "4.3.2"
LOD_RATIOS = {"high": 1.0, "medium": 0.55, "low": 0.22}
SATURN_HEIGHT_M = 110.6  # NASA-A11-SATV-FE / published Saturn V overall height.
LM_FOOTPAD_SPAN_M = 9.4488  # 31 ft; NASA-LM-HB-WB PDF p19, fig. 1-3.
CM_DIAMETER_M = 3.9116  # 12 ft 10 in; NASA-CSM06-WB PDF p1 / printed p39.
CM_HEIGHT_M = 3.2258  # 10 ft 7 in; NASA-CSM06-WB PDF p1 / printed p39.

SATURN_BANDS = [
    ("s-ic", -math.inf, 4.90),
    ("s-ic-s-ii-interstage", 4.90, 5.30),
    ("s-ii", 5.30, 7.95),
    ("s-ii-s-ivb-interstage", 7.95, 8.25),
    ("s-ivb", 8.25, 10.35),
    ("instrument-unit", 10.35, 10.75),
    ("spacecraft-lm-adapter", 10.75, 11.70),
    ("command-service-module", 11.70, 12.55),
    ("launch-escape-system", 12.55, math.inf),
]

LM_BANDS = [
    ("lm-descent-stage", -math.inf, 2.50),
    ("lm-ascent-stage", 2.50, math.inf),
]


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def mesh_objects():
    return [o for o in bpy.context.scene.objects if o.type == "MESH"]


def select_only(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    if objects:
        bpy.context.view_layer.objects.active = objects[0]


def join_all_meshes():
    objects = mesh_objects()
    if not objects:
        raise RuntimeError("No mesh objects imported")
    select_only(objects)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for other in list(bpy.context.scene.objects):
        if other != obj and other.type != "MESH":
            bpy.data.objects.remove(other, do_unlink=True)
    return obj


def bounds(obj):
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    lo = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    hi = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return lo, hi


def normalize_uniform(obj, target_extent, axis):
    lo, hi = bounds(obj)
    size = hi - lo
    # Blender imports glTF Y-up as Blender Z-up. Keep processing Z-up; the
    # exporter converts the derived GLB back to Y-up.
    extent = {"height": size.z, "span": max(size.x, size.y)}[axis]
    scale = target_extent / extent
    obj.scale = (scale, scale, scale)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    lo, hi = bounds(obj)
    obj.location += Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    return scale


def normalize_nonuniform(obj, target_xz, target_y):
    lo, hi = bounds(obj)
    size = hi - lo
    sx = target_xz / max(size.x, size.y)
    sy = target_y / size.z
    obj.scale = (sx, sx, sy)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    lo, hi = bounds(obj)
    obj.location += Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    return [sx, sx, sy]


def split_by_height(source, bands, raw_scale, raw_min_height):
    children = []
    source_centers = [p.center.z for p in source.data.polygons]
    if len(bands) > 2:
        histogram = Counter(round(raw_min_height + y / raw_scale, 1) for y in source_centers)
        print("[HEIGHT-HISTOGRAM]", sorted((k, v) for k, v in histogram.items() if k >= 9.5))
    for name, raw_lo, raw_hi in bands:
        obj = source.copy()
        obj.data = source.data.copy()
        bpy.context.collection.objects.link(obj)
        obj.name = name
        lo = -math.inf if math.isinf(raw_lo) else (raw_lo - raw_min_height) * raw_scale
        hi = math.inf if math.isinf(raw_hi) else (raw_hi - raw_min_height) * raw_scale
        source_count = sum(1 for y in source_centers if lo <= y < hi)
        print(f"[SPLIT] {name}: faces={source_count} normalizedHeight=[{lo:.4f}, {hi:.4f})")
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        remove = [f for f in bm.faces if not (lo <= f.calc_center_median().z < hi)]
        bmesh.ops.delete(bm, geom=remove, context="FACES")
        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
        if len(obj.data.polygons) == 0:
            bpy.data.objects.remove(obj, do_unlink=True)
            raise RuntimeError(f"Semantic split produced empty node: {name}")
        children.append(obj)
    bpy.data.objects.remove(source, do_unlink=True)
    return children


def add_root(name, children):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    for child in children:
        child.parent = root
    return root


def add_anchor(root, name, location):
    anchor = bpy.data.objects.new(name, None)
    anchor.empty_display_type = "PLAIN_AXES"
    anchor.empty_display_size = 0.25
    anchor.location = location
    anchor.parent = root
    bpy.context.collection.objects.link(anchor)
    return anchor


def apply_lod(children, ratio):
    if ratio >= 0.999:
        return
    for obj in children:
        if len(obj.data.polygons) < 24:
            continue
        modifier = obj.modifiers.new(name="phase3-lod", type="DECIMATE")
        modifier.ratio = ratio
        modifier.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)


def material(name, color, metallic=0.0, roughness=0.65):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.metallic = metallic
    mat.roughness = roughness
    return mat


def export_glb(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        export_animations=False,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )


def triangle_count():
    return sum(len(obj.data.polygons) for obj in mesh_objects())


def render_thumbnail(path, tall=False):
    all_meshes = mesh_objects()
    lows, highs = zip(*(bounds(o) for o in all_meshes))
    lo = Vector((min(v.x for v in lows), min(v.y for v in lows), min(v.z for v in lows)))
    hi = Vector((max(v.x for v in highs), max(v.y for v in highs), max(v.z for v in highs)))
    center = (lo + hi) / 2
    extent = max((hi - lo).x, (hi - lo).y, (hi - lo).z)
    camera_data = bpy.data.cameras.new("audit-camera")
    camera = bpy.data.objects.new("audit-camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = center + Vector((extent * 1.25, extent * 0.65, extent * 1.25))
    direction = center - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = extent * (1.08 if tall else 1.25)
    bpy.context.scene.camera = camera
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"
    scene.display.shading.show_shadows = True
    scene.display.shading.show_cavity = True
    scene.display.shading.cavity_type = "WORLD"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1200 if tall else 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.render.render(write_still=True)


def build_saturn(root_dir, lod):
    reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(root_dir / "assets/raw/NASA-MODEL-SATV.glb"))
    bpy.context.scene.animation_data_clear()
    source = join_all_meshes()
    raw_lo, _ = bounds(source)
    raw_min_height = raw_lo.z
    scale = normalize_uniform(source, SATURN_HEIGHT_M, "height")
    children = split_by_height(source, SATURN_BANDS, scale, raw_min_height)
    root = add_root("apollo11-saturn-v", children)
    add_anchor(root, "anchor-sic-exhaust", (0, 0, 0))
    add_anchor(root, "anchor-sii-exhaust", (0, 0, (5.30 - raw_min_height) * scale))
    add_anchor(root, "anchor-sivb-exhaust", (0, 0, (8.25 - raw_min_height) * scale))
    add_anchor(root, "anchor-csm-docking", (0, 0, (12.55 - raw_min_height) * scale))
    add_anchor(root, "anchor-camera-focus", (0, 0, SATURN_HEIGHT_M * 0.5))
    apply_lod(children, LOD_RATIOS[lod])
    return {"normalizationScale": scale, "semanticMethod": "face-centroid Y bands in raw NASA visualization model"}


def build_lm(root_dir, lod):
    reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(root_dir / "assets/raw/NASA-MODEL-LM.glb"))
    bpy.context.scene.animation_data_clear()
    source = join_all_meshes()
    raw_lo, _ = bounds(source)
    raw_min_height = raw_lo.z
    scale = normalize_uniform(source, LM_FOOTPAD_SPAN_M, "span")
    children = split_by_height(source, LM_BANDS, scale, raw_min_height)
    root = add_root("apollo11-lunar-module", children)
    add_anchor(root, "anchor-dps-exhaust", (0, 0, 0))
    add_anchor(root, "anchor-aps-exhaust", (0, 0, (2.50 - raw_min_height) * scale))
    add_anchor(root, "anchor-docking", (0, 0, max((bounds(o)[1].z for o in children))))
    add_anchor(root, "anchor-camera-focus", (0, 0, max((bounds(o)[1].z for o in children)) * 0.5))
    apply_lod(children, LOD_RATIOS[lod])
    return {"normalizationScale": scale, "semanticMethod": "face-centroid Y split at raw Y=2.50"}


def import_stl(path):
    before = set(bpy.context.scene.objects)
    bpy.ops.wm.stl_import(filepath=str(path))
    added = [o for o in bpy.context.scene.objects if o not in before and o.type == "MESH"]
    if len(added) != 1:
        raise RuntimeError(f"Expected one mesh from {path}, got {len(added)}")
    obj = added[0]
    # Printing-kit STLs use Y as their long axis. Rotate into Blender Z-up so
    # glTF export produces the required Y-up runtime asset.
    obj.rotation_euler.x = math.radians(-90)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    return obj


def build_csm(root_dir, lod):
    reset_scene()
    stl_dir = root_dir / "assets/raw/NASA-MODEL-SATV-STL-extracted"
    sm = import_stl(stl_dir / "service module.stl")
    sm.name = "service-module"
    sm_scale = normalize_uniform(sm, CM_DIAMETER_M, "span")
    sm.data.materials.append(material("service-module-aluminum", (0.43, 0.45, 0.46), 0.55, 0.38))
    _, sm_hi = bounds(sm)
    cm = import_stl(stl_dir / "command moduel.stl")
    cm.name = "command-module"
    cm_scale = normalize_nonuniform(cm, CM_DIAMETER_M, CM_HEIGHT_M)
    cm.location.z = sm_hi.z
    bpy.context.view_layer.objects.active = cm
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    cm.data.materials.append(material("command-module-ablative", (0.24, 0.25, 0.24), 0.25, 0.62))
    children = [sm, cm]
    root = add_root("apollo11-command-service-module", children)
    add_anchor(root, "anchor-sps-exhaust", (0, 0, 0))
    _, cm_hi = bounds(cm)
    add_anchor(root, "anchor-docking", (0, 0, cm_hi.z))
    add_anchor(root, "anchor-camera-focus", (0, 0, cm_hi.z * 0.5))
    apply_lod(children, LOD_RATIOS[lod])
    return {
        "normalizationScale": {"serviceModuleUniform": sm_scale, "commandModuleXYZ": cm_scale},
        "semanticMethod": "NASA print-kit CM and SM assembled; CM dimensions normalized to NASA-CSM06-WB p1",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    args = parser.parse_args(script_args)
    root_dir = Path(args.root).resolve()
    out_dir = root_dir / "assets/derived/models"
    media_dir = root_dir / "docs/media"
    report = {
        "recipeVersion": 1,
        "blenderVersionRequired": BLENDER_VERSION,
        "lodRatios": LOD_RATIOS,
        "assets": [],
    }
    builders = [
        ("apollo11-saturn-v", build_saturn, True),
        ("apollo11-lunar-module", build_lm, False),
        ("apollo11-command-service-module", build_csm, False),
    ]
    for asset_id, builder, tall in builders:
        for lod in LOD_RATIOS:
            details = builder(root_dir, lod)
            output = out_dir / f"{asset_id}-{lod}.glb"
            triangles = triangle_count()
            export_glb(output)
            digest = hashlib.sha256(output.read_bytes()).hexdigest()
            report["assets"].append({
                "assetId": asset_id,
                "lod": lod,
                "path": output.relative_to(root_dir).as_posix(),
                "bytes": output.stat().st_size,
                "sha256": digest,
                "triangles": triangles,
                **details,
            })
            if lod == "high":
                render_thumbnail(media_dir / f"phase3-{asset_id}.png", tall=tall)
    report_path = root_dir / "docs/audit/PHASE-3-MODEL-PROCESSING.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
