/** Board art per environment card. Top = opponent half, bottom = your half; same file means one full picture. */
export const ENV_BOARDS: Record<string, { top: string; bottom: string }> = {
  "thao-nguyen": { top: "/env/thao-nguyen-tren.jpg", bottom: "/env/thao-nguyen-duoi.jpg" },
  "dat-da": { top: "/env/dat-da-tren.jpg", bottom: "/env/dat-da-duoi.jpg" },
  "rung-ram": { top: "/env/rung-ram.jpg", bottom: "/env/rung-ram.jpg" },
  nui: { top: "/env/nui.jpg", bottom: "/env/nui.jpg" },
  "bong-toi": { top: "/env/bong-toi.jpg", bottom: "/env/bong-toi.jpg" },
  "cu-dia-may-moc": { top: "/env/cu-dia-may-moc.jpg", bottom: "/env/cu-dia-may-moc.jpg" },
  "thanh-dia-thien-su": { top: "/env/thanh-dia-thien-su-tren.jpg", bottom: "/env/thanh-dia-thien-su-duoi.jpg" },
  "nui-dung-nham": { top: "/env/nui-dung-nham.jpg", bottom: "/env/nui-dung-nham.jpg" },
};

export const DEFAULT_BOARD_ART = "/board.png";

/** The environment id whose board art and layout apply, or undefined for the default board. */
export function boardEnv(env: string | null | undefined): string | undefined {
  return env && ENV_BOARDS[env] ? env : undefined;
}

export function topArt(env: string | null | undefined): string {
  const id = boardEnv(env);
  return id ? ENV_BOARDS[id].top : DEFAULT_BOARD_ART;
}

export function bottomArt(env: string | null | undefined): string {
  const id = boardEnv(env);
  return id ? ENV_BOARDS[id].bottom : DEFAULT_BOARD_ART;
}
