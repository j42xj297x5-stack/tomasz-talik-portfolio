import {
	BufferAttribute,
	BufferGeometry,
	TrianglesDrawMode,
	TriangleFanDrawMode,
	TriangleStripDrawMode,
} from 'three';

function convertBufferAttribute(attribute, indices) {
	const array = attribute.array;
	const itemSize = attribute.itemSize;
	const normalized = attribute.normalized;
	const result = new array.constructor(indices.length * itemSize);

	for (let i = 0; i < indices.length; i++) {
		const index = indices[i] * itemSize;
		for (let j = 0; j < itemSize; j++) {
			result[i * itemSize + j] = array[index + j];
		}
	}

	return new BufferAttribute(result, itemSize, normalized);
}

export function toTrianglesDrawMode(geometry, drawMode) {
	if (drawMode === TrianglesDrawMode) return geometry;

	if (drawMode !== TriangleFanDrawMode && drawMode !== TriangleStripDrawMode) {
		console.error('BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:', drawMode);
		return geometry;
	}

	const index = geometry.getIndex();
	const numberOfVertices = index !== null ? index.count : geometry.getAttribute('position').count;
	const newIndices = [];

	for (let i = 0; i < numberOfVertices - 2; i++) {
		if (drawMode === TriangleFanDrawMode) {
			newIndices.push(0, i + 1, i + 2);
		} else {
			if (i % 2 === 0) {
				newIndices.push(i, i + 1, i + 2);
			} else {
				newIndices.push(i + 2, i + 1, i);
			}
		}
	}

	const newGeometry = new BufferGeometry();

	for (const name of Object.keys(geometry.attributes)) {
		newGeometry.setAttribute(name, convertBufferAttribute(geometry.getAttribute(name), index ? index.array : [...Array(numberOfVertices).keys()]));
	}

	newGeometry.setIndex(newIndices);
	newGeometry.computeBoundingSphere();
	newGeometry.computeBoundingBox();

	return newGeometry;
}
