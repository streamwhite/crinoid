export function getBuildInputs(root: string): Promise<string[]>
export function createBuildSignature(root: string, context: readonly string[]): Promise<string>
export function cacheKey(argumentsList: readonly string[]): string
