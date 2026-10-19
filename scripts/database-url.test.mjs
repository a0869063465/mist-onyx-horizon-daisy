import { test } from "node:test";
import assert from "node:assert/strict";
import { findDatabaseUrl } from "./database-url.mjs";

test("DATABASE_URL wins", () => {
  assert.equal(findDatabaseUrl({ DATABASE_URL: "postgres://a", STORAGE_URL: "postgres://b" }), "postgres://a");
});

test("a prefixed integration variable is found, pooled before unpooled", () => {
  assert.equal(
    findDatabaseUrl({ STORAGE_URL_UNPOOLED: "postgresql://u", STORAGE_URL: "postgresql://p", HOME: "/root" }),
    "postgresql://p",
  );
});

test("empty or non-Postgres values do not count", () => {
  assert.equal(findDatabaseUrl({ DATABASE_URL: "  ", OTHER_URL: "https://x" }), undefined);
});
