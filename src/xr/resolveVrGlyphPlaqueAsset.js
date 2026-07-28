export function resolveVrGlyphPlaqueAsset(glyphNode, plaqueAssets) {
  const id = glyphNode?.userData?.id;
  return id ? plaqueAssets.get(id) ?? null : null;
}
