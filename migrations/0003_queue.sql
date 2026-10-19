-- Đánh thường: players waiting for a match. A row gets the room code and its seat once two are paired.
CREATE TABLE IF NOT EXISTS clash_queue (
  ticket text PRIMARY KEY,
  deck text NOT NULL,
  code text,
  seat text,
  joined_at bigint NOT NULL,
  updated_at bigint NOT NULL
);
