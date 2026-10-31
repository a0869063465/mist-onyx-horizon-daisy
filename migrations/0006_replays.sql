-- Replay (chủ game 31/10): bản ghi từng bước của trận (Vs Máy, Đánh thường, Tuỳ chọn), đã nén, mỗi người giữ 10 trận gần nhất.
CREATE TABLE IF NOT EXISTS clash_replays (
  player text NOT NULL,
  mid text NOT NULL,
  at bigint NOT NULL,
  data text NOT NULL,
  PRIMARY KEY (player, mid)
);
CREATE INDEX IF NOT EXISTS clash_replays_player_at ON clash_replays (player, at);
