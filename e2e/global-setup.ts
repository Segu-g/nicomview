import { execSync } from 'child_process'
import path from 'path'

export default function globalSetup(): void {
  const projectRoot = path.resolve(__dirname, '..')
  console.log('[e2e] Building app...')
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' })
  console.log('[e2e] Build complete.')
}
