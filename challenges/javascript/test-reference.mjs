import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {ChallengeError, SOLVERS, solitaireDeal, solve} from "./reference.mjs";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
const cases = JSON.parse(await readFile(new URL("cases.json", root), "utf8")).cases;
const clone = value => JSON.parse(JSON.stringify(value));

test("manifest and solver coverage match", () => {
  const declared = manifest.challenges.map(item => item.id).sort();
  assert.deepEqual(Object.keys(SOLVERS).sort(), declared);
  assert.deepEqual([...new Set(cases.map(item => item.challenge))].sort(), declared);
});

test("shared oracle cases", async t => {
  for (const fixture of cases) {
    await t.test(fixture.id, () => {
      const supplied = clone(fixture.input);
      if (fixture.expected_error) {
        assert.throws(
          () => solve(fixture.challenge, supplied),
          error => error instanceof ChallengeError && error.code === fixture.expected_error,
        );
      } else assert.deepEqual(solve(fixture.challenge, supplied), fixture.expected);
      assert.deepEqual(supplied, fixture.input, "solver mutated supplied input");
    });
  }
});

test("solitaire deal has one visible card per column", () => {
  const deal = solitaireDeal();
  assert.deepEqual(deal.tableau.map(column => column.length), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(deal.stock.length, 24);
  assert.ok(deal.tableau.every(column => column.filter(card => card.face_up).length === 1));
});
