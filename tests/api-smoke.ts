import todayHandler from "../api/grace/today";
import chatHandler from "../api/grace/chat";
import { hasCrisisSignal } from "../api/_lib/crisis";
import { resourcesForCountry } from "../api/_lib/support-resources";

function mockRes() {
  const r: any = { _status: 200, _json: undefined, _headers: {} };
  r.status = (c: number) => { r._status = c; return r; };
  r.json = (b: unknown) => { r._json = b; return r; };
  r.setHeader = (k: string, v: string) => { r._headers[k] = v; return r; };
  return r;
}
const req = (method: string, body?: unknown): any => ({ method, body, headers: {} });

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  -> " + extra : ""}`);
  ok ? pass++ : fail++;
};

(async () => {
  // 1. today
  const r1 = mockRes();
  todayHandler(req("GET"), r1);
  check("today returns a practice", r1._status === 200 && !!r1._json?.greeting, r1._json?.greeting);
  check("today has no asterisks", !JSON.stringify(r1._json).includes("*"));

  // 2. scope decline (no model call, no key needed)
  const r2 = mockRes();
  await chatHandler(req("POST", { message: "what is the capital of France" }), r2);
  check("off-topic lookup is declined", r2._status === 200 && r2._json?.crisisSupport === false, String(r2._json?.reply).slice(0, 60));

  // 3. faith question bypasses the scope filter (would reach the model)
  const r3 = mockRes();
  await chatHandler(req("POST", { message: "what is the meaning of sabr" }), r3);
  check("faith question is NOT declined by the filter", r3._status === 500, "reaches model path (no key here)");

  // 4. crisis detection across phrasings
  const crisisCases = [
    "i dont want to be alive anymore",
    "i don't want to live",
    "i keep thinking about ending it all",
    "i wish i was dead",
    "there is no reason to live",
    "i cant go on",
  ];
  const missed = crisisCases.filter((m) => !hasCrisisSignal(m));
  check("crisis phrasings all detected", missed.length === 0, missed.join(" | ") || "all 6");

  const safeCases = ["i had a nice day", "i failed my test today", "can i ask you something weird"];
  const falsePos = safeCases.filter((m) => hasCrisisSignal(m));
  check("ordinary messages not flagged", falsePos.length === 0, falsePos.join(" | ") || "none");

  // 5. support resources
  const pk = resourcesForCountry("PK");
  check("Pakistan gets real numbers", pk.some((r) => r.phone.includes("0304")), pk.map((r) => r.label).join(", "));
  const unknown = resourcesForCountry(undefined);
  check("unknown country falls back to directory", unknown.some((r) => r.phone.includes("findahelpline")), unknown.map((r) => r.label).join(", "));
  check("no TODO placeholders remain", !JSON.stringify(pk).includes("TODO"));

  // 6. missing key is handled gracefully
  const r6 = mockRes();
  await chatHandler(req("POST", { message: "i feel low today" }), r6);
  check("missing key returns friendly error", r6._status === 500 && String(r6._json?.error).includes("reach my words"), String(r6._json?.error));

  // 7. method guards
  const r7 = mockRes();
  await chatHandler(req("GET"), r7);
  check("chat rejects GET", r7._status === 405);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
