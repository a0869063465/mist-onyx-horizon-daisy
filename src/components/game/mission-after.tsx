import { DailyCard } from "@/components/mission-card";
import { useDaily } from "@/lib/daily-missions";
import { DAILY_LIST } from "@/lib/mission-list";
import type { MatchGain } from "@/lib/mission-store";
import { tr } from "@/lib/i18n";

/**
 * Bảng nhiệm vụ sau trận (chủ game 05/11): chỉ các hàng Ngày vừa đổi tiến độ (thắng hay thua đều hiện).
 * Thanh chạy lần lượt từ số cũ lên số mới; đủ thì hàng thành vàng, bấm ô sao để nhận ngay.
 */
export function missionRowsOf(gain: MatchGain) {
  return DAILY_LIST.flatMap((row, at) => {
    const pair = row.count === "play" ? gain.play : row.count === "pvp" ? gain.pvp : null;
    if (!pair) return [];
    const from = Math.min(row.goal, pair[0]);
    return from === Math.min(row.goal, pair[1]) ? [] : [{ row, at, from }];
  });
}

export function MissionAfter({ gain, onDone }: { gain: MatchGain; onDone: () => void }) {
  const daily = useDaily();
  const rows = missionRowsOf(gain);
  return (
    <div className="ma" onClick={onDone}>
      <div className="ma-box" onClick={(event) => event.stopPropagation()}>
        <h2>{tr("Nhiệm vụ ngày")}</h2>
        <ol className="ma-list">
          {rows.map(({ row, at, from }, index) => (
            <DailyCard key={row.id} row={row} at={at} daily={daily} from={from} delay={index * 350} />
          ))}
        </ol>
        <button type="button" className="ma-go" onClick={onDone}>
          {tr("Tiếp tục")}
        </button>
      </div>
    </div>
  );
}
