CREATE TABLE IF NOT EXISTS clash_rooms (
  code text PRIMARY KEY,
  host_deck text NOT NULL,
  guest_deck text,
  duel text,
  rev integer NOT NULL DEFAULT 0,
  updated_at bigint NOT NULL
);
