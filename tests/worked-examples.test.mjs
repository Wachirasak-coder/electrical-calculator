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

function run(id, patch = {}) {
  return engine.run(id, { ...defaultInput(id), ...patch });
}

test("3-phase 30 kW, PF 0.85, 80 m matches the workbook example", () => {
  const result = run(3);
  assert.equal(r2(result.ib), 50.94);
  assert.equal(result.in, 63);
  assert.equal(result.size, 16);
  assert.equal(r2(result.vdTable), 2.55);
  assert.equal(result.pass, "PASS");
  assert.equal(result.table, "5-27");
  assert.equal(r2(result.ca), 1.05);
  assert.equal(result.cg, 1);
  assert.equal(result.pe, 16);
  assert.equal(result.rows.find((row) => row.size === 10).pass, false);
  assert.ok(result.rows.find((row) => row.size === 10).vdTable > 3);
});

test("1-phase 5 kW matches the workbook example", () => {
  const result = run(2);
  assert.equal(r2(result.ib), 24.15);
  assert.equal(result.in, 25);
  assert.equal(result.size, 10);
  assert.equal(result.pass, "PASS");
  assert.equal(result.table, "5-20");
  assert.equal(result.pe, 10);
  assert.equal(r2(result.vdTable), 1.85);
  assert.equal(result.rows.find((row) => row.size === 6).pass, false);
});

test("motor 15 kW DOL matches the workbook example", () => {
  const result = run(4);
  assert.equal(result.motor.flc, 28);
  assert.equal(result.motor.multiplier, 1.25);
  assert.equal(result.ib, 35);
  assert.equal(result.in, 40);
  assert.equal(result.size, 6);
  assert.equal(result.pass, "PASS");
  assert.equal(result.table, "5-21");
  assert.equal(r2(result.vdTable), 2.8);
  assert.equal(result.rows.find((row) => row.size === 4).ampPass, false);
});

test("500 kVA transformer feeder matches the workbook example", () => {
  const result = run(5);
  assert.equal(r2(result.ib), 721.69);
  assert.equal(result.in, 800);
  assert.equal(result.size, 400);
  assert.equal(result.pass, "PASS");
  assert.equal(result.table, "5-32");
  assert.equal(result.ca, 1);
  assert.equal(result.cg, 0.97);
  assert.equal(result.pe, 240);
  assert.equal(result.rows.find((row) => row.size === 300).ampPass, false);
});

test("LV reverse rating of IEC 01 10 mm² at 35°C", () => {
  const result = run(1);
  assert.equal(result.iz, 50);
  assert.equal(result.ca, 1.08);
  assert.equal(result.cg, 1);
  assert.equal(result.inMax, 54);
  assert.equal(result.breaker, 50);
  assert.equal(result.table, "5-20");
  assert.equal(result.pass, "PASS");
});

test("MV 200 A feeder and optional duct-bank lookup", () => {
  const result = run(6);
  assert.equal(result.ib, 200);
  assert.equal(result.in, 200);
  assert.equal(result.size, 70);
  assert.equal(result.pass, "PASS");
  assert.equal(result.duct, null);
  const withDuct = run(6, { ductCircuits: 1 });
  assert.equal(withDuct.duct.iz, 251);
});

test("voltage-drop route sums the worked sections", () => {
  const result = run(7);
  assert.equal(r2(result.sections[0].vdTable), 0.99);
  assert.equal(r2(result.sections[1].vdTable), 0.6);
  assert.equal(r2(result.vdTableSum), 1.59);
  assert.equal(r2(result.vdRxSum), 1.52);
  assert.equal(result.worst, 1);
  assert.equal(result.pass, "PASS");
  assert.ok(result.alerts.some((note) => note.startsWith("ค่า X")));
});

test("conduit fill example passes at 25 mm", () => {
  const result = run(8);
  assert.equal(result.conductors, 7);
  assert.equal(r2(result.area), 195.4);
  assert.equal(result.percent, 40);
  assert.equal(result.conduitMm, 25);
  assert.equal(r2(result.fill), 39.8);
  assert.equal(result.pass, "PASS");
});

test("wireway 100×300 example stays within 20%", () => {
  const result = run(9);
  assert.equal(r2(result.area), 4292.8);
  assert.equal(result.trayArea, 30000);
  assert.equal(result.limit, 6000);
  assert.equal(r2(result.fill), 14.31);
  assert.equal(result.pass, "PASS");
});

test("cable tray group 7 selects 50 mm² for 200 A", () => {
  const result = run(10);
  assert.equal(result.ib, 200);
  assert.equal(result.in, 200);
  assert.equal(result.cg, 0.97);
  assert.equal(result.size, 50);
  assert.equal(r2(result.vdTable), 2.25);
  assert.equal(result.pass, "PASS");
  assert.equal(result.rows.find((row) => row.size === 35).ampPass, false);
});

test("PE for 95 mm² phase is 50 mm²", () => {
  const result = run(11);
  assert.equal(result.pe, 50);
  assert.equal(result.pass, "PASS");
  assert.match(result.rule, /S > 35/);
  assert.ok(result.alerts.some((note) => note.includes("สายดินสำรอง")));
});

test("MDB mode B 800 A and mode A 500 kVA", () => {
  const modeB = run(12);
  assert.equal(modeB.at, 800);
  assert.equal(modeB.af, 800);
  assert.equal(modeB.pass, "PASS");
  const modeA = run(12, { mode: "A" });
  assert.equal(modeA.in, 722);
  assert.equal(modeA.at, 700);
  assert.equal(modeA.af, "800,1000");
  assert.equal(modeA.pass, "PASS");
});

test("short circuit at MDB for 1000 kVA with 25% margin", () => {
  const result = run(13);
  assert.equal(result.ik, 23.2);
  assert.equal(result.after, 29);
  assert.equal(result.icu, 30);
  assert.equal(result.pass, "PASS");
  const low = run(13, { installedIcu: 25 });
  assert.equal(low.pass, "FAIL");
});

test("short circuit at DB uses the conservative 25 m column for 40 m", () => {
  const result = run(14);
  assert.equal(result.distance, 25);
  assert.equal(result.ik, 17.9);
  assert.equal(r2(result.after), 22.38);
  assert.equal(result.icu, 25);
  assert.equal(result.pass, "PASS");
});

test("power factor correction Qc for 80 kW", () => {
  const result = run(15);
  assert.equal(r2(result.qc), 44.26);
  assert.equal(r2(result.s1), 106.67);
  assert.equal(r2(result.s2), 84.21);
  assert.equal(r2(result.i1), 153.96);
  assert.equal(r2(result.i2), 121.55);
  assert.equal(result.pass, "PASS");
});

test("on-grid solar example sizes the DC cable", () => {
  const result = run(16);
  assert.equal(r2(result.kwpRoof), 13.33);
  assert.equal(r2(result.kwpEnergy), 2.67);
  assert.equal(r2(result.kwp), 2.67);
  assert.equal(r2(result.ibAc), 7.22);
  assert.equal(r2(result.iDc), 10.42);
  assert.equal(result.ca, 0.9);
  assert.equal(result.dcSize, 1.5);
  assert.equal(r2(result.dcIz), 18.9);
  assert.equal(result.pass, "PASS");
});

test("off-grid solar example follows load, battery, array, inverter order", () => {
  const result = run(17);
  assert.equal(r2(result.storeWh), 2666.67);
  assert.equal(r2(result.ah), 111.11);
  assert.equal(r2(result.pvW), 333.33);
  assert.equal(r2(result.scc), 8.68);
  assert.equal(result.inverter, 500);
  assert.equal(r2(result.idc), 10.42);
  assert.equal(result.pass, "PASS");
});

test("box fill example selects the first standard box that fits", () => {
  const result = run(18);
  assert.equal(result.equiv, 13);
  assert.equal(result.allowanceKey, "4");
  assert.equal(result.box.id, "SQ_120x54");
  assert.equal(result.box.metricLabel, "120x54");
  assert.equal(result.pass, "PASS");
});

test("THW-A does not invent ampacity or voltage drop", () => {
  const result = run(3, { cableType: "THW-A" });
  assert.equal(result.pass, "FAIL");
  assert.equal(result.size, null);
  assert.ok(result.alerts.some((note) => note.includes("THW-A")));
});

test("a longer 3-phase run fails 16 mm² and steps up", () => {
  const result = run(3, { length: 200 });
  assert.ok(result.size > 16);
  assert.equal(result.pass, "PASS");
  assert.ok(result.vdTable <= 3);
});

test("grouped circuits apply Cg below 1", () => {
  const single = run(3);
  const grouped = run(3, { ncirc: 2 });
  assert.equal(single.cg, 1);
  assert.equal(grouped.cg, 0.8);
  assert.ok(grouped.size >= single.size);
});
