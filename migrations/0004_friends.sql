-- Bạn bè (chủ game 31/10): người chơi theo ID gắn với máy, lời mời kết bạn, lời mời vào trận.
CREATE TABLE IF NOT EXISTS clash_players (
  id text PRIMARY KEY,
  cover text,
  mode text,
  room text,
  seat text,
  watched_at bigint,
  seen_at bigint NOT NULL
);

-- Một hàng mỗi cặp: a < b. status 'ask' (from_id gửi lời mời) hoặc 'friend'.
CREATE TABLE IF NOT EXISTS clash_friends (
  a text NOT NULL,
  b text NOT NULL,
  from_id text NOT NULL,
  status text NOT NULL,
  created_at bigint NOT NULL,
  PRIMARY KEY (a, b)
);
CREATE INDEX IF NOT EXISTS clash_friends_b ON clash_friends (b);

-- Lời mời vào trận: state 'open', 'yes', 'no'.
CREATE TABLE IF NOT EXISTS clash_invites (
  id text PRIMARY KEY,
  from_id text NOT NULL,
  to_id text NOT NULL,
  code text NOT NULL,
  state text NOT NULL,
  created_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS clash_invites_to ON clash_invites (to_id);

-- Xem trận (đợt B): trận chạy trên máy người chơi (Vs Máy, Test) gửi bản chụp lên đây; người xem đọc.
CREATE TABLE IF NOT EXISTS clash_watch (
  player_id text PRIMARY KEY,
  duel text NOT NULL,
  rev bigint NOT NULL,
  updated_at bigint NOT NULL
);
