/**
 * The Postgres address the app uses. `DATABASE_URL` first; when a Vercel storage integration was connected with
 * another prefix (its default is `STORAGE`, giving `STORAGE_URL`), any other variable whose value is a Postgres
 * address is used too, so the game finds its database whatever the variable was named. Addresses marked
 * UNPOOLED come last. Shared by the server (src/lib/db.ts) and the deploy-time migrator.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {string | undefined}
 */
export function findDatabaseUrl(env) {
  const usable = (/** @type {string | undefined} */ value) =>
    typeof value === "string" && /^postgres(ql)?:\/\//i.test(value.trim()) ? value.trim() : undefined;
  const direct = usable(env.DATABASE_URL) ?? usable(env.POSTGRES_URL);
  if (direct) return direct;
  const names = Object.keys(env)
    .filter((name) => usable(env[name]))
    .sort((a, b) => Number(/UNPOOLED|NON_POOLING/.test(a)) - Number(/UNPOOLED|NON_POOLING/.test(b)) || a.localeCompare(b));
  return names.length ? usable(env[names[0]]) : undefined;
}
