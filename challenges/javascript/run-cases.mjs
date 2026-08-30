import {readFile} from "node:fs/promises";
import {isDeepStrictEqual} from "node:util";

import {ChallengeError, solve} from "./reference.mjs";

const root = new URL("../", import.meta.url);
const cases = JSON.parse(await readFile(new URL("cases.json", root), "utf8")).cases;
const results = [];

for (const fixture of cases) {
  let observed;
  let error = null;
  try {
    observed = solve(fixture.challenge, fixture.input);
  } catch (caught) {
    error = caught instanceof ChallengeError ? caught.code : "UNEXPECTED_RUNTIME_ERROR";
  }
  const ok = fixture.expected_error
    ? error === fixture.expected_error
    : error === null && isDeepStrictEqual(observed, fixture.expected);
  results.push({id: fixture.id, challenge: fixture.challenge, ok, observed, error});
}

process.stdout.write(JSON.stringify({language: "javascript", results}));
process.exitCode = results.every(item => item.ok) ? 0 : 1;
