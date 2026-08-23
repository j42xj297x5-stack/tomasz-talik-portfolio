export function createVrGlyphOrbit({ nodes, actor }) {
  const suspended = new Set();
  const records = nodes.map((node) => ({
    node,
    canonicalPosition: node.position.clone(),
    canonicalQuaternion: node.quaternion.clone(),
    canonicalScale: node.scale.clone()
  }));
  if (!actor?.getCompatibilityRadius || !actor?.setCompatibilityRadius)
    throw new TypeError('VR glyph orbit compatibility adapter requires actor radius access.');
  const effectiveRadius = actor.getCompatibilityRadius();
  let disposed = false;
  function getRadius() { return actor.getCompatibilityRadius(); }
  function suspendNode(node) { if (!records.some((record) => record.node === node)) return false; suspended.add(node); return true; }
  function getCanonicalTransform(node) { const record = records.find((candidate) => candidate.node === node);
    return record ? { position: record.canonicalPosition.clone(), quaternion: record.canonicalQuaternion.clone(),
      scale: record.canonicalScale.clone() } : null; }
  function resumeNode(node) { if (!suspended.delete(node)) return false; const transform = getCanonicalTransform(node);
    if (transform) { node.position.copy(transform.position); node.quaternion.copy(transform.quaternion); node.scale.copy(transform.scale); }
    return true; }
  function setRadius(nextRadius) {
    if (disposed || !Number.isFinite(nextRadius) || nextRadius <= 0) return false;
    return actor.setCompatibilityRadius(nextRadius);
  }
  function reset() {
    if (!disposed) {
      suspended.clear();
    }
  }
  function dispose() { if (!disposed) { disposed = true; records.length = 0; } }
  return { effectiveRadius, getRadius, setRadius, suspendNode, getCanonicalTransform, resumeNode, reset, dispose };
}
