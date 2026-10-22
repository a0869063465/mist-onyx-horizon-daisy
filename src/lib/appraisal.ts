import { addStars } from "./shop.ts";
import { trialLevels } from "./trial.ts";

/**
 * Giám định (chủ game 22/10): Sát hạch (multiple choice, real stats, the reason shown after each answer, one wrong
 * answer restarts the quiz) and Thực chiến (scripted matches, `trial.ts`). Both done pays 2 sao, once per card.
 */
export type Question = { ask: string; options: string[]; right: number; why: string };

export const QUIZ: Record<string, Question[]> = {
  "khong-lo-mot-mat": [
    {
      ask: "Quái đối thủ có 3 công đánh vào Khổng lồ 1 mắt (3 thủ, 1 máu). Khổng lồ mất bao nhiêu máu?",
      options: ["Mất 1 máu, nó chết", "Không mất máu", "Mất 3 máu"],
      right: 1,
      why: "Thủ 3 chặn trọn 3 sát thương vật lý, nên đòn đó không làm nó mất máu.",
    },
    {
      ask: "Cách chắc chắn nhất để hạ Khổng lồ 1 mắt là gì?",
      options: ["Đánh thường bằng quái công cao", "Dùng sát thương phép dù chỉ 1", "Chờ nó tự chết"],
      right: 1,
      why: "Nó có 0 thủ phép và chỉ 1 máu, nên 1 sát thương phép là đủ hạ nó.",
    },
    {
      ask: "Khổng lồ 1 mắt tự đánh vào đối thủ vào lượt bạn. Việc đó tốn gì?",
      options: ["Không tốn gì", "Thêm 1 mana", "Mất 1 máu"],
      right: 1,
      why: "Đòn đánh chủ động của Đập phá tốn thêm 1 mana. Đòn khi bị tấn công thì không tốn.",
    },
    {
      ask: "Khổng lồ 1 mắt đánh thường 3 lần. Công của nó khi đó là bao nhiêu?",
      options: ["3", "4", "6"],
      right: 2,
      why: "Mỗi đòn đánh thường cộng thêm 1 công vĩnh viễn: 3 + 3 = 6.",
    },
    {
      ask: "Đối thủ có Khổng lồ 1 mắt đã tích rất nhiều công. Bạn có 1 phép gây 1 sát thương phép. Nên làm gì?",
      options: ["Dùng phép ngay để hạ nó", "Cho quái chặn nó", "Giữ phép cho lượt sau"],
      right: 0,
      why: "Nó chỉ có 1 máu và 0 thủ phép. Càng chờ, nó càng tích thêm công.",
    },
  ],
};

type Progress = Record<string, { quiz?: boolean; trials?: number[]; paid?: boolean }>;
const KEY = "clash-appraisal";

function load(): Progress {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Progress;
  } catch {
    return {};
  }
}

function save(all: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage may be blocked */
  }
}

export const canAppraise = (cardId: string) => Boolean(QUIZ[cardId]);

export function appraisalOf(cardId: string) {
  const mine = load()[cardId] ?? {};
  return { quiz: Boolean(mine.quiz), trials: mine.trials ?? [], paid: Boolean(mine.paid) };
}

/** Pays the 2 sao once both parts are done. Returns true when it just paid. */
function settle(cardId: string, all: Progress): boolean {
  const mine = all[cardId] ?? {};
  const done = Boolean(mine.quiz) && trialLevels(cardId).every((_, level) => mine.trials?.includes(level));
  if (!done || mine.paid) return false;
  all[cardId] = { ...mine, paid: true };
  addStars(2);
  return true;
}

export function markQuiz(cardId: string): boolean {
  const all = load();
  all[cardId] = { ...all[cardId], quiz: true };
  const paid = settle(cardId, all);
  save(all);
  return paid;
}

export function markTrial(cardId: string, level: number): boolean {
  const all = load();
  const trials = new Set(all[cardId]?.trials ?? []);
  trials.add(level);
  all[cardId] = { ...all[cardId], trials: [...trials] };
  const paid = settle(cardId, all);
  save(all);
  return paid;
}

export const TRIAL_KEY = "clash-trial";
export const TRIAL_MODE = "trial";
