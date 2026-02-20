import { SimRegistry, type SimPluginRegisterFn } from "./registry";

/**
 * Auto-load all plugin modules under src/content (recursive) and let them
 * register listeners into a single SimRegistry.
 */
export function loadSimRegistry(): SimRegistry {
  const registry = new SimRegistry();

  // Vite will include all matching modules in the bundle.
  // Eager import ensures registration happens immediately.
  const modules = import.meta.glob("../../data/plugins/**/plugin.ts", {
    eager: true,
  });

  for (const [path, mod] of Object.entries(modules)) {
    const anyMod = mod as any;
    const register: unknown = anyMod?.register ?? anyMod?.default;
    if (typeof register !== "function") {
      // Keep failures visible during development.
      // (No throw: missing plugins should not break the whole app.)
      // eslint-disable-next-line no-console
      console.warn(
        `[simPlugins] module ${path} has no register() export; skipped`,
      );
      continue;
    }
    (register as SimPluginRegisterFn)(registry);
  }

  registry.finalize();
  return registry;
}
