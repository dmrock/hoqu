// `server-only` is resolved by the Next.js bundler, not under Vitest's Node
// runtime. Aliased here to a noop so server-only query modules can be imported
// directly in tests. See vitest.config.ts resolve.alias.
export {};
