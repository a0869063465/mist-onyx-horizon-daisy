import { t as createServerFn } from "./ssr.mjs";
import { t as createSsrRpc } from "./createSsrRpc-C1p7zOu_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/net-room-BL71IoEz.js
var openRoom = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("9c515b5ab74ba576fee659189c3a54a59530c677852757366ae3d985490de28d"));
var joinRoom = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("15ecc3e755df3b9ed0ec9f8129ac6476b1e87c909c14de331df347c1d6df1f6f"));
var pushDuel = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("d5ecf24ba4072f599dc81f8181e26fb47b3bf086a2d8d53b8c743e9ea41a78b6"));
var pollRoom = createServerFn({ method: "POST" }).validator((data) => data).handler(createSsrRpc("05d40818bc546e2e078d59d041621272806464b17ff29de63862bc624fd86bc6"));
//#endregion
export { pushDuel as i, openRoom as n, pollRoom as r, joinRoom as t };
