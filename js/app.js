import { CALCS, calcById, defaultInput } from "./catalog.js";
import {
  CORE_OPTIONS,
  DISCLAIMER,
  EXTRA_NOTES,
  LICENSE_NOTE,
  createEngine,
  fmtNum,
  fmtSize,
} from "./engine.js";

const app = document.getElementById("app");
let engine = null;

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function route() {
  const hash = location.hash.replace(/^#/, "");
  if (hash === "notes") return "notes";
  const id = Number(hash);
  if (id >= 1 && id <= 18) return id;
  return "home";
}

function shell(body, title) {
  document.title = title ? `${title} — โปรแกรมคำนวณสายไฟ No.1` : "โปรแกรมคำนวณสายไฟ No.1";
  return `
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <div>
          <p class="eyebrow">Electrical Engineer No.1</p>
          <h1><a href="#home">โปรแกรมคำนวณสายไฟ No.1</a></h1>
          <p class="byline">by <a href="https://www.facebook.com/ElectricalEngineerNo.1" target="_blank" rel="noopener">Electrical Engineer No.1</a></p>
        </div>
      </div>
      <div class="standards">
        <span>วสท. 022001-22</span>
        <span>IEC 60364</span>
        <span>IEC 60502</span>
        <span>IEC 60228</span>
        <span>EIT 022013</span>
      </div>
    </div>
  </header>
  <main class="wrap" id="main">${body}</main>`;
}

function footer() {
  return `
  <footer class="site">
    <p>${esc(DISCLAIMER)}</p>
    <p>${esc(LICENSE_NOTE)}</p>
    <p><a href="https://www.facebook.com/ElectricalEngineerNo.1" target="_blank" rel="noopener">Electrical Engineer No.1</a>
      · <a href="#notes">ตรวจสอบค่า</a>
      · <a href="eleccalc/">เครื่องคำนวณพื้นฐาน ElecCalc Pro</a></p>
  </footer>`;
}

function homeView() {
  const cards = CALCS.map((calc) => `
    <a class="calc-card" href="#${calc.id}" data-text="${esc(`${calc.id} ${calc.title} ${calc.en} ${calc.blurb}`.toLowerCase())}">
      <span class="num">${String(calc.id).padStart(2, "0")}</span>
      <span>
        <h2>${esc(calc.title)}</h2>
        <p><span class="en">${esc(calc.en)}</span> — ${esc(calc.blurb)}</p>
      </span>
    </a>`).join("");
  return shell(`
    <section class="banner">
      <strong>เครื่องมือช่วยออกแบบระบบไฟฟ้าเบื้องต้น</strong>
      <p>กรอกช่องสีเหลืองแล้วผลจะเปลี่ยนทันที ขนาดสายถูกเลือกจากขนาดมาตรฐานที่เล็กที่สุดที่ผ่านพิกัดกระแสหลัง Ca และ Cg, แรงดันตก และทนลัดวงจรถ้ามีการกรอก</p>
    </section>
    <input id="q" class="search" type="search" placeholder="ค้นหาฟังก์ชัน เช่น แรงดันตก, มอเตอร์, โซลาร์" aria-label="ค้นหาฟังก์ชัน">
    <div class="grid" id="calc-grid">${cards}</div>
    <a class="calc-card legacy" href="eleccalc/">
      <span class="num">＋</span>
      <span>
        <h2>เครื่องคำนวณพื้นฐาน ElecCalc Pro</h2>
        <p>ของเดิมในโปรเจกต์นี้: กฎของโอห์ม, กำลังไฟฟ้า, RLC, แปลงหน่วย — แยกไว้ไม่ให้ทับเครื่องคำนวณมาตรฐานชุดนี้</p>
      </span>
    </a>
    <p style="margin-top:14px"><a href="#notes">เปิดรายการตรวจสอบค่า (ค่าโดยประมาณที่ต้องเทียบมาตรฐาน)</a></p>
    ${footer()}
  `);
}

function notesView() {
  const blocks = [
    ["ค่าที่ต้องตรวจสอบ", engine.data.approx_items],
    ["หมายเหตุจากตารางมาตรฐาน", engine.data.notes],
    ["การจัดฉนวนและข้อจำกัดของชุดข้อมูล", EXTRA_NOTES],
  ].map(([title, items]) => `
    <section class="note">
      <h3>${esc(title)}</h3>
      <ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
    </section>`).join("");
  return shell(`
    <a class="back" href="#home">← สารบัญ</a>
    <h2 style="margin-top:0">ตรวจสอบค่า</h2>
    <p>รายการนี้ตรงกับส่วน «ตรวจสอบค่า» ในชีต Tables ของสมุดงานต้นทาง ค่าเหล่านี้ถูกนำไปใช้ในเครื่องคิดเลขพร้อมโน้ตสีส้มในหน้าคำนวณที่เกี่ยวข้อง</p>
    ${blocks}
    ${footer()}
  `, "ตรวจสอบค่า");
}

function field(name, label, control, hint = "") {
  return `<label class="field">
    <span class="field-label" id="${esc(name)}-label">${label}</span>
    ${control}
    ${hint ? `<span class="hint" id="${esc(name)}-hint">${hint}</span>` : ""}
  </label>`;
}

function numInput(name, value, step = "any") {
  const shown = value == null ? "" : String(value);
  return `<input id="${esc(name)}" name="${esc(name)}" aria-labelledby="${esc(name)}-label" type="number" inputmode="decimal" step="${esc(step)}" value="${esc(shown)}">`;
}

function selectInput(name, value, options) {
  const current = value == null ? "" : String(value);
  const html = options.map((option) => {
    const selected = String(option.value) === current ? " selected" : "";
    return `<option value="${esc(option.value)}"${selected}>${esc(option.label)}</option>`;
  }).join("");
  return `<select id="${esc(name)}" name="${esc(name)}" aria-labelledby="${esc(name)}-label">${html}</select>`;
}

function cableOptions() {
  return engine.types.map((type) => ({ value: type.name, label: type.name }));
}

function coreOptions() {
  return CORE_OPTIONS.map((core) => ({ value: core.name, label: core.name }));
}

function groupOptions() {
  return engine.groups.map((group) => ({
    value: group.id,
    label: group.id.startsWith("G7") ? group.id.replaceAll("_", " ") : `${group.id} · ${group.code}`,
  }));
}

function sizeOptions(blank = false) {
  const options = engine.sizes.map((size) => ({ value: size, label: `${fmtSize(size)} mm²` }));
  return blank ? [{ value: "", label: "— ไม่จำกัด —" }, ...options] : options;
}

function breakerOptions() {
  return [{ value: "", label: "— อัตโนมัติ —" }, ...engine.breakers.map((amp) => ({ value: amp, label: `${amp} A` }))];
}

function phaseOptions() {
  return [{ value: 1, label: "1 เฟส" }, { value: 3, label: "3 เฟส" }];
}

function unitOptions() {
  return [
    { value: "kW", label: "kW" },
    { value: "kVA", label: "kVA" },
    { value: "A", label: "A" },
  ];
}

function sizingFields(input, options = {}) {
  const loadLabel = options.loadLabel || "ค่าโหลด (Load value)";
  const parts = [
    field("cableType", "ชนิดสาย (Cable type)", selectInput("cableType", input.cableType, cableOptions()), `<span id="type-hint"></span>`),
    field("cores", "รูปแบบแกน (Core arrangement)", selectInput("cores", input.cores, coreOptions())),
    field("group", "กลุ่มติดตั้ง (Installation group)", selectInput("group", input.group, groupOptions()), `<span id="group-hint"></span>`),
  ];
  if (options.motor) {
    const cfg = engine.motorCfg;
    parts.unshift(field("motorType", "ชนิดมอเตอร์ (M1 = 1φ, M2 = DOL 3φ, M3 = Star-Delta 3φ)", selectInput("motorType", input.motorType, [
      { value: "M1", label: `M1 — 1 เฟส ${cfg.M1.voltage} V, ตัวคูณ ${cfg.M1.sizingMultiplier}` },
      { value: "M2", label: `M2 — DOL 3 เฟส ${cfg.M2.voltage} V, ตัวคูณ ${cfg.M2.sizingMultiplier}` },
      { value: "M3", label: `M3 — Star-Delta 3 เฟส ${cfg.M3.voltage} V, ตัวคูณ ${cfg.M3.sizingMultiplier}` },
    ])));
    parts.push(field("load", "กำลังมอเตอร์ (kW)", selectInput("load", input.load, engine.motorKw(input.motorType).map((kw) => ({ value: kw, label: `${kw} kW` })))));
    parts.push(`<input type="hidden" name="unit" value="kW">`);
  } else if (options.transformer) {
    parts.push(field("load", "ขนาดหม้อแปลง (kVA)", numInput("load", input.load, "1")));
    parts.push(`<input type="hidden" name="unit" value="kVA">`);
    parts.push(`<p class="hint">กระแส Ib = kVA × 1000 / (√3 × V) ตามชีตสายเมนหม้อแปลง เพาเวอร์แฟกเตอร์ใช้เฉพาะแรงดันตกจาก R และ X</p>`);
  } else {
    parts.push(field("unit", "หน่วยโหลด (Load unit)", selectInput("unit", input.unit, unitOptions())));
    parts.push(field("load", loadLabel, numInput("load", input.load, "0.01")));
  }
  parts.push(
    field("volt", "แรงดันระบบ (System voltage, V)", numInput("volt", input.volt, "1")),
    field("pf", "เพาเวอร์แฟกเตอร์ (Power factor)", numInput("pf", input.pf, "0.01")),
    field("length", "ความยาวสาย (Length, m)", numInput("length", input.length, "0.1")),
    field("temp", "อุณหภูมิโดยรอบ (Ambient temp, °C)", numInput("temp", input.temp, "0.1")),
    field("ncirc", "จำนวนวงจรในกลุ่ม (Grouped circuits)", numInput("ncirc", input.ncirc, "1")),
    field("sets", "จำนวนชุดขนาน (Parallel sets)", numInput("sets", input.sets, "1")),
    field("vdLimit", "แรงดันตกที่ยอมให้ (VD limit, %)", numInput("vdLimit", input.vdLimit, "0.1")),
    field("breaker", "เบรกเกอร์กำหนดเอง (Forced breaker, A) — ว่าง = อัตโนมัติ", selectInput("breaker", input.breaker, breakerOptions())),
    field("isc", "กระแสลัดวงจร (kA) — ว่าง = ไม่ตรวจ", numInput("isc", input.isc, "0.01")),
    field("tsec", "เวลาตัดวงจร (Clearing time, s)", numInput("tsec", input.tsec, "0.01")),
    field("maxSize", "ขนาดสายสูงสุด (mm²) — ว่าง = ไม่จำกัด", selectInput("maxSize", input.maxSize, sizeOptions(true))),
    field("phase", "จำนวนเฟส (Phase)", selectInput("phase", input.phase, phaseOptions())),
  );
  if (options.duct) {
    parts.push(field("ductCircuits", "วงจรใน duct bank ตาราง 5-38 (ว่าง = ใช้กลุ่มติดตั้งด้านบน)", numInput("ductCircuits", input.ductCircuits, "1")));
  }
  return parts.join("");
}

function lineFields(lines) {
  return lines.map((line, index) => `
    <div class="row-card">
      <h3>รายการ ${index + 1}</h3>
      ${field(`l${index}label`, "ชื่อสาย (Dimension label)", selectInput(`l${index}label`, line.label, [{ value: "", label: "— ว่าง —" }, ...engine.dimLabels.map((label) => ({ value: label, label }))]))}
      ${field(`l${index}size`, "ขนาด (mm²)", selectInput(`l${index}size`, line.size, [{ value: "", label: "—" }, ...engine.sizes.map((size) => ({ value: size, label: fmtSize(size) }))]))}
      ${field(`l${index}qty`, "จำนวนเส้น", numInput(`l${index}qty`, line.qty, "1"))}
    </div>`).join("");
}

function sectionFields(sections) {
  return sections.map((section, index) => `
    <div class="row-card">
      <h3>ช่วง ${index + 1}</h3>
      ${field(`s${index}phase`, "เฟส", selectInput(`s${index}phase`, section.phase, phaseOptions()))}
      ${field(`s${index}current`, "กระแส (A)", numInput(`s${index}current`, section.current, "0.1"))}
      ${field(`s${index}length`, "ความยาว (m)", numInput(`s${index}length`, section.length, "0.1"))}
      ${field(`s${index}cableType`, "ชนิดสาย", selectInput(`s${index}cableType`, section.cableType, [{ value: "", label: "— ไม่ใช้ช่วงนี้ —" }, ...cableOptions()]))}
      ${field(`s${index}size`, "ขนาด (mm²)", selectInput(`s${index}size`, section.size, [{ value: "", label: "—" }, ...engine.sizes.map((size) => ({ value: size, label: fmtSize(size) }))]))}
      ${field(`s${index}cores`, "แกน", selectInput(`s${index}cores`, section.cores, coreOptions()))}
      ${field(`s${index}group`, "กลุ่ม", selectInput(`s${index}group`, section.group, groupOptions()))}
      ${field(`s${index}pf`, "PF", numInput(`s${index}pf`, section.pf, "0.01"))}
    </div>`).join("");
}

function formFor(id, input) {
  if (id === 1) {
    return [
      field("cableType", "ชนิดสาย (Cable type)", selectInput("cableType", input.cableType, cableOptions()), `<span id="type-hint"></span>`),
      field("cores", "รูปแบบแกน (Core arrangement)", selectInput("cores", input.cores, coreOptions())),
      field("group", "กลุ่มติดตั้ง (Installation group)", selectInput("group", input.group, groupOptions()), `<span id="group-hint"></span>`),
      field("size", "ขนาดสาย (Cable size, mm²)", selectInput("size", input.size, sizeOptions())),
      field("sets", "จำนวนชุดขนาน (Parallel sets)", numInput("sets", input.sets, "1")),
      field("temp", "อุณหภูมิโดยรอบ (Ambient temp, °C)", numInput("temp", input.temp, "0.1")),
      field("ncirc", "จำนวนวงจรในกลุ่ม (Grouped circuits)", numInput("ncirc", input.ncirc, "1")),
      field("phase", "จำนวนเฟส (Phase)", selectInput("phase", input.phase, phaseOptions())),
    ].join("");
  }
  if ([2, 3, 6, 10].includes(id)) return sizingFields(input, { duct: id === 6 });
  if (id === 4) return sizingFields(input, { motor: true });
  if (id === 5) return sizingFields(input, { transformer: true });
  if (id === 7) {
    return [
      field("volt", "แรงดันระบบต้นทาง (V)", numInput("volt", input.volt, "1")),
      field("limit", "เกณฑ์แรงดันตกรวมสูงสุด (%)", numInput("limit", input.limit, "0.1")),
      sectionFields(input.sections),
    ].join("");
  }
  if (id === 8) {
    return [
      field("conduitMm", "เลือกท่อ (mm) — ว่าง = ให้โปรแกรมเลือกขนาดเล็กสุดที่ผ่าน", selectInput("conduitMm", input.conduitMm, [{ value: "", label: "— เลือกให้อัตโนมัติ —" }, ...engine.conduit.map((item) => ({ value: item.conduitMm, label: `${item.conduitMm} mm (${item.conduitInch}")` }))])),
      lineFields(input.lines),
    ].join("");
  }
  if (id === 9) {
    return [
      field("label", "เลือกราง (ป้ายขนาด)", selectInput("label", input.label, engine.wireway.map((item) => ({ value: item.label, label: `${item.label} mm` })))),
      lineFields(input.lines),
    ].join("");
  }
  if (id === 11) {
    return [
      field("phaseSize", "ขนาดสายเฟส (mm²)", selectInput("phaseSize", input.phaseSize, sizeOptions())),
      field("material", "วัสดุตัวนำ (Material)", selectInput("material", input.material, [{ value: "copper", label: "copper ทองแดง" }, { value: "aluminium", label: "aluminium อะลูมิเนียม" }])),
      field("cableType", "ชนิดสายดิน", selectInput("cableType", input.cableType, cableOptions())),
      field("group", "กลุ่มติดตั้ง", selectInput("group", input.group, groupOptions()), `<span id="group-hint"></span>`),
      `<p class="hint">ขนาด PE ในสูตรหลักใช้ตาราง 4-1 / IEC 54.2 ตามขนาดเฟส วัสดุถูกเก็บไว้ให้ตรงกับชีตต้นทาง</p>`,
    ].join("");
  }
  if (id === 12) {
    return [
      field("mode", "โหมด (A = หม้อแปลง, B = กระแสออกแบบ)", selectInput("mode", input.mode, [{ value: "A", label: "A — จากขนาดหม้อแปลง ตาราง ส-1" }, { value: "B", label: "B — จากกระแสออกแบบ" }])),
      field("kva", "ขนาดหม้อแปลง (kVA) — ใช้เมื่อโหมด A", selectInput("kva", input.kva, engine.kvaList.map((kva) => ({ value: kva, label: `${kva} kVA` })))),
      field("designA", "กระแสออกแบบ (A) — ใช้เมื่อโหมด B", numInput("designA", input.designA, "1")),
    ].join("");
  }
  if (id === 13) {
    return [
      field("kva", "ขนาดหม้อแปลง (kVA)", selectInput("kva", input.kva, engine.kvaList.map((kva) => ({ value: kva, label: `${kva} kVA` })))),
      field("margin", "เปอร์เซ็นต์เผื่อ Icu (ค่าแนะนำ 25%)", numInput("margin", input.margin, "1")),
      field("installedIcu", "Icu ของเบรกเกอร์ที่ติดตั้ง (kA) — ว่าง = ให้แนะนำค่า", selectInput("installedIcu", input.installedIcu, [{ value: "", label: "— ยังไม่ระบุ —" }, ...engine.icuList.map((ka) => ({ value: ka, label: `${ka} kA` }))])),
    ].join("");
  }
  if (id === 14) {
    return [
      field("kva", "ขนาดหม้อแปลงด้านต้นทาง (kVA)", selectInput("kva", input.kva, engine.kvaList.map((kva) => ({ value: kva, label: `${kva} kVA` })))),
      field("size", "ขนาดสายจาก MDB ถึง DB", selectInput("size", input.size, engine.scSizes.map((size) => ({ value: size, label: `${size} mm²` })))),
      field("length", "ความยาวสาย (m)", numInput("length", input.length, "1")),
      `<div class="chips" id="dist-chips">${[0, 10, 25, 50, 75, 100].map((m) => `<button type="button" data-set="${m}">${m} m</button>`).join("")}</div>`,
      `<p class="hint">ตาราง ส-2 มีเฉพาะ 0, 10, 25, 50, 75 และ 100 m ระยะที่อยู่ระหว่างช่วงจะใช้ค่าระยะที่สั้นกว่า (Ik สูงกว่า)</p>`,
      field("margin", "เปอร์เซ็นต์เผื่อ Icu", numInput("margin", input.margin, "1")),
    ].join("");
  }
  if (id === 15) {
    return [
      field("p", "กำลังจริง P (kW)", numInput("p", input.p, "0.1")),
      field("pf1", "PF ปัจจุบัน (cos φ1)", numInput("pf1", input.pf1, "0.01")),
      field("pf2", "PF เป้าหมาย (cos φ2)", numInput("pf2", input.pf2, "0.01")),
      field("volt", "แรงดันระบบ (V)", numInput("volt", input.volt, "1")),
      field("phase", "ระบบ", selectInput("phase", input.phase, phaseOptions())),
      field("freq", "ความถี่ (Hz)", numInput("freq", input.freq, "1")),
    ].join("");
  }
  if (id === 16) {
    return [
      field("roof", "พื้นที่หลังคา (m²)", numInput("roof", input.roof, "0.1")),
      field("kwhDay", "พลังงานใช้กลางวัน (kWh/วัน)", numInput("kwhDay", input.kwhDay, "0.1")),
      field("inverterKw", "กำลังอินเวอร์เตอร์ฝั่ง AC (kW)", numInput("inverterKw", input.inverterKw, "0.1")),
      field("volt", "แรงดัน AC (V)", numInput("volt", input.volt, "1")),
      field("phase", "ระบบ AC", selectInput("phase", input.phase, phaseOptions())),
      field("length", "ความยาวสาย AC (m)", numInput("length", input.length, "0.1")),
      field("tempDc", "อุณหภูมิสาย DC (°C)", numInput("tempDc", input.tempDc, "1")),
      field("ncirc", "จำนวนวงจร DC ในกลุ่ม", numInput("ncirc", input.ncirc, "1")),
      field("vdc", "แรงดันสตริง DC (V)", numInput("vdc", input.vdc, "1")),
      field("psh", "ชั่วโมงแดดเทียบเท่า PSH (ชั่วโมง/วัน)", numInput("psh", input.psh, "0.1")),
      field("m2PerKwp", "พื้นที่ต่อ 1 kWp (m²/kWp)", numInput("m2PerKwp", input.m2PerKwp, "0.1")),
      field("cableType", "ชนิดสาย AC", selectInput("cableType", input.cableType, cableOptions())),
      field("group", "กลุ่มติดตั้งสาย AC", selectInput("group", input.group, groupOptions())),
    ].join("");
  }
  if (id === 17) {
    return [
      field("whDay", "พลังงานโหลดต่อวัน (Wh/วัน)", numInput("whDay", input.whDay, "1")),
      field("days", "จำนวนวันสำรอง (วัน)", numInput("days", input.days, "1")),
      field("volt", "แรงดันระบบแบตเตอรี่ (V)", numInput("volt", input.volt, "1")),
      field("dod", "ความลึกการคายประจุ DOD (0–1)", numInput("dod", input.dod, "0.01")),
      field("battEff", "ประสิทธิภาพแบตเตอรี่", numInput("battEff", input.battEff, "0.01")),
      field("psh", "ชั่วโมงแดดเทียบเท่า PSH", numInput("psh", input.psh, "0.1")),
      field("chargeEff", "ประสิทธิภาพระบบฝั่งชาร์จ", numInput("chargeEff", input.chargeEff, "0.01")),
      field("acVolt", "แรงดันอินเวอร์เตอร์ AC (V)", numInput("acVolt", input.acVolt, "1")),
      field("peakW", "กำลังโหลดสูงสุด (W)", numInput("peakW", input.peakW, "1")),
    ].join("");
  }
  return [
    field("size", "ขนาดตัวนำหลัก (mm²)", selectInput("size", input.size, sizeOptions())),
    field("conductors", "จำนวนตัวนำ (ไม่รวมสายดิน)", numInput("conductors", input.conductors, "1")),
    field("earth", "รวมสายดิน?", selectInput("earth", input.earth, [{ value: 1, label: "ใช่ (นับ 1)" }, { value: 0, label: "ไม่นับ" }])),
    field("devices", "จำนวนอุปกรณ์ในกล่อง (นับเป็น 2 ตัวนำต่อชุด)", numInput("devices", input.devices, "1")),
    field("category", "ประเภทกล่อง (ว่าง = ทุกประเภท ตามสูตรสมุดงาน)", selectInput("category", input.category, [
      { value: "", label: "ทุกประเภท" },
      { value: "round_or_octagon", label: "กล่องกลม/แปดเหลี่ยม" },
      { value: "square", label: "กล่องสี่เหลี่ยม" },
      { value: "device", label: "กล่องอุปกรณ์" },
      { value: "flush_device", label: "กล่องฝัง" },
      { value: "fs_single", label: "FS single" },
      { value: "fd_single", label: "FD single" },
      { value: "fs_multiple", label: "FS multiple" },
      { value: "fd_multiple", label: "FD multiple" },
    ])),
  ].join("");
}

function control(form, name) {
  return form.querySelector(`[name="${name}"]`);
}

function readNumber(form, name) {
  const el = control(form, name);
  if (!el) return null;
  const text = String(el.value).trim();
  if (text === "") return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function readInput(id, form) {
  const base = defaultInput(id);
  const take = (name, numeric = false) => {
    const el = control(form, name);
    if (!el) return base[name];
    return numeric ? readNumber(form, name) : el.value;
  };
  if (id === 1) {
    return {
      cableType: take("cableType"),
      cores: take("cores"),
      group: take("group"),
      size: take("size", true),
      sets: take("sets", true),
      temp: take("temp", true),
      ncirc: take("ncirc", true),
      phase: take("phase", true),
    };
  }
  if ([2, 3, 4, 5, 6, 10].includes(id)) {
    const input = {
      ...base,
      cableType: take("cableType"),
      cores: take("cores"),
      group: take("group"),
      unit: take("unit"),
      load: take("load", true),
      volt: take("volt", true),
      pf: take("pf", true),
      length: take("length", true),
      temp: take("temp", true),
      ncirc: take("ncirc", true),
      sets: take("sets", true),
      vdLimit: take("vdLimit", true),
      breaker: take("breaker", true),
      isc: take("isc", true),
      tsec: take("tsec", true),
      maxSize: take("maxSize", true),
      phase: take("phase", true),
    };
    if (id === 4) input.motorType = take("motorType");
    if (id === 6) input.ductCircuits = take("ductCircuits", true);
    return input;
  }
  if (id === 7) {
    return {
      volt: take("volt", true),
      limit: take("limit", true),
      sections: base.sections.map((_, index) => ({
        phase: take(`s${index}phase`, true),
        current: take(`s${index}current`, true),
        length: take(`s${index}length`, true),
        cableType: take(`s${index}cableType`),
        size: take(`s${index}size`, true),
        cores: take(`s${index}cores`),
        group: take(`s${index}group`),
        pf: take(`s${index}pf`, true),
      })),
    };
  }
  if (id === 8 || id === 9) {
    const input = {
      lines: base.lines.map((_, index) => ({
        label: take(`l${index}label`),
        size: take(`l${index}size`, true),
        qty: take(`l${index}qty`, true),
      })),
    };
    if (id === 8) input.conduitMm = take("conduitMm", true);
    if (id === 9) input.label = take("label");
    return input;
  }
  if (id === 11) {
    return {
      phaseSize: take("phaseSize", true),
      material: take("material"),
      cableType: take("cableType"),
      group: take("group"),
    };
  }
  if (id === 12) return { mode: take("mode"), kva: take("kva", true), designA: take("designA", true) };
  if (id === 13) return { kva: take("kva", true), margin: take("margin", true), installedIcu: take("installedIcu", true) };
  if (id === 14) return { kva: take("kva", true), size: take("size"), length: take("length", true), margin: take("margin", true) };
  if (id === 15) {
    return {
      p: take("p", true),
      pf1: take("pf1", true),
      pf2: take("pf2", true),
      volt: take("volt", true),
      phase: take("phase", true),
      freq: take("freq", true),
    };
  }
  if (id === 16) {
    return {
      roof: take("roof", true),
      kwhDay: take("kwhDay", true),
      inverterKw: take("inverterKw", true),
      volt: take("volt", true),
      phase: take("phase", true),
      length: take("length", true),
      tempDc: take("tempDc", true),
      ncirc: take("ncirc", true),
      vdc: take("vdc", true),
      psh: take("psh", true),
      m2PerKwp: take("m2PerKwp", true),
      cableType: take("cableType"),
      group: take("group"),
    };
  }
  if (id === 17) {
    return {
      whDay: take("whDay", true),
      days: take("days", true),
      volt: take("volt", true),
      dod: take("dod", true),
      battEff: take("battEff", true),
      psh: take("psh", true),
      chargeEff: take("chargeEff", true),
      acVolt: take("acVolt", true),
      peakW: take("peakW", true),
    };
  }
  return {
    size: take("size", true),
    conductors: take("conductors", true),
    earth: take("earth", true),
    devices: take("devices", true),
    category: take("category"),
  };
}

function metric(label, value, unit = "") {
  return `<div class="metric"><div class="metric-k">${esc(label)}</div><div class="metric-v">${esc(value)}</div>${unit ? `<div class="metric-u">${esc(unit)}</div>` : ""}</div>`;
}

function badge(pass) {
  const ok = pass === "PASS";
  return `<div class="badge ${ok ? "pass" : "fail"}" role="status">${ok ? "ผ่าน PASS" : "ไม่ผ่าน FAIL"}</div>`;
}

function alerts(list) {
  if (!list || !list.length) return "";
  return `<div class="warn"><h3>ตรวจสอบค่าที่ใช้ในผลนี้</h3><ul>${list.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>`;
}

function mark(flag) {
  if (flag === true || flag === "PASS") return `<span class="ok">ผ่าน</span>`;
  if (flag === false || flag === "FAIL") return `<span class="bad">ไม่ผ่าน</span>`;
  return "—";
}

function vdCell(value) {
  if (value === "N/A") return "N/A";
  if (typeof value !== "number") return "—";
  return fmtNum(value);
}

function sizeTable(rows, chosen) {
  if (!rows || !rows.length) return "";
  const body = rows.map((row) => `
    <tr class="${chosen != null && row.size === chosen ? "chosen" : ""}">
      <td>${fmtSize(row.size)}</td>
      <td>${fmtNum(row.iz)}</td>
      <td>${fmtNum(row.izAdj)}</td>
      <td>${mark(row.ampPass)}</td>
      <td>${vdCell(row.vdTable)}</td>
      <td>${vdCell(row.vdRx)}</td>
      <td>${mark(row.vdPass)}</td>
      <td>${row.smin == null ? "—" : fmtNum(row.smin)}</td>
      <td>${mark(row.shockPass)}</td>
      <td>${row.iz == null ? "—" : mark(row.pass)}</td>
    </tr>`).join("");
  return `<details class="table-wrap" id="size-table" open>
    <summary style="padding:10px 12px;font-weight:700">ตารางตรวจทุกขนาดสาย</summary>
    <table>
      <thead><tr><th>mm²</th><th>Iz</th><th>Iz ปรับแล้ว</th><th>พิกัด</th><th>VD ฐ %</th><th>VD R/X %</th><th>VD</th><th>Smin</th><th>ช็อต</th><th>ผล</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
  </details>`;
}

function traceFor(id, input, result) {
  if (result.ib == null || !Number.isFinite(result.ib)) return "";
  if (id === 4 && result.motor && result.motor.flc != null) {
    return `Ib = FLC × ตัวคูณ = ${result.motor.flc} A × ${result.motor.multiplier} = ${fmtNum(result.ib)} A`;
  }
  if (id === 5) return `Ib = S / (√3 × V) = ${input.load} × 1000 / (√3 × ${input.volt}) = ${fmtNum(result.ib)} A`;
  if (input.unit === "A") return `Ib = ${fmtNum(result.ib)} A จากค่ากระแสที่กรอก`;
  if (input.unit === "kVA") {
    const denom = Number(input.phase) === 1 ? "V" : "√3 × V";
    return `Ib = S / (${denom}) = ${fmtNum(result.ib)} A`;
  }
  const denom = Number(input.phase) === 1 ? "V × PF" : "√3 × V × PF";
  return `Ib = P / (${denom}) = ${input.load} kW → ${fmtNum(result.ib)} A`;
}

function hero(pass, label, value, unit) {
  return `<div class="hero-result"><div><div class="metric-k">${esc(label)}</div><div class="big">${esc(value)}${unit ? ` <span style="font-size:1rem;font-weight:600">${esc(unit)}</span>` : ""}</div></div>${badge(pass)}</div>`;
}

function renderResult(id, input, result) {
  const bits = [];
  if ([2, 3, 4, 5, 6, 10].includes(id)) {
    bits.push(hero(result.pass, "ขนาดสายที่แนะนำ", result.size == null ? "N/A" : fmtSize(result.size), result.size == null ? "" : "mm²"));
    const trace = traceFor(id, input, result);
    if (trace) bits.push(`<p class="formula">${esc(trace)}</p>`);
    const items = [
      metric("กระแสโหลด Ib", fmtNum(result.ib), "A"),
      metric("เบรกเกอร์ In", result.in == null ? "N/A" : fmtNum(result.in, 0), "A"),
      metric("Iz ตามตาราง", fmtNum(result.iz), "A"),
      metric("Iz หลัง Ca×Cg×ชุดขนาน", fmtNum(result.izAdj), "A"),
      metric("ตัวคูณอุณหภูมิ Ca", fmtNum(result.ca), ""),
      metric("ตัวคูณกลุ่ม Cg", fmtNum(result.cg), ""),
      metric("แรงดันตกจากตาราง ฐ", vdCell(result.vdTable), "%"),
      metric("แรงดันตกจาก R และ X", vdCell(result.vdRx), "%"),
      metric("สายดิน PE", result.pe == null ? "N/A" : fmtSize(result.pe), "mm²"),
      metric("ค่า k", result.k == null ? "—" : fmtNum(result.k, 0), ""),
      metric("ตารางพิกัดกระแส", result.table || "—", ""),
      metric("Smin ทนช็อต", result.smin == null ? "—" : fmtNum(result.smin), "mm²"),
    ];
    if (id === 4 && result.motor) {
      items.unshift(
        metric("FLC จากตาราง", result.motor.flc == null ? "N/A" : fmtNum(result.motor.flc, 0), "A"),
        metric("ตัวคูณ Ic/In", result.motor.multiplier ?? "—", ""),
      );
    }
    bits.push(`<div class="metrics">${items.join("")}</div>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    if (result.motor && result.motor.cfg) {
      bits.push(`<p class="hint">ตาราง ${esc(input.motorType)} อ้างอิง ${result.motor.cfg.phase} เฟส ${result.motor.cfg.voltage} V — ปรับช่องเฟสและแรงดันให้ตรงกับตารางถ้าเปลี่ยนชนิดมอเตอร์</p>`);
    }
    if (result.duct) {
      bits.push(`<p class="formula">ตาราง 5-38 ที่ขนาด ${fmtSize(result.duct.size)} mm² จำนวน ${result.duct.circuits} วงจร: Iz = ${result.duct.iz == null ? "N/A" : fmtNum(result.duct.iz, 0)} A (ค่าอ้างอิง duct bank ไม่ได้แทนที่การเลือกขนาดจากกลุ่มติดตั้ง)</p>`);
    }
    if (id === 6) bits.push(`<p class="hint"><a href="#3">เปิดเครื่องคำนวณขนาดสาย 3 เฟส</a> เมื่อต้องการเทียบเงื่อนไขแรงต่ำ</p>`);
    bits.push(alerts(result.alerts));
    bits.push(sizeTable(result.rows, result.size));
    return bits.join("");
  }
  if (id === 1) {
    bits.push(hero(result.pass, "กระแสสูงสุด In max", fmtNum(result.inMax), "A"));
    bits.push(`<div class="metrics">
      ${metric("Iz ตามตาราง", fmtNum(result.iz), "A")}
      ${metric("ตารางที่ใช้", result.table || "—", "")}
      ${metric("Ca", fmtNum(result.ca), "")}
      ${metric("Cg", fmtNum(result.cg), "")}
      ${metric("เบรกเกอร์สูงสุดที่ใช้ได้", result.breaker == null ? "N/A" : fmtNum(result.breaker, 0), "A")}
    </div>`);
    bits.push(`<p class="formula">In max = Iz × Ca × Cg × จำนวนชุดขนาน</p>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    bits.push(alerts(result.alerts));
    return bits.join("");
  }
  if (id === 7) {
    bits.push(hero(result.pass, "VD รวมจากตาราง ฐ", fmtNum(result.vdTableSum), "%"));
    bits.push(`<div class="metrics">
      ${metric("VD รวมจาก R และ X", fmtNum(result.vdRxSum), "%")}
      ${metric("ช่วงที่ %VD สูงสุด", result.worst == null ? "—" : String(result.worst), "")}
      ${metric("เกณฑ์", fmtNum(result.limit, 1), "%")}
    </div>`);
    const max = Math.max(result.limit || 0, ...result.sections.map((section) => (typeof section.vdTable === "number" ? section.vdTable : 0)));
    bits.push(`<div class="bars">${result.sections.map((section) => {
      const value = typeof section.vdTable === "number" ? section.vdTable : 0;
      const width = max ? Math.min(100, (value / max) * 100) : 0;
      return `<div class="bar-row"><span>ช่วง ${section.index}</span><div class="bar"><span style="width:${width}%"></span></div><strong>${vdCell(section.vdTable)}%</strong></div>`;
    }).join("")}</div>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    bits.push(alerts(result.alerts));
    return bits.join("");
  }
  if (id === 8) {
    bits.push(hero(result.pass, "ท่อที่เลือก", result.conduitMm == null ? "N/A" : String(result.conduitMm), result.conduitInch ? `mm (${result.conduitInch}")` : "mm"));
    bits.push(`<div class="metrics">
      ${metric("จำนวนเส้นรวม", fmtNum(result.conductors, 0), "เส้น")}
      ${metric("พื้นที่บรรจุรวม", fmtNum(result.area), "mm²")}
      ${metric("เกณฑ์บรรจุ", result.percent == null ? "—" : String(result.percent), "%")}
      ${metric("%fill จริง", fmtNum(result.fill), "%")}
      ${metric("พื้นที่ท่อ 100%", fmtNum(result.area100), "mm²")}
      ${metric("พื้นที่ใช้ได้ตามเกณฑ์", fmtNum(result.usable), "mm²")}
    </div>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    bits.push(alerts(result.alerts));
    return bits.join("");
  }
  if (id === 9) {
    bits.push(hero(result.pass, "ร้อยละการบรรจุ", fmtNum(result.fill), "%"));
    bits.push(`<div class="metrics">
      ${metric("พื้นที่บรรจุรวม", fmtNum(result.area), "mm²")}
      ${metric("พื้นที่หน้าตัดราง", fmtNum(result.trayArea), "mm²")}
      ${metric("เกณฑ์ 20%", fmtNum(result.limit), "mm²")}
    </div>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    bits.push(alerts(result.alerts));
    return bits.join("");
  }
  if (id === 11) {
    bits.push(hero(result.pass, "ขนาด PE", result.pe == null ? "N/A" : fmtSize(result.pe), "mm²"));
    bits.push(`<p class="formula">${esc(result.rule || "")}</p>`);
    bits.push(`<p>คำเตือนกลุ่มที่ 6: ${esc(result.warning || "—")}</p>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    bits.push(alerts(result.alerts));
    return bits.join("");
  }
  if (id === 12) {
    bits.push(hero(result.pass, "AT ที่แนะนำ", result.at == null ? "N/A" : fmtNum(result.at, 0), "A"));
    bits.push(`<div class="metrics">
      ${metric("กระแส In", fmtNum(result.in), "A")}
      ${metric("AF ที่แนะนำ", result.af == null ? "N/A" : String(result.af), "A")}
    </div>`);
    if (result.note) bits.push(`<p class="formula">${esc(result.note)} — <a href="#5">เปิดสายเมนหม้อแปลง</a></p>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    return bits.join("");
  }
  if (id === 13) {
    bits.push(hero(result.pass, "Icu ที่ต้องใช้", result.icu == null ? "N/A" : fmtNum(result.icu, 0), "kA"));
    bits.push(`<div class="metrics">
      ${metric("Ik ที่ MDB", fmtNum(result.ik), "kA")}
      ${metric("ค่าหลังเผื่อ", fmtNum(result.after), "kA")}
      ${metric("Icu +25% จากตาราง ส-1", fmtNum(result.icu25, 0), "kA")}
      ${metric("%Z จากตาราง", result.z == null ? "—" : String(result.z), "%")}
    </div>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    return bits.join("");
  }
  if (id === 14) {
    bits.push(hero(result.pass, "Icu ที่ต้องใช้", result.icu == null ? "N/A" : fmtNum(result.icu, 0), "kA"));
    bits.push(`<div class="metrics">
      ${metric("Ik ที่ระยะตาราง", fmtNum(result.ik), "kA")}
      ${metric("ระยะในตารางที่ใช้", result.distance == null ? "—" : String(result.distance), "m")}
      ${metric("ค่าหลังเผื่อ", fmtNum(result.after), "kA")}
    </div>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    bits.push(alerts(result.alerts));
    return bits.join("");
  }
  if (id === 15) {
    bits.push(hero(result.pass, "คาปาซิเตอร์ Qc", fmtNum(result.qc), "kVAR"));
    bits.push(`<p class="formula">Qc = P × (tan φ1 − tan φ2)</p>`);
    bits.push(`<div class="metrics">
      ${metric("มุม φ1", fmtNum(result.phi1), "°")}
      ${metric("มุม φ2", fmtNum(result.phi2), "°")}
      ${metric("S ก่อนปรับ", fmtNum(result.s1), "kVA")}
      ${metric("Q ก่อนปรับ", fmtNum(result.q1), "kVAR")}
      ${metric("S หลังปรับ", fmtNum(result.s2), "kVA")}
      ${metric("Q หลังปรับ", fmtNum(result.q2), "kVAR")}
      ${metric("กระแสก่อนปรับ", fmtNum(result.i1), "A")}
      ${metric("กระแสหลังปรับ", fmtNum(result.i2), "A")}
      ${metric("กระแสที่ลดลง", fmtNum(result.iDrop), "A")}
    </div>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    bits.push(alerts(result.alerts));
    return bits.join("");
  }
  if (id === 16) {
    bits.push(hero(result.pass, "ขนาดสาย DC", result.dcSize == null ? "N/A" : fmtSize(result.dcSize), "mm²"));
    bits.push(`<div class="metrics">
      ${metric("kWp จากหลังคา", fmtNum(result.kwpRoof), "kWp")}
      ${metric("kWp จากพลังงาน", fmtNum(result.kwpEnergy), "kWp")}
      ${metric("ขนาดระบบที่แนะนำ", fmtNum(result.kwp), "kWp")}
      ${metric("กระแส AC Ib", fmtNum(result.ibAc), "A")}
      ${metric("กระแสออกแบบ DC", fmtNum(result.iDc), "A")}
      ${metric("Ca สาย PV", fmtNum(result.ca), "")}
      ${metric("พิกัดสาย DC หลัง Ca", fmtNum(result.dcIz), "A")}
    </div>`);
    bits.push(`<p class="formula">กระแส AC = ${fmtNum(result.ibAc)} A ที่ ${esc(input.cableType)} / ${esc(input.group)} — <a href="#3">คำนวณขนาดสาย AC ในขนาดสาย 3 เฟส</a></p>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    bits.push(alerts(result.alerts));
    return bits.join("");
  }
  if (id === 17) {
    bits.push(hero(result.pass, "ความจุแบตเตอรี่", fmtNum(result.ah), "Ah"));
    bits.push(`<div class="metrics">
      ${metric("พลังงานที่แบตต้องเก็บ", fmtNum(result.storeWh), "Wh")}
      ${metric("กำลังแผงที่ควรติดตั้ง", fmtNum(result.pvW), "W")}
      ${metric("กระแสชาร์จคอนโทรลเลอร์", fmtNum(result.scc), "A")}
      ${metric("อินเวอร์เตอร์แนะนำ", fmtNum(result.inverter, 0), "W")}
      ${metric("กระแสสาย DC ฝั่งแบต", fmtNum(result.idc), "A")}
    </div>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    if (input.acVolt) bits.push(`<p class="hint">แรงดันอินเวอร์เตอร์ AC ${esc(input.acVolt)} V ถูกบันทึกตามชีตต้นทาง สูตรขนาดอินเวอร์เตอร์ใช้กำลังโหลดสูงสุด × 1.25</p>`);
    bits.push(alerts(result.alerts));
    return bits.join("");
  }
  const box = result.box;
  bits.push(hero(result.pass, "กล่องที่เล็กพอ", box ? box.metricLabel : "N/A", box ? box.id : ""));
  bits.push(`<div class="metrics">
    ${metric("ตัวนำเทียบเท่า", result.equiv == null ? "—" : String(result.equiv), "เส้น")}
    ${metric("คอลัมน์ขนาดสาย", result.allowanceKey ? `${result.allowanceKey} mm²` : "—", "")}
    ${metric("ปริมาตรต่ำสุด", box ? fmtNum(box.minVolumeCm3) : "—", "cm³")}
    ${metric("จำนวนกล่องที่ผ่าน", result.passingCount == null ? "—" : String(result.passingCount), "แบบ")}
  </div>`);
  bits.push(`<p class="formula">ตัวนำเทียบเท่า = จำนวนสาย + สายดิน (0 หรือ 1) + อุปกรณ์ × 2</p>`);
  bits.push(`<p>${esc(result.reason || "")}</p>`);
  return bits.join("");
}

function calcView(id) {
  const calc = calcById(id);
  const input = defaultInput(id);
  return shell(`
    <a class="back" href="#home">← สารบัญ</a>
    <div class="layout">
      <section class="card">
        <h2>${esc(calc.title)} <span class="en">${esc(calc.en)}</span></h2>
        <div class="example">
          <strong>ตัวอย่างที่กรอกไว้</strong>
          <p>${esc(calc.example)}</p>
          <p class="hint">${esc(calc.refs)}</p>
        </div>
        <form id="calc-form" autocomplete="off">
          <div class="fields">${formFor(id, input)}</div>
          <div class="actions">
            <button type="button" id="reset" class="ghost">คืนค่าตัวอย่าง</button>
            <button type="button" id="print" class="ghost">พิมพ์ผล</button>
          </div>
        </form>
      </section>
      <section class="card results" id="calc-out" aria-live="polite"></section>
    </div>
    <section class="banner" style="margin-top:14px">
      <strong>Disclaimer</strong>
      <p>${esc(DISCLAIMER)} ${esc(LICENSE_NOTE)}</p>
    </section>
    ${footer()}
  `, calc.title);
}

function updateHints(form) {
  const typeHint = document.getElementById("type-hint");
  const groupHint = document.getElementById("group-hint");
  if (typeHint && control(form, "cableType")) {
    const type = engine.types.find((item) => item.name === control(form, "cableType").value);
    typeHint.textContent = type
      ? `${type.material === "copper" ? "ทองแดง" : "อะลูมิเนียม"} · ฉนวน ${type.insulation} · ${type.vd_ok ? "คำนวณแรงดันตกได้" : "ไม่คำนวณแรงดันตก"}`
      : "";
  }
  if (groupHint && control(form, "group")) {
    const group = engine.groups.find((item) => item.id === control(form, "group").value);
    groupHint.textContent = group ? `${group.code} · ${group.medium === "ground" ? "ดิน" : "อากาศ"} · ${group.title}` : "";
  }
}

function bindHome() {
  const search = document.getElementById("q");
  if (!search) return;
  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    document.querySelectorAll(".calc-card[data-text]").forEach((card) => {
      card.hidden = Boolean(query) && !card.dataset.text.includes(query);
    });
  });
}

function bindCalc(id) {
  const form = document.getElementById("calc-form");
  const out = document.getElementById("calc-out");
  const paintResult = () => {
    const open = document.getElementById("size-table");
    const wasOpen = open ? open.open : true;
    updateHints(form);
    const input = readInput(id, form);
    const result = engine.run(id, input);
    out.innerHTML = renderResult(id, input, result);
    const table = document.getElementById("size-table");
    if (table) table.open = wasOpen;
  };
  form.addEventListener("input", paintResult);
  form.addEventListener("change", (event) => {
    if (event.target && event.target.name === "motorType" && id === 4) {
      const select = control(form, "load");
      const current = select.value;
      const options = engine.motorKw(control(form, "motorType").value);
      select.innerHTML = options.map((kw) => `<option value="${esc(kw)}">${esc(kw)} kW</option>`).join("");
      if (options.map(String).includes(current)) select.value = current;
    }
    paintResult();
  });
  form.addEventListener("submit", (event) => event.preventDefault());
  document.getElementById("reset").addEventListener("click", () => paint(id));
  document.getElementById("print").addEventListener("click", () => window.print());
  const chips = document.getElementById("dist-chips");
  if (chips) {
    chips.addEventListener("click", (event) => {
      const button = event.target.closest("[data-set]");
      if (!button) return;
      control(form, "length").value = button.dataset.set;
      paintResult();
    });
  }
  paintResult();
}

function paint(next = route()) {
  if (!engine) return;
  if (next === "home") app.innerHTML = homeView();
  else if (next === "notes") app.innerHTML = notesView();
  else app.innerHTML = calcView(next);
  window.scrollTo(0, 0);
  if (next === "home") bindHome();
  else if (typeof next === "number") bindCalc(next);
}

async function boot() {
  try {
    const response = await fetch(new URL("../data/cable_calc_data.json", import.meta.url));
    if (!response.ok) throw new Error(String(response.status));
    engine = createEngine(await response.json());
    paint();
    window.addEventListener("hashchange", () => paint());
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(new URL("../sw.js", import.meta.url)).catch(() => {});
    }
  } catch (error) {
    app.innerHTML = `<p class="error wrap">โหลดตารางมาตรฐานไม่สำเร็จ (${esc(error.message)}) ลองรีเฟรชหน้าอีกครั้ง</p>`;
  }
}

boot();
