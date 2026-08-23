export function createVrGlyphOrbit({ nodes }) {
  const suspended = new Set();
  const records = nodes.map((node) => ({
    node,
    canonicalPosition: node.position.clone(),
    canonicalQuaternion: node.quaternion.clone(),
    canonicalScale: node.scale.clone()
  }));
  let disposed = false;
  function suspendNode(node) { if (!records.some((record) => record.node === node)) return false; suspended.add(node); return true; }
  function getCanonicalTransform(node) { const record = records.find((candidate) => candidate.node === node);
    return record ? { position: record.canonicalPosition.clone(), quaternion: record.canonicalQuaternion.clone(),
      scale: record.canonicalScale.clone() } : null; }
  function resumeNode(node) { if (!suspended.delete(node)) return false; const transform = getCanonicalTransform(node);
    if (transform) { node.position.copy(transform.position); node.quaternion.copy(transform.quaternion); node.scale.copy(transform.scale); }
    return true; }
  function reset() {
    if (!disposed) {
      suspended.clear();
    }
  }
  function dispose() { if (!disposed) { disposed = true; records.length = 0; } }
  return { suspendNode, getCanonicalTransform, resumeNode, reset, dispose };
}
