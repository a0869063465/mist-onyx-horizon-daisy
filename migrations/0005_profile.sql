-- Hồ sơ bạn bè: bản tổng hợp trận với người, gửi từ máy người chơi (JSON nhỏ).
ALTER TABLE clash_players ADD COLUMN IF NOT EXISTS profile text;
