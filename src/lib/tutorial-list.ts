/**
 * The Hướng dẫn list (owner, 18/10): Chơi → Hướng dẫn shows every tutorial as a banner, in LoR's challenge style;
 * tapping one starts it. "Cơ bản" is the one built so far. `pic` is a full-body picture on the left of the banner,
 * between its edge and the name; `flip` turns it to face the name (owner, 18/10).
 */
export type TutorialInfo = { key: string; title: string; pic: string; flip?: boolean };

export const TUTORIALS: TutorialInfo[] = [
  {
    key: "co-ban",
    title: "Cơ bản",
    // Nàng tiên giữ khoá, the tutorial's guide.
    pic: "/tutorial/nguoi-giu-khoa.webp",
    flip: true,
  },
];

/** Tutorials played to the end; their banners show HOÀN THÀNH. */
const DONE_KEY = "clash-tutorials-done";
/** The tutorial being played, set when it starts. */
const PLAYING_KEY = "clash-tutorial-key";

export function tutorialsDone(): string[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(DONE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((key): key is string => typeof key === "string") : [];
  } catch {
    return [];
  }
}

export function playTutorial(key: string) {
  sessionStorage.setItem(PLAYING_KEY, key);
}

/** The tutorial being played reached its end (not skipped). */
export function markTutorialDone() {
  const key = sessionStorage.getItem(PLAYING_KEY) || TUTORIALS[0].key;
  const done = tutorialsDone();
  if (done.includes(key)) return;
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify([...done, key]));
  } catch {
    // Not remembered on this phone.
  }
}
