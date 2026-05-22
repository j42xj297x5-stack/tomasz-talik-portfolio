import './styles/main.css';
import * as THREE from '../vendor/three/three.module.js';

const app = document.querySelector('#app');

if (!app) {
  throw new Error('Missing #app mount element.');
}

app.innerHTML = `
  <main class="app-shell">
    <h1>Interactive AI Portfolio runtime scaffold</h1>
    <p>Vite runtime is active. Three.js vendor bridge is prepared for MVP scene work.</p>
  </main>
`;

console.info('Runtime scaffold booted. Three.js revision:', THREE.REVISION);
