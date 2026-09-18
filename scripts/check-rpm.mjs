import { execFileSync } from 'node:child_process'

try {
  execFileSync('rpmbuild', ['--version'], { stdio: 'ignore' })
} catch {
  console.error('RPM packaging requires rpmbuild. Install it with:')
  console.error('  Ubuntu/Debian: sudo apt-get install rpm')
  console.error('  Fedora/RHEL:    sudo dnf install rpm-build')
  console.error('  Arch:           sudo pacman -S rpm')
  process.exit(1)
}
