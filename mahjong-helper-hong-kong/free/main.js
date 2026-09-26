(() => {
  const api = window.GIVEAWAY_API_URL?.replace(/\/$/, "");
  const remaining = document.getElementById("remaining");
  const claimSection = document.getElementById("claim-section");
  const redeemSection = document.getElementById("redeem-section");
  const promoCode = document.getElementById("promo-code");
  const redeemLink = document.getElementById("redeem-link");
  const soldOutSection = document.getElementById("sold-out-section");
  const button = document.getElementById("claim-button");
  const error = document.getElementById("error");
  const tokenKey = "mahjong-giveaway-claim-v1";

  function showError(message) { error.textContent = message; error.hidden = false; }
  function soldOut() {
    remaining.textContent = "All 50 free copies have been claimed.";
    claimSection.hidden = true;
    soldOutSection.hidden = false;
    error.hidden = true;
  }
  function token() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(tokenKey) || "null");
      if (saved && Date.now() - saved.time < 15 * 60_000 && /^[a-f0-9]{64}$/.test(saved.value)) return saved.value;
    } catch { /* Storage may be disabled. */ }
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const value = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    try { sessionStorage.setItem(tokenKey, JSON.stringify({ value, time: Date.now() })); } catch { /* The current click can still claim. */ }
    return value;
  }

  async function status() {
    if (!api || api.includes("YOUR_SUBDOMAIN")) throw new Error("Giveaway setup is not complete yet.");
    const response = await fetch(`${api}/status`, { cache: "no-store" });
    if (!response.ok) throw new Error("Availability is temporarily unavailable. Please try again shortly.");
    const data = await response.json();
    if (data.total === 0) throw new Error("The giveaway is not open yet. Please check back soon.");
    if (!data.available) return soldOut();
    remaining.textContent = `${data.remaining} of ${data.total} copies remaining`;
    claimSection.hidden = false;
    soldOutSection.hidden = true;
    error.hidden = true;
  }

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Claiming…";
    error.hidden = true;
    try {
      const response = await fetch(`${api}/claim`, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token() }),
      });
      const data = await response.json();
      if (response.status === 409 && data.error === "sold_out") return soldOut();
      if (!response.ok) throw new Error(data.error || "Claim failed. Please try again.");
      const redemptionUrl = new URL(data.redemptionUrl);
      const code = redemptionUrl.searchParams.get("code");
      if (redemptionUrl.origin !== "https://play.google.com" || redemptionUrl.pathname !== "/redeem" || !code) {
        throw new Error("Unexpected redemption link. Please try again.");
      }
      promoCode.textContent = code;
      redeemLink.href = redemptionUrl.href;
      remaining.textContent = "Your free copy is ready.";
      claimSection.hidden = true;
      redeemSection.hidden = false;
    } catch (failure) {
      showError(failure instanceof Error ? failure.message : "Claim failed. Please try again.");
    } finally {
      button.disabled = false;
      button.textContent = "Claim a free copy";
    }
  });

  status().catch(failure => {
    remaining.textContent = "Availability unavailable";
    showError(failure instanceof Error ? failure.message : "Please try again shortly.");
  });
})();
