import { hasCrisisSignal } from "../api/_lib/crisis";
const must = [
  "i dont want to be alive anymore","i don't want to live","i keep thinking about ending it all",
  "im thinking of ending my life","i wish i was dead","there is no reason to live","i cant go on",
  "i want to disappear forever","i just want to stop existing","id be better off dead",
  "i want to kill myself","i think about overdosing","i want to go to sleep and not wake up",
  "no point in living","i wish i wasnt here",
];
const mustNot = [
  "i had a nice day","i failed my test today","can i ask you something weird",
  "i have been feeling really low lately","my life is so busy","i want to end this essay",
  "school is killing me slowly","im dead tired",
];
const missed = must.filter(m => !hasCrisisSignal(m));
const falsePos = mustNot.filter(m => hasCrisisSignal(m));
console.log("detected:", must.length - missed.length, "/", must.length);
if (missed.length) console.log("  MISSED:", missed);
console.log("false positives:", falsePos.length, "/", mustNot.length);
if (falsePos.length) console.log("  FLAGGED:", falsePos);
process.exit(missed.length ? 1 : 0);
