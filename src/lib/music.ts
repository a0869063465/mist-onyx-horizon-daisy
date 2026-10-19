/** The owner's two outside-a-match tracks (18/10): one of them at random, then another at random when it ends. */
export const TRACKS = ["/music/vong-lap-thu-bai-1.m4a", "/music/vong-lap-thu-bai-2.m4a"];
/** The owner's match track (19/10), played over and over. */
export const MATCH_TRACKS = ["/music/vong-lan-card.mp3"];

export const pickTrack = (list: string[]) => list[Math.floor(Math.random() * list.length)];

/**
 * The menu track that plays first, chosen when the app opens so the game load screen can fetch it whole
 * (owner, 19/10: the music started late the first time, while the phone was still downloading it).
 */
export const FIRST_TRACK = pickTrack(TRACKS);
