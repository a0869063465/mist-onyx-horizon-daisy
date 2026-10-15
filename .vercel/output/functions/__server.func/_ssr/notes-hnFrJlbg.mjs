import { t as createServerFn } from "./ssr.mjs";
import { t as createSsrRpc } from "./createSsrRpc-C1p7zOu_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notes-hnFrJlbg.js
var sendNote = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("3f89063fe7151acb3c339cc3f995e1ae43ec9479b168d16664aadb3b1abf0afc"));
var listNotes = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("9893a21cecf9328291c97894ea74488705ec15ba3d1f7ca6fc87d219049cfd2c"));
//#endregion
export { sendNote as n, listNotes as t };
