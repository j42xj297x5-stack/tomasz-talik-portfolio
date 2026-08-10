import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
async function readGlbJson(path) { const bytes = await readFile(new URL(path, import.meta.url)); assert.equal(bytes.toString('utf8', 0, 4), 'glTF'); let offset = 12; while (offset < bytes.length) { const length = bytes.readUInt32LE(offset); const type = bytes.toString('utf8', offset + 4, offset + 8); offset += 8; if (type === 'JSON') return JSON.parse(bytes.toString('utf8', offset, offset + length).replace(/[\0 ]+$/, '')); offset += length; } throw new Error(`JSON chunk absent in ${path}`); }
const defaults = { translation: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] };
const validTrs = (node) => ['translation', 'rotation', 'scale'].every((key) => (node[key] ?? defaults[key]).every(Number.isFinite)) && (node.scale ?? defaults.scale).every((value) => value !== 0);
const descendants = (json, index, result = new Set()) => { for (const child of json.nodes[index].children ?? []) { result.add(child); descendants(json, child, result); } return result; };
const unique = (json, name) => { const matches = json.nodes.map((node, index) => node.name === name ? index : -1).filter((i) => i >= 0); assert.equal(matches.length, 1, `${name} occurs exactly once`); return matches[0]; };
const monkey = await readGlbJson('../public/glb/monkey.glb'); assert.ok(monkey.nodes.every(validTrs)); assert.ok(descendants(monkey, unique(monkey, 'MONKEY_ANCHOR')).has(unique(monkey, 'monkey')));
const stone = await readGlbJson('../public/glb/monkey_stone.glb'); assert.ok(stone.nodes.every(validTrs)); const children = descendants(stone, unique(stone, 'MONKEY_STONE_ROOT'));
assert.ok(children.has(unique(stone, 'MONKEY_SEAT_ANCHOR'))); assert.ok([...children].some((index) => Number.isInteger(stone.nodes[index].mesh)));
console.log('Monkey GLB authored-node contract assertions passed.');
