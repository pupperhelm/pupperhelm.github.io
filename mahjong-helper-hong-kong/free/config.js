// Set this single value to the URL printed by `npm run deploy` before publishing /free.
window.GIVEAWAY_API_URL = location.hostname === "localhost"
  ? "http://127.0.0.1:8787"
  : "https://mahjong-helper-giveaway.pupperhelm.workers.dev";
