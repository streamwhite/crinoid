import { execFileSync } from 'node:child_process'

try {
  execFileSync('mksquashfs', ['-version'], { stdio: 'ignore' })
} catch {
  console.error('AppImage packaging requires mksquashfs. Install it with:')
  console.error('  Ubuntu/Debian: sudo apt-get install squashfs-tools')
  console.error('  Fedora/RHEL:    sudo dnf install squashfs-tools')
  console.error('  Arch:           sudo pacman -S squashfs-tools')
  process.exit(1)
}
