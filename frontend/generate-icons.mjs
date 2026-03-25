// Genera los íconos PNG para la PWA desde un SVG inline.
// Ejecutar una sola vez: npm run generate-icons
import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

// Ícono: N sobre fondo oscuro con acento verde neón
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Fondo -->
  <rect width="512" height="512" rx="96" fill="#111111"/>
  <!-- Resplandor suave -->
  <circle cx="256" cy="256" r="200" fill="#c8f135" opacity="0.05"/>
  <!-- Letra N: barra izquierda -->
  <rect x="100" y="112" width="68" height="288" fill="#c8f135"/>
  <!-- Letra N: barra derecha -->
  <rect x="344" y="112" width="68" height="288" fill="#c8f135"/>
  <!-- Letra N: diagonal -->
  <line x1="168" y1="112" x2="344" y2="400"
        stroke="#c8f135" stroke-width="82" stroke-linecap="butt"/>
</svg>`

const buf = Buffer.from(svg)

await sharp(buf).resize(192, 192).png().toFile(join(outDir, 'icon-192.png'))
console.log('✓ icon-192.png')

await sharp(buf).resize(512, 512).png().toFile(join(outDir, 'icon-512.png'))
console.log('✓ icon-512.png')

console.log('\n✓ Íconos generados en public/icons/')
