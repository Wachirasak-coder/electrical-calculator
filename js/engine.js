/**
 * Calculation engine for โปรแกรมคำนวณสายไฟ No.1
 * Formulas follow the Excel workbook generator (INDEX/MATCH, Ca, Cg, VD, PE).
 * Pure functions: pass the JSON from data/cable_calc_data.json to createEngine().
 */

export const DISCLAIMER =
  "ผลคำนวณใช้ประกอบการออกแบบเบื้องต้น ผู้ออกแบบต้องตรวจสอบกับมาตรฐาน ข้อมูลผู้ผลิต และวิศวกรผู้รับผิดชอบงานก่อนนำไปใช้จริง";

export const LICENSE_NOTE =
  "ผลการคำนวณนี้ไม่ใช่แบบก่อสร้าง วิศวกรผู้ได้รับใบอนุญาตต้องตรวจสอบกับมาตรฐานและหน้างานก่อนนำไปใช้จริง";

export const EXTRA_NOTES = [
  "ตาราง 5-21 เป็นตารางฉนวน PVC 70°C (กลุ่มที่ 3) — ในชุดข้อมูลต้นทางมีบางแถวแกนหลายเส้นถูกติดป้าย XLPE/90°C ผิดพลาด โปรแกรมนี้ปรับฉนวนของตาราง 5-20 ถึง 5-26, 5-30, 5-30A, 5-31 และ 5-42 เป็น PVC และตาราง 5-27 ถึง 5-29, 5-32, 5-32A, 5-33, 5-36, 5-37 เป็น XLPE ตามเลขตาราง",
  "ชุดข้อมูลนี้ไม่มีตาราง XLPE กลุ่มที่ 3 (เทียบเท่า 5-21 สำหรับฉนวน 90°C) — หากเลือก CV/XLPE + G3 อาจไม่พบพิกัดกระแส ให้ใช้กลุ่ม G1/G2 หรือตรวจตารางฉบับจริง",
  "กลุ่มที่ 7 แบบเว้นระยะ (SPACED) และ trefoil ในตารางมีเฉพาะสายแกนเดียว 3 เฟส — สายหลายแกนใช้แถวแบบชิดกัน (TOUCHING)",
  "ค่าอ้างอิงโดยประมาณ ต้องตรวจสอบกับตาราง วสท. ฉบับจริง สำหรับแถวสีส้มในตาราง R/X และรายการในส่วนตรวจสอบค่า",
];

const PVC_TABLES = new Set([
  "5-20", "5-21", "5-22", "5-23", "5-24", "5-25", "5-26", "5-30", "5-30A", "5-31", "5-42",
]);
const XLPE_TABLES = new Set([
  "5-27", "5-28", "5-29", "5-32", "5-32A", "5-33", "5-36", "5-37",
]);

export const CORE_OPTIONS = [
  { name: "แกนเดียว (single-core)", id: "singleCore" },
  { name: "หลายแกน (multi-core)", id: "multiCore" },
];

export function sizeKey(size) {
  const n = Number(size);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(1);
}

export function fmtNum(n, digits = 2) {
  if (n === "N/A") return "N/A";
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

export function fmtSize(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "N/A";
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

function numId(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "";
  return Object.is(x, -0) ? "0" : String(x);
}

function matchLE(rows, value, getKey) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const target = Number(value);
  let best = null;
  let bestKey = -Infinity;
  for (const row of rows) {
    const key = Number(getKey(row));
    if (!Number.isFinite(key) || key > target) continue;
    if (key >= bestKey) {
      bestKey = key;
      best = row;
    }
  }
  return best;
}

function smallestGE(list, value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  for (const item of list) {
    if (Number(item) >= Number(value) - 1e-9) return Number(item);
  }
  return null;
}

function largestLE(list, value) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  let best = null;
  for (const item of list) {
    if (Number(item) <= Number(value) + 1e-9) best = Number(item);
  }
  return best;
}

function finite(n) {
  return typeof n === "number" && Number.isFinite(n);
}

export function createEngine(data) {
  const types = data.cable_types;
  const typeByName = new Map(types.map((t) => [t.name, t]));
  const groups = data.groups;
  const groupById = new Map(groups.map((g) => [g.id, g]));

  const amp = new Map();
  const ampTable = new Map();
  for (const rec of data.ampacity) {
    let ins = rec.insulation;
    const table = String(rec.table || "");
    if (PVC_TABLES.has(table)) ins = "PVC";
    else if (XLPE_TABLES.has(table)) ins = "XLPE";
    const key = `${rec.spec}|${ins}|${rec.group}|${rec.cores}|${Number(rec.phase)}|${sizeKey(rec.size)}`;
    if (!amp.has(key)) {
      amp.set(key, rec.iz);
      ampTable.set(key, table);
    }
  }

  const cg = new Map();
  for (const rec of data.cg) {
    if (!cg.has(rec.key)) cg.set(rec.key, rec.cg);
  }

  const vd = new Map();
  for (const rec of data.vd) {
    if (!vd.has(rec.key)) vd.set(rec.key, rec.mv);
  }

  const rx = new Map();
  for (const rec of data.rx) rx.set(rec.key, rec);

  const pe = new Map();
  for (const rec of data.pe_by_phase) pe.set(Number(rec.phase), rec.pe);

  const kMap = new Map();
  for (const rec of data.k_values) kMap.set(`${rec.material}|${rec.insulation}`, rec.k);

  const dims = new Map();
  for (const rec of data.dims) dims.set(rec.key, rec);

  const conduitByMm = new Map(data.conduit.map((c) => [Number(c.conduitMm), c]));
  const wirewayByLabel = new Map(data.wireway.map((w) => [w.label, w]));

  const s1 = new Map();
  for (const [kva, rec] of Object.entries(data.sc_s1)) s1.set(Number(kva), rec);

  const s2 = new Map();
  for (const rec of data.sc_s2_rows) s2.set(`${rec.kva}|${rec.size}`, rec);

  const motors = new Map();
  for (const [type, rows] of Object.entries(data.motors)) {
    for (const row of rows) motors.set(`${type}|${numId(row.kw)}`, row);
  }

  const sizes = data.cable_sizes.map(Number);
  const breakers = data.breakers.map(Number);
  const icuList = data.sc_icu.map(Number);

  function coreId(nameOrId) {
    if (nameOrId === "singleCore" || nameOrId === "multiCore") return nameOrId;
    const found = CORE_OPTIONS.find((c) => c.name === nameOrId);
    return found ? found.id : "singleCore";
  }

  function resolveType(name) {
    return typeByName.get(name) || null;
  }

  function caFactor(medium, insulation, tempC) {
    const table = medium === "ground" ? data.ca_gnd : data.ca_air;
    const row = matchLE(table, tempC, (r) => r.tmin);
    if (!row) return null;
    const value = insulation === "XLPE" ? row.xlpe90 : row.pvc70;
    return value == null ? null : Number(value);
  }

  function cgFactor(groupId, cores, ncirc) {
    const key = `${groupId}|${cores}|1|${numId(ncirc)}`;
    if (cg.has(key)) return Number(cg.get(key));
    return 1;
  }

  function ampKey(spec, ins, group, cores, phase, size) {
    return `${spec}|${ins}|${group}|${cores}|${Number(phase)}|${sizeKey(size)}`;
  }

  function vdMv(ins, cores, phase, group, size) {
    const exact = `${ins}|${cores}|${Number(phase)}|${group}|${sizeKey(size)}`;
    const fallback = `${ins}|${cores}|${Number(phase)}|ALL_GROUPS|${sizeKey(size)}`;
    if (vd.has(exact)) return vd.get(exact);
    if (vd.has(fallback)) return vd.get(fallback);
    return null;
  }

  function rxOf(material, insulation, size) {
    const rec = rx.get(`${material}|${sizeKey(size)}`);
    if (!rec) return null;
    const r = insulation === "XLPE" ? rec.r90 : rec.r70;
    if (r == null) return null;
    return { r: Number(r), x: Number(rec.x) || 0 };
  }

  function kValue(material, insulation) {
    const value = kMap.get(`${material}|${insulation}`);
    return value == null ? null : Number(value);
  }

  function loadCurrent(input) {
    const load = Number(input.load);
    const volt = Number(input.volt);
    const phase = Number(input.phase) === 1 ? 1 : 3;
    if (!Number.isFinite(load) || !Number.isFinite(volt) || volt === 0) return null;
    if (input.unit === "A") return load;
    if (input.unit === "kVA") {
      const den = phase === 1 ? volt : Math.sqrt(3) * volt;
      return den ? (load * 1000) / den : null;
    }
    const pf = Number(input.pf);
    if (!Number.isFinite(pf) || pf === 0) return null;
    const den = phase === 1 ? volt * pf : Math.sqrt(3) * volt * pf;
    return den ? (load * 1000) / den : null;
  }

  function vdTablePercent(mv, ib, length, volt) {
    if (mv == null || !volt) return null;
    return (mv * ib * length) / 1000 / volt * 100;
  }

  function vdRxPercent({ r, x, ib, length, volt, pf, phase }) {
    if (r == null || !volt || pf == null || !Number.isFinite(Number(pf))) return null;
    const pfN = Number(pf);
    if (pfN < -1 || pfN > 1) return null;
    const kfac = Number(phase) === 1 ? 2 : Math.sqrt(3);
    const phi = Math.acos(pfN);
    return (kfac * ib * length) / 1000 * (r * Math.cos(phi) + x * Math.sin(phi)) / volt * 100;
  }

  function cableAlerts({ type, groupId, cores, usesRx }) {
    const alerts = [];
    if (!type) return alerts;
    if (type.spec === "THW-A" || type.vd_ok === false) {
      const item = data.approx_items.find((t) => t.includes("THW-A"));
      alerts.push(item || "สายอะลูมิเนียม THW-A: ไม่มีตาราง Iz ครบในชุดข้อมูลนี้ และไม่คำนวณแรงดันตก");
    }
    if (type.insulation === "XLPE" && groupId === "G3") alerts.push(EXTRA_NOTES[1]);
    if (
      cores === "multiCore" &&
      groupId &&
      (String(groupId).includes("SPACED") || String(groupId).includes("TREFOIL"))
    ) {
      alerts.push(EXTRA_NOTES[2]);
    }
    if (groupId === "G6" && type.spec === "60227 IEC 01") {
      alerts.push("คำเตือน: กลุ่มที่ 6 สายดิน IEC 01 ห้ามฝังดินโดยตรง ต้องร้อยท่อฝังดิน");
    }
    if (usesRx && type.vd_ok !== false) {
      const xNote = data.approx_items.find((t) => t.startsWith("ค่า X"));
      const rNote = data.approx_items.find((t) => t.startsWith("R70/R90"));
      if (xNote) alerts.push(xNote);
      if (rNote) alerts.push(rNote);
    }
    if (groupId && String(groupId).startsWith("G7")) {
      const tray = data.notes.find((t) => t.includes("กลุ่มที่ 7"));
      if (tray) alerts.push(tray);
    }
    return alerts;
  }

  function sizeCable(input, ibOverride = null) {
    const type = resolveType(input.cableType);
    const cores = coreId(input.cores);
    const group = groupById.get(input.group);
    const phase = Number(input.phase) === 1 ? 1 : 3;
    const sets = input.sets == null || input.sets === "" ? null : Number(input.sets);
    const length = input.length == null ? null : Number(input.length);
    const vdLimit = input.vdLimit == null ? null : Number(input.vdLimit);
    const ncirc = input.ncirc == null ? null : Number(input.ncirc);
    const temp = input.temp == null ? null : Number(input.temp);
    const maxSize = input.maxSize == null || input.maxSize === "" ? null : Number(input.maxSize);
    const forcedBreaker =
      input.breaker == null || input.breaker === "" ? null : Number(input.breaker);
    const isc = input.isc == null || input.isc === "" ? null : Number(input.isc);
    const tsec = input.tsec == null || input.tsec === "" ? null : Number(input.tsec);

    const ib = ibOverride != null ? ibOverride : loadCurrent(input);
    const empty = {
      ib,
      pass: "FAIL",
      reason: "กรอกข้อมูลไม่ครบหรือคำนวณกระแสโหลดไม่ได้",
      rows: [],
      alerts: type ? cableAlerts({ type, groupId: input.group, cores, usesRx: false }) : [],
      type,
      cores,
      phase,
    };
    if (!type || !group || !finite(ib) || !finite(sets) || !finite(length) || !finite(vdLimit)) {
      return empty;
    }
    if (!finite(ncirc) || !finite(temp)) return empty;

    const ca = caFactor(group.medium, type.insulation, temp);
    const cgVal = cgFactor(input.group, cores, ncirc);
    const k = kValue(type.material, type.insulation);
    const checkShock = finite(isc) && finite(tsec) && finite(k) && isc !== 0;
    const sminRequired = checkShock ? (isc * 1000 * Math.sqrt(tsec)) / k : null;
    const inA = finite(forcedBreaker) ? forcedBreaker : smallestGE(breakers, ib);
    const vdOk = type.vd_ok !== false;

    const rows = sizes.map((size) => {
      const key = ampKey(type.spec, type.insulation, input.group, cores, phase, size);
      const iz = amp.has(key) ? Number(amp.get(key)) : null;
      if (iz == null || ca == null) {
        return {
          size,
          iz: null,
          izAdj: null,
          ampPass: null,
          vdTable: null,
          vdRx: null,
          vdPass: null,
          smin: sminRequired,
          shockPass: null,
          pass: false,
          table: null,
        };
      }
      const izAdj = iz * ca * cgVal * sets;
      const withinMax = maxSize == null || size <= maxSize + 1e-9;
      const ampPass = finite(inA) && izAdj >= inA - 1e-9 && withinMax;
      let vdTable = null;
      let vdRx = null;
      let vdPass = false;
      if (!vdOk) {
        vdTable = "N/A";
        vdRx = "N/A";
        vdPass = true;
      } else {
        const mv = vdMv(type.insulation, cores, phase, input.group, size);
        vdTable = mv == null ? null : vdTablePercent(mv, ib, length, Number(input.volt));
        const rxv = rxOf(type.material, type.insulation, size);
        vdRx = rxv
          ? vdRxPercent({
              r: rxv.r,
              x: rxv.x,
              ib,
              length,
              volt: Number(input.volt),
              pf: Number(input.pf),
              phase,
            })
          : null;
        if (finite(vdTable)) vdPass = vdTable <= vdLimit + 1e-9;
        else if (finite(vdRx)) vdPass = vdRx <= vdLimit + 1e-9;
        else vdPass = false;
      }
      const shockPass = sminRequired == null ? true : size * sets >= sminRequired - 1e-9;
      const pass = ampPass && vdPass && shockPass;
      return {
        size,
        iz,
        izAdj,
        ampPass,
        vdTable,
        vdRx,
        vdPass,
        smin: sminRequired,
        shockPass,
        pass,
        table: ampTable.get(key) || null,
      };
    });

    const chosen = rows.find((row) => row.pass) || null;
    const pass = chosen ? "PASS" : "FAIL";
    const peSize = chosen ? pe.get(Number(chosen.size)) ?? null : null;
    const usesRx = vdOk && rows.some((row) => finite(row.vdRx));
    return {
      ib,
      in: inA,
      ca,
      cg: cgVal,
      factor: ca == null ? null : ca * cgVal * sets,
      size: chosen ? chosen.size : null,
      iz: chosen ? chosen.iz : null,
      izAdj: chosen ? chosen.izAdj : null,
      vdTable: chosen ? chosen.vdTable : null,
      vdRx: chosen ? chosen.vdRx : null,
      pe: peSize == null ? null : Number(peSize),
      smin: sminRequired,
      k,
      table: chosen ? chosen.table : null,
      pass,
      reason: chosen
        ? "ผ่านพิกัดกระแส แรงดันตก และเงื่อนไขลัดวงจร (ถ้ามีการกรอก)"
        : "ไม่พบขนาดสายที่ผ่านทุกเงื่อนไขในกลุ่ม/ชนิดที่เลือก",
      rows,
      alerts: cableAlerts({ type, groupId: input.group, cores, usesRx }),
      type,
      cores,
      phase,
      group,
      vdOk,
      sets,
    };
  }

  function motorInfo(motorType, kw) {
    const cfg = data.motor_cfg[motorType];
    const row = motors.get(`${motorType}|${numId(kw)}`);
    if (!cfg || !row) return { flc: null, ib: null, multiplier: cfg ? cfg.sizingMultiplier : null, cfg, row: null };
    return {
      flc: row.amp,
      hp: row.hp,
      kw: row.kw,
      multiplier: cfg.sizingMultiplier,
      ib: row.amp * cfg.sizingMultiplier,
      cfg,
      row,
    };
  }

  function rateCurrent(input) {
    const type = resolveType(input.cableType);
    const cores = coreId(input.cores);
    const group = groupById.get(input.group);
    const phase = Number(input.phase) === 1 ? 1 : 3;
    const sets = Number(input.sets);
    const ncirc = Number(input.ncirc);
    const temp = Number(input.temp);
    const size = Number(input.size);
    const alerts = type ? cableAlerts({ type, groupId: input.group, cores, usesRx: false }) : [];
    if (!type || !group || !finite(size) || !finite(sets) || !finite(ncirc) || !finite(temp)) {
      return { pass: "FAIL", reason: "กรอกข้อมูลไม่ครบ", alerts, iz: null };
    }
    const key = ampKey(type.spec, type.insulation, input.group, cores, phase, size);
    const iz = amp.has(key) ? Number(amp.get(key)) : null;
    const table = ampTable.get(key) || "";
    const ca = caFactor(group.medium, type.insulation, temp);
    const cgVal = cgFactor(input.group, cores, ncirc);
    const inMax = iz == null || ca == null ? null : iz * ca * cgVal * sets;
    const breaker = inMax == null ? null : largestLE(breakers, inMax);
    const pass = iz == null || inMax == null ? "FAIL" : "PASS";
    return {
      iz,
      table,
      ca,
      cg: cgVal,
      inMax,
      breaker: breaker == null || breaker === 0 ? null : breaker,
      pass,
      reason:
        pass === "FAIL"
          ? "ไม่พบพิกัดกระแสสำหรับชนิด/กลุ่ม/ขนาดที่เลือก"
          : "คำนวณพิกัดหลังปรับค่าอุณหภูมิและกลุ่มวงจรแล้ว",
      alerts,
      type,
      size,
      sets,
    };
  }

  function voltageDropRoute(input) {
    const volt = Number(input.volt);
    const limit = Number(input.limit);
    const sections = (input.sections || []).map((section, index) => {
      const current = section.current == null || section.current === "" ? null : Number(section.current);
      const length = section.length == null || section.length === "" ? null : Number(section.length);
      const active = section.cableType && finite(current) && finite(length) && finite(Number(section.size));
      if (!active) {
        return { index: index + 1, active: false, vdTable: null, vdRx: null };
      }
      const type = resolveType(section.cableType);
      if (!type) return { index: index + 1, active: false, vdTable: null, vdRx: null, missing: true };
      const cores = coreId(section.cores);
      const phase = Number(section.phase) === 1 ? 1 : 3;
      const size = Number(section.size);
      const pf = Number(section.pf);
      if (type.vd_ok === false) {
        return {
          index: index + 1,
          active: true,
          vdTable: "N/A",
          vdRx: "N/A",
          type,
          phase,
          size,
          current,
          length,
        };
      }
      const mv = vdMv(type.insulation, cores, phase, section.group, size);
      const vdTable = mv == null || !volt ? null : vdTablePercent(mv, current, length, volt);
      const rxv = rxOf(type.material, type.insulation, size);
      const vdRx = rxv
        ? vdRxPercent({ r: rxv.r, x: rxv.x, ib: current, length, volt, pf, phase })
        : null;
      return {
        index: index + 1,
        active: true,
        vdTable,
        vdRx,
        type,
        cores,
        phase,
        size,
        current,
        length,
        group: section.group,
      };
    });
    const sumOf = (key) =>
      sections.reduce((sum, section) => (finite(section[key]) ? sum + section[key] : sum), 0);
    const vdTableSum = sumOf("vdTable");
    const vdRxSum = sumOf("vdRx");
    let worst = null;
    for (const section of sections) {
      if (!finite(section.vdTable)) continue;
      if (!worst || section.vdTable > worst.vdTable) worst = section;
    }
    const pass = finite(limit) && vdTableSum <= limit + 1e-9 ? "PASS" : "FAIL";
    const anyRx = sections.some((section) => finite(section.vdRx));
    const alerts = [];
    if (anyRx) {
      const xNote = data.approx_items.find((t) => t.startsWith("ค่า X"));
      const rNote = data.approx_items.find((t) => t.startsWith("R70/R90"));
      if (xNote) alerts.push(xNote);
      if (rNote) alerts.push(rNote);
    }
    if (sections.some((section) => section.type && section.type.vd_ok === false)) {
      alerts.push("สาย THW-A ไม่คำนวณแรงดันตก (แสดง N/A)");
    }
    return {
      sections,
      vdTableSum,
      vdRxSum,
      worst: worst ? worst.index : null,
      pass,
      reason:
        pass === "PASS"
          ? "แรงดันตกรวมตลอดเส้นทางไม่เกินเกณฑ์ (คิดเส้นทางที่แย่ที่สุด ไม่ใช่ค่าเฉลี่ย)"
          : "แรงดันตกรวมเกินเกณฑ์ — พิจารณาเพิ่มขนาดสายในช่วงที่ %VD สูงสุด",
      alerts,
      limit,
      volt,
    };
  }

  function lookupDim(label, size) {
    if (!label || size == null || size === "") return null;
    return dims.get(`${label}|${sizeKey(size)}`) || null;
  }

  function conduitFill(input) {
    const lines = input.lines || [];
    let conductors = 0;
    let area = 0;
    let missing = false;
    const rows = lines.map((line, index) => {
      const qty = line.qty == null || line.qty === "" ? null : Number(line.qty);
      const size = line.size == null || line.size === "" ? null : Number(line.size);
      if (!line.label || !finite(qty) || qty === 0 || !finite(size)) {
        return { index: index + 1, active: false };
      }
      const dim = lookupDim(line.label, size);
      if (!dim) {
        missing = true;
        return { index: index + 1, active: true, label: line.label, size, qty, area: null, total: null };
      }
      const each = Number(dim.area_mm2);
      const total = each * qty;
      conductors += qty;
      area += total;
      return {
        index: index + 1,
        active: true,
        label: line.label,
        size,
        qty,
        area: each,
        total,
        od: dim.od_mm,
      };
    });
    if (conductors <= 0) {
      return { pass: "FAIL", reason: "ยังไม่มีรายการสายในท่อ", rows, conductors: 0, area: 0, alerts: [] };
    }
    const percent = conductors === 1 ? 53 : conductors === 2 ? 31 : 40;
    const usableKey =
      conductors === 1 ? "usableArea1Cable" : conductors === 2 ? "usableArea2Cables" : "usableArea3OrMore";
    let conduit = null;
    const forced = input.conduitMm == null || input.conduitMm === "" ? null : Number(input.conduitMm);
    if (finite(forced) && conduitByMm.has(forced)) conduit = conduitByMm.get(forced);
    else conduit = data.conduit.find((item) => Number(item[usableKey]) >= area - 1e-9) || null;
    const area100 = conduit ? Number(conduit.area100) : null;
    const usable = area100 == null ? null : (area100 * percent) / 100;
    const fill = area100 ? (area / area100) * 100 : null;
    const pass =
      conduit && usable != null && fill != null && area <= usable + 1e-9 && fill <= percent + 1e-9
        ? "PASS"
        : "FAIL";
    const alerts = [];
    if (missing) alerts.push("บางรายการไม่พบพื้นที่ครอบครองของชื่อสาย/ขนาดที่เลือก จึงไม่ถูกรวมในพื้นที่");
    const fillNote = data.notes.find((t) => t.includes("ตาราง 5-3"));
    if (fillNote) alerts.push(fillNote);
    return {
      rows,
      conductors,
      area,
      percent,
      conduitMm: conduit ? Number(conduit.conduitMm) : null,
      conduitInch: conduit ? conduit.conduitInch : null,
      area100,
      usable,
      fill,
      pass,
      missing,
      reason:
        pass === "PASS"
          ? "พื้นที่บรรจุไม่เกินเกณฑ์ตาราง 5-3"
          : "พื้นที่บรรจุเกินขนาดท่อ หรือไม่พบท่อที่ใหญ่พอ",
      alerts,
    };
  }

  function wirewayFill(input) {
    const tray = wirewayByLabel.get(input.label);
    let area = 0;
    let missing = false;
    const rows = (input.lines || []).map((line, index) => {
      const qty = line.qty == null || line.qty === "" ? null : Number(line.qty);
      const size = line.size == null || line.size === "" ? null : Number(line.size);
      if (!line.label || !finite(qty) || qty === 0 || !finite(size)) return { index: index + 1, active: false };
      const dim = lookupDim(line.label, size);
      if (!dim) {
        missing = true;
        return { index: index + 1, active: true, area: null, total: null, label: line.label, size, qty };
      }
      const each = Number(dim.area_mm2);
      const total = each * qty;
      area += total;
      return { index: index + 1, active: true, label: line.label, size, qty, area: each, total };
    });
    const trayArea = tray ? Number(tray.area) : null;
    const limit = trayArea == null ? null : trayArea * 0.2;
    const fill = trayArea ? (area / trayArea) * 100 : null;
    const pass = tray && limit != null && area <= limit + 1e-9 ? "PASS" : "FAIL";
    const alerts = [];
    if (missing) alerts.push("บางรายการไม่พบพื้นที่ครอบครองของชื่อสาย/ขนาดที่เลือก จึงไม่ถูกรวมในพื้นที่");
    const note = data.notes.find((t) => t.includes("20%"));
    if (note) alerts.push(note);
    return {
      rows,
      area,
      trayArea,
      limit,
      fill,
      pass,
      label: input.label,
      reason: pass === "PASS" ? "พื้นที่บรรจุไม่เกิน 20% ของหน้าตัดราง" : "พื้นที่บรรจุเกิน 20% ของหน้าตัดราง หรือยังไม่เลือกราง",
      alerts,
    };
  }

  function peConductor(input) {
    const phase = Number(input.phaseSize);
    const peSize = pe.has(phase) ? Number(pe.get(phase)) : null;
    let rule = "";
    if (finite(phase)) {
      if (phase <= 16) rule = "S ≤ 16 mm² → PE = S";
      else if (phase <= 35) rule = "16 < S ≤ 35 mm² → PE = 16 mm²";
      else rule = "S > 35 mm² → PE = S/2 (เลื่อนขึ้นเป็นขนาดมาตรฐาน)";
    }
    const type = resolveType(input.cableType);
    const alerts = [];
    const spare = data.approx_items.find((t) => t.includes("สายดินสำรอง"));
    if (spare) alerts.push(spare);
    if (input.group === "G6" && type && type.spec === "60227 IEC 01") {
      alerts.push("สายดิน IEC 01 ห้ามฝังดินโดยตรง ต้องร้อยท่อฝังดิน");
    }
    const pass = peSize == null ? "FAIL" : "PASS";
    return {
      pe: peSize,
      rule,
      pass,
      warning: input.group === "G6" && input.cableType === "IEC 01 (THW)"
        ? "สายดิน IEC 01 ห้ามฝังดินโดยตรง ต้องร้อยท่อฝังดิน"
        : "—",
      reason: pass === "PASS" ? "ได้ขนาด PE ตามตาราง 4-1 / IEC 60364-5-54 Table 54.2" : "ไม่พบขนาดเฟสในตาราง PE",
      alerts,
    };
  }

  function mdbBreaker(input) {
    if (input.mode === "A") {
      const row = s1.get(Number(input.kva));
      if (!row) return { pass: "FAIL", reason: "ไม่พบขนาดหม้อแปลงในตาราง ส-1", alerts: [] };
      const af = Array.isArray(row.af) ? row.af.join(",") : String(row.af);
      return {
        mode: "A",
        in: row.In,
        at: row.at,
        af,
        pass: "PASS",
        note: `คำนวณขนาดสายเมนในฟังก์ชันสายเมนหม้อแปลง โดยใช้กระแส ${fmtNum(row.In, 1)} A`,
        reason: "เลือก AT/AF จากตาราง ส-1",
        alerts: [],
        kva: Number(input.kva),
      };
    }
    const design = Number(input.designA);
    if (!finite(design)) return { pass: "FAIL", reason: "กรอกกระแสออกแบบ", alerts: [], mode: "B" };
    const af = smallestGE(breakers, design);
    const pass = af == null ? "FAIL" : "PASS";
    return {
      mode: "B",
      in: design,
      at: design,
      af,
      pass,
      note: `คำนวณขนาดสายเมนในฟังก์ชันสายเมนหม้อแปลง โดยใช้กระแส ${fmtNum(design, 1)} A`,
      reason: pass === "PASS" ? "AT เท่ากับกระแสออกแบบ และ AF เป็นเฟรมมาตรฐานที่ไม่เล็กกว่า AT" : "ไม่พบเฟรมมาตรฐาน",
      alerts: [],
    };
  }

  function scMdb(input) {
    const row = s1.get(Number(input.kva));
    const margin = Number(input.margin);
    if (!row || !finite(margin)) return { pass: "FAIL", reason: "ไม่พบหม้อแปลงหรือเปอร์เซ็นต์เผื่อ", alerts: [] };
    const ik = Number(row.ik);
    const after = ik * (1 + margin / 100);
    const icu = smallestGE(icuList, after);
    const installed = input.installedIcu == null || input.installedIcu === "" ? null : Number(input.installedIcu);
    let pass = "FAIL";
    if (icu != null) {
      if (!finite(installed)) pass = "PASS";
      else pass = installed >= after - 1e-9 ? "PASS" : "FAIL";
    }
    return {
      ik,
      after,
      icu,
      icu25: row.ic25,
      z: data.sc_z[String(input.kva)] ?? data.sc_z[input.kva] ?? null,
      installed,
      pass,
      reason:
        pass === "PASS"
          ? "พิกัดตัดกระแส Icu ของเบรกเกอร์ทุกตัวในตู้ต้องไม่ต่ำกว่าค่าที่คำนวณ (ข้อ 3.5.2)"
          : "Icu ไม่พอหรือคำนวณไม่ได้",
      alerts: [],
    };
  }

  function conservativeDistance(length) {
    const l = Number(length);
    if (!Number.isFinite(l)) return null;
    if (l < 10) return 0;
    if (l < 25) return 10;
    if (l < 50) return 25;
    if (l < 75) return 50;
    if (l < 100) return 75;
    return 100;
  }

  function scDb(input) {
    const margin = Number(input.margin);
    const length = Number(input.length);
    const row = s2.get(`${Number(input.kva)}|${input.size}`);
    const distance = conservativeDistance(length);
    const field = {
      0: "ik_0m",
      10: "ik_10m",
      25: "ik_25m",
      50: "ik_50m",
      75: "ik_75m",
      100: "ik_100m",
    }[distance];
    if (!row || !field || !finite(margin)) {
      return { pass: "FAIL", reason: "ไม่พบชุดข้อมูลตาราง ส-2 สำหรับหม้อแปลง/ขนาดสายนี้", alerts: [] };
    }
    const ik = Number(row[field]);
    const after = ik * (1 + margin / 100);
    const icu = smallestGE(icuList, after);
    const note = data.notes.find((t) => t.includes("ตาราง ส-2"));
    return {
      ik,
      distance,
      after,
      icu,
      pass: icu == null ? "FAIL" : "PASS",
      reason: icu == null ? "ไม่พบพิกัด Icu ที่เพียงพอ" : "ใช้ระยะในตารางที่สั้นกว่าหรือเท่ากับความยาวจริง (Ik สูงกว่า) ตามข้อ 3.5.2",
      alerts: note ? [note] : [],
    };
  }

  function powerFactor(input) {
    const p = Number(input.p);
    const pf1 = Number(input.pf1);
    const pf2 = Number(input.pf2);
    const volt = Number(input.volt);
    const phase = Number(input.phase) === 1 ? 1 : 3;
    if (![p, pf1, pf2, volt].every(finite) || volt === 0 || pf1 <= 0 || pf1 > 1 || pf2 <= 0 || pf2 > 1) {
      return { pass: "FAIL", reason: "ตรวจสอบ PF (ต้อง 0 < PF ปัจจุบัน < PF เป้าหมาย ≤ 0.99)", alerts: [] };
    }
    const phi1 = Math.acos(pf1);
    const phi2 = Math.acos(pf2);
    const s1 = p / pf1;
    const q1 = p * Math.tan(phi1);
    const s2 = p / pf2;
    const q2 = p * Math.tan(phi2);
    const qc = p * (Math.tan(phi1) - Math.tan(phi2));
    const i1 = phase === 1 ? (s1 * 1000) / volt : (s1 * 1000) / (Math.sqrt(3) * volt);
    const i2 = phase === 1 ? (s2 * 1000) / volt : (s2 * 1000) / (Math.sqrt(3) * volt);
    const pass = pf2 > pf1 && pf2 < 1 && qc > 0 ? "PASS" : "FAIL";
    return {
      phi1: (phi1 * 180) / Math.PI,
      phi2: (phi2 * 180) / Math.PI,
      s1,
      q1,
      s2,
      q2,
      qc,
      i1,
      i2,
      iDrop: i1 - i2,
      freq: input.freq,
      pass,
      reason:
        pass === "PASS"
          ? "คำนวณ Qc เรียบร้อย เลือกขั้นคาปาซิเตอร์มาตรฐานที่ใกล้เคียงหรือสูงกว่าค่า Qc"
          : "ตรวจสอบ PF (ต้อง 0 < PF ปัจจุบัน < PF เป้าหมาย ≤ 0.99)",
      alerts: ["ความถี่ถูกบันทึกไว้ตามชีตต้นทาง แต่สูตร Qc = P (tan φ1 − tan φ2) ไม่ได้ใช้ค่าความถี่"],
    };
  }

  function pvCa(temp) {
    const row = matchLE(data.pv_ca, temp, (r) => r.tempC);
    if (!row || row.factor == null) return 1;
    return Number(row.factor);
  }

  function solarOn(input) {
    const roof = Number(input.roof);
    const kwh = Number(input.kwhDay);
    const inverter = Number(input.inverterKw);
    const volt = Number(input.volt);
    const phase = Number(input.phase) === 1 ? 1 : 3;
    const vdc = Number(input.vdc);
    const psh = Number(input.psh);
    const m2 = Number(input.m2PerKwp);
    const temp = Number(input.tempDc);
    if (![roof, kwh, inverter, volt, vdc, psh, m2].every(finite) || volt === 0 || psh === 0 || m2 === 0) {
      return { pass: "FAIL", reason: "กรอกข้อมูลระบบโซลาร์ไม่ครบ", alerts: [] };
    }
    const kwpRoof = roof / m2;
    const kwpEnergy = kwh / psh;
    const kwp = Math.min(kwpRoof, kwpEnergy, inverter);
    const ibAc = phase === 1 ? (inverter * 1000) / volt : (inverter * 1000) / (Math.sqrt(3) * volt);
    const iDc = vdc === 0 ? null : ((kwp * 1000) / vdc) * 1.5625;
    const ca = pvCa(temp);
    let dcSize = null;
    let dcIz = null;
    if (iDc != null) {
      for (const row of data.pv_amp) {
        const iz = Number(row.base40) * ca;
        if (iz >= iDc - 1e-9) {
          dcSize = Number(row.size);
          dcIz = iz;
          break;
        }
      }
    }
    const pass = kwp > 0 && dcSize != null ? "PASS" : "FAIL";
    const pvNote = data.notes.find((t) => t.includes("สาย PV"));
    return {
      kwpRoof,
      kwpEnergy,
      kwp,
      ibAc,
      iDc,
      ca,
      dcSize,
      dcIz,
      pass,
      acType: input.cableType,
      acGroup: input.group,
      reason: pass === "PASS" ? "ได้ขนาดระบบและสาย DC ที่ผ่านพิกัดหลัง Ca" : "คำนวณขนาดระบบหรือสาย DC ไม่ได้",
      alerts: pvNote ? [pvNote] : [],
    };
  }

  function solarOff(input) {
    const load = Number(input.whDay);
    const days = Number(input.days);
    const volt = Number(input.volt);
    const dod = Number(input.dod);
    const battEff = Number(input.battEff);
    const psh = Number(input.psh);
    const chargeEff = Number(input.chargeEff);
    const peak = Number(input.peakW);
    if (![load, days, volt, dod, battEff, psh, chargeEff, peak].every((n) => finite(n) && n > 0)) {
      return { pass: "FAIL", reason: "กรอกข้อมูลให้มากกว่าศูนย์", alerts: [] };
    }
    const storeWh = (load * days) / battEff;
    const ah = storeWh / (volt * dod);
    const pvW = load / (psh * chargeEff);
    const scc = (pvW / volt) * 1.25;
    const inverter = peak * 1.25;
    const idc = (peak / volt) * 1.25;
    const pass = ah > 0 && pvW > 0 && inverter > 0 ? "PASS" : "FAIL";
    return {
      storeWh,
      ah,
      pvW,
      scc,
      inverter,
      idc,
      pass,
      reason: "ลำดับ Load → Battery → PV → SCC → Inverter (ต้องปรับกับข้อมูลแผงและแบตเตอรี่จริง)",
      alerts: ["ค่านี้เป็นสูตรทางวิศวกรรมทั่วไปสำหรับระบบ Off-grid ต้องปรับกับข้อมูลแผงและแบตเตอรี่จริง"],
    };
  }

  function boxFill(input) {
    const size = Number(input.size);
    const conductors = Number(input.conductors);
    const earth = Number(input.earth) ? 1 : 0;
    const devices = Number(input.devices);
    if (![size, conductors, devices].every(finite)) {
      return { pass: "FAIL", reason: "กรอกข้อมูลกล่องไม่ครบ", alerts: [] };
    }
    const equiv = conductors + earth + devices * 2;
    let key = "10";
    if (size <= 1.5) key = "1.5";
    else if (size <= 2.5) key = "2.5";
    else if (size <= 4) key = "4";
    else if (size <= 6) key = "6";
    const category = input.category || "";
    const list = data.boxes.filter((box) => !category || box.category === category);
    const passing = list.filter((box) => {
      const max = box.maxConductors ? box.maxConductors[key] : null;
      return max != null && max !== "" && Number(max) >= equiv;
    });
    const box = passing[0] || null;
    return {
      equiv,
      allowanceKey: key,
      box,
      passingCount: passing.length,
      pass: box ? "PASS" : "FAIL",
      reason: box
        ? "พบกล่องมาตรฐานที่จำนวนตัวนำสูงสุดไม่น้อยกว่าตัวนำเทียบเท่า"
        : "ไม่มีกล่องในตาราง 6.4 ที่จุตัวนำเทียบเท่านี้",
      alerts: [],
    };
  }

  function ductBank(size, circuits) {
    if (circuits == null || circuits === "" || size == null) return null;
    const row = data.t538.find((item) => Number(item.sizeSqmm) === Number(size));
    if (!row) return { size, circuits: Number(circuits), iz: null };
    const iz = row.circuits[String(circuits)];
    return { size: Number(size), circuits: Number(circuits), iz: iz == null ? null : Number(iz) };
  }

  function run(id, input) {
    switch (Number(id)) {
      case 1:
        return rateCurrent(input);
      case 2:
      case 3:
      case 6:
      case 10: {
        const result = sizeCable(input);
        if (Number(id) === 6) result.duct = ductBank(result.size, input.ductCircuits);
        return result;
      }
      case 4: {
        const info = motorInfo(input.motorType, input.load);
        const result = sizeCable(input, info.ib);
        result.motor = info;
        if (info.ib == null) {
          result.pass = "FAIL";
          result.reason = "ไม่พบกระแสพิกัดมอเตอร์ในตารางสำหรับชนิดและกำลังที่เลือก";
          result.ib = null;
        }
        return result;
      }
      case 5: {
        const volt = Number(input.volt);
        const kva = Number(input.load);
        const ib = finite(volt) && volt !== 0 && finite(kva) ? (kva * 1000) / (Math.sqrt(3) * volt) : null;
        const result = sizeCable(input, ib);
        result.ibMode = "transformer";
        return result;
      }
      case 7:
        return voltageDropRoute(input);
      case 8:
        return conduitFill(input);
      case 9:
        return wirewayFill(input);
      case 11:
        return peConductor(input);
      case 12:
        return mdbBreaker(input);
      case 13:
        return scMdb(input);
      case 14:
        return scDb(input);
      case 15:
        return powerFactor(input);
      case 16:
        return solarOn(input);
      case 17:
        return solarOff(input);
      case 18:
        return boxFill(input);
      default:
        return { pass: "FAIL", reason: "ไม่พบฟังก์ชัน", alerts: [] };
    }
  }

  return {
    data,
    types,
    groups,
    sizes,
    breakers,
    icuList,
    dimLabels: [...new Set(data.dims.map((d) => d.label))],
    kvaList: [...s1.keys()].sort((a, b) => a - b),
    scSizes: [...new Set(data.sc_s2_rows.map((r) => String(r.size)))],
    wireway: data.wireway,
    conduit: data.conduit,
    boxes: data.boxes,
    motorCfg: data.motor_cfg,
    motorKw(type) {
      return (data.motors[type] || []).map((row) => row.kw);
    },
    run,
    sizeCable,
    rateCurrent,
    motorInfo,
  };
}
