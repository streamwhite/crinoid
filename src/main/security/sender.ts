export function isTrustedSender(sender: { url: string }, protocol: string): boolean {
  try { return new URL(sender.url).protocol === protocol } catch { return false }
}
