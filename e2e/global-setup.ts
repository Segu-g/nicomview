import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

export default function globalSetup(): void {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  console.log('[e2e] Building app...')
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' })
  console.log('[e2e] Build complete.')
}
