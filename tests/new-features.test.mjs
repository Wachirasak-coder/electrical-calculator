import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { defaultInput } from "../js/catalog.js";
import { createEngine } from "../js/engine.js";

const data = JSON.parse(readFileSync(new URL("../data/cable_calc_data.json", import.meta.url), "utf8"));
const engine = createEngine(data);

function r2(n) {
  return Math.round(n * 100) / 100;
}

test("3-phase wiring reports a 50% neutral and capped earth without changing the cable", () => {
  const result = engine.run(3, { ...defaultInput(3), wiring: "3P_4W_G", neutralRatio: 0.5 });
  assert.equal(result.size, 16);
  assert.equal(r2(result.ib), 50.94);
  assert.equal(result.in, 63);
  assert.equal(result.neutralSize, 10);
  assert.equal(result.pe, 16);
  assert.equal(result.peFromBreaker, 6);
  assert.equal(result.peRecommended, 16);
  assert.equal(result.suggestedConduit.conduitMm, 40);
  assert.equal(result.suggestedConduit.conductors, 5);
  assert.equal(r2(result.suggestedConduit.area), 346.8);
});

test("picking the breaker first sizes the cable for that In", () => {
  const result = engine.run(3, {
    ...defaultInput(3),
    designMode: "breaker",
    breaker: 63,
    load: null,
    unit: "A",
  });
  assert.equal(result.ib, 63);
  assert.equal(result.in, 63);
  assert.equal(result.size, 25);
  assert.equal(r2(result.vdTable), 2.02);
  assert.equal(result.pass, "PASS");
});

test("aerial aluminium 200 A at 40°C selects 70 mm²", () => {
  const result = engine.run(19, defaultInput(19));
  assert.equal(result.ib, 200);
  assert.equal(result.in, 200);
  assert.equal(result.size, 70);
  assert.equal(result.iz, 220);
  assert.equal(r2(result.vd), 1.89);
  assert.equal(result.pass, "PASS");
  assert.ok(result.alerts.some((note) => note.includes("40°C")));
});

test("buried MV uses the duct-bank table and does not invent a spacing factor", () => {
  const result = engine.run(6, {
    ...defaultInput(6),
    group: "G6",
    mvClass: "12/20",
    buriedSpacing: "touching",
  });
  assert.equal(result.size, 70);
  assert.equal(result.table, "5-38");
  assert.equal(result.cg, 1);
  assert.equal(result.pass, "PASS");
  assert.ok(result.alerts.some((note) => note.includes("5-38")));
  assert.ok(result.alerts.some((note) => note.includes("5-45")));
  assert.ok(result.alerts.some((note) => note.includes("12/20")));
});

test("pull box straight is 8× and angle is 6× plus the other conduits", () => {
  const straight = engine.run(20, { mode: "straight", conduits: [50] });
  assert.equal(straight.length, 400);
  const angle = engine.run(20, { mode: "angle", conduits: [50, 32, 25] });
  assert.equal(angle.largest, 50);
  assert.equal(angle.length, 357);
  const uPull = engine.run(20, { mode: "u", conduits: [50, 32, 25] });
  assert.equal(uPull.length, 357);
});

test("jacketed cables use the jacketed fill percentage", () => {
  const result = engine.conduitFill({ lines: [{ label: "NYY 3/C", size: 25, qty: 5 }] });
  assert.equal(result.jacketed, true);
  assert.equal(result.percent, 35);
  assert.equal(result.conduitMm, 125);
  assert.equal(r2(result.fill), 25.99);
  assert.equal(result.pass, "PASS");
});

test("detailed box fill counts terminations, through wires, loops, devices and earth", () => {
  const result = engine.run(18, {
    size: 2.5,
    conductors: 0,
    earth: 1,
    devices: 1,
    terminations: 6,
    through: 2,
    loops: 2,
    category: "",
  });
  assert.equal(result.equiv, 13);
  assert.equal(result.box.id, "SQ_100x54");
  assert.equal(result.pass, "PASS");
});

test("on-grid bill and daytime share set the energy and still size the AC cable", () => {
  const result = engine.run(16, { ...defaultInput(16), billBaht: 9000, tariff: 5, daytimeShare: 0.5 });
  assert.equal(r2(result.kwhFromBill), 30);
  assert.equal(r2(result.kwp), 5);
  assert.equal(result.acSize, 1);
  assert.equal(result.acIn, 10);
  assert.equal(r2(result.acVd), 1.8);
  assert.equal(result.dcSize, 2.5);
});

test("off-grid appliances and a lithium preset size the battery and standard steps", () => {
  const result = engine.run(17, {
    ...defaultInput(17),
    whDay: 0,
    volt: 12,
    days: 1,
    batteryType: "lithium",
    appliances: [
      { w: 20, qty: 2, hours: 4 },
      { w: 60, qty: 1, hours: 6 },
    ],
  });
  assert.equal(result.loadWh, 520);
  assert.equal(r2(result.storeWh), 547.37);
  assert.equal(r2(result.ah), 57.02);
  assert.equal(result.suggestedVolt, 12);
  assert.equal(result.controllerStep, 20);
  assert.equal(result.inverterStep, 500);
  assert.equal(result.dcSize, 6);
  assert.equal(result.dod, 0.8);
  assert.equal(result.battEff, 0.95);
});
