import { CALCS, calcById, defaultInput } from "./catalog.js";
import {
  CORE_OPTIONS,
  DISCLAIMER,
  EXTRA_NOTES,
  LICENSE_NOTE,
  MV_CLASSES,
  WIRING_OPTIONS,
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
  if (id >= 1 && id <= 20) return id;
  return "home";
}

const GROUPS = [
  { title: "เลือกขนาดสาย", ids: [2, 3, 4, 5, 6, 10, 19] },
  { title: "พิกัดและแรงดันตก", ids: [1, 7] },
  { title: "ท่อ ราง และกล่อง", ids: [8, 9, 18, 20] },
  { title: "สายดินและตู้ไฟฟ้า", ids: [11, 12, 13, 14] },
  { title: "เพาเวอร์แฟกเตอร์และโซลาร์", ids: [15, 16, 17] },
];

function icon(id) {
  const paths = {
    1: "M5 19V10M10 19V5M15 19v-7M19 19V8",
    2: "M8 7v10M12 4v16M16 9v6",
    3: "M6 7v10M12 4v16M18 7v10",
    4: "M12 4a8 8 0 1 0 8 8h-8V4z",
    5: "M5 8h14v8H5zM8 8V5M16 8V5M8 16v3M16 16v3",
    6: "M4 16c2-6 4-6 6 0s4 6 6 0 4-6 4 0",
    7: "M12 4v10M8 10l4 4 4-4M6 19h12",
    8: "M8 5h8v14H8zM5 8h3M5 12h3M5 16h3",
    9: "M4 8h16v8H4zM8 8v8M16 8v8",
    10: "M5 19V7l7-3 7 3v12M9 19v-6h6v6",
    11: "M12 21V10M12 10c3 0 5-2 5-5H7c0 3 2 5 5 5z",
    12: "M6 4h12v16H6zM9 8h6M9 12h6M9 16h3",
    13: "M13 3L6 13h6l-1 8 7-10h-6l1-8z",
    14: "M13 3L6 13h6l-1 8 7-10h-6l1-8z",
    15: "M5 16c2-2 4-6 7-6s5 4 7 6",
    16: "M12 5v2M12 17v2M5 12H3M21 12h-2M7 7l-1-1M18 18l-1-1M17 7l1-1M6 18l1-1M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    17: "M7 8h10v8H7zM10 8V6h4v2M10 16v2h4v-2",
    18: "M5 7h14v10H5zM9 7V5h6v2",
    19: "M4 16c4-8 12-8 16 0M8 16v3M16 16v3",
    20: "M4 8h16v8H4zM8 8v8M12 8v8",
  };
  return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[id] || paths[1]}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function cardLink(calc, current) {
  const text = `${calc.id} ${calc.title} ${calc.en} ${calc.blurb}`.toLowerCase();
  return `<a class="calc-card" href="#${calc.id}" data-text="${esc(text)}" ${current === calc.id ? 'aria-current="page"' : ""}>
    <span class="icon">${icon(calc.id)}</span>
    <span>
      <h3>${esc(calc.title)}</h3>
      <p>${esc(calc.blurb)}</p>
    </span>
  </a>`;
}

function menuSheet(current) {
  const groups = GROUPS.map((group) => {
    const links = group.ids.map((id) => {
      const calc = calcById(id);
      return `<a class="menu-link" href="#${id}" data-text="${esc(`${calc.title} ${calc.en} ${calc.blurb}`.toLowerCase())}" ${current === id ? 'aria-current="page"' : ""}>${icon(id)}<span>${esc(calc.title)}</span></a>`;
    }).join("");
    return `<p class="menu-group">${esc(group.title)}</p>${links}`;
  }).join("");
  return `<div class="sheet" id="nav-sheet" hidden>
    <button class="sheet-backdrop" type="button" data-close aria-label="ปิดเมนู"></button>
    <div class="sheet-panel" role="dialog" aria-modal="true" aria-label="เลือกเครื่องคำนวณ">
      <div class="sheet-head">
        <strong>เครื่องคำนวณ</strong>
        <button class="icon-btn" type="button" data-close aria-label="ปิด">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
      <input id="menu-q" class="search" type="search" placeholder="ค้นหา เช่น มอเตอร์, ท่อ, โซลาร์" aria-label="ค้นหาในเมนู">
      ${groups}
      <p class="menu-group">อื่น ๆ</p>
      <a class="menu-link" href="#notes">ตรวจสอบค่าโดยประมาณ</a>
      <a class="menu-link" href="eleccalc/">เครื่องคำนวณพื้นฐาน</a>
    </div>
  </div>`;
}

function shell(body, title, current) {
  document.title = title ? `${title} — โปรแกรมคำนวณสายไฟ No.1` : "โปรแกรมคำนวณสายไฟ No.1";
  const back = current
    ? `<a class="icon-btn" href="#home" aria-label="กลับสารบัญ"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`
    : "";
  const sub = title || "by Electrical Engineer No.1";
  return `
  <header class="appbar">
    <div class="appbar-inner">
      ${back}
      <div class="appbar-text">
        <a class="brand-link" href="#home">โปรแกรมคำนวณสายไฟ No.1</a>
        <p class="appbar-sub">${esc(sub)}</p>
      </div>
      <button class="icon-btn" type="button" id="menu-btn" aria-label="เปิดเมนูเครื่องคำนวณ" aria-expanded="false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>
  </header>
  ${menuSheet(current)}
  <main class="wrap" id="main">${body}</main>`;
}

function footer() {
  return `
  <div class="disclaimer">
    <strong>ต้องให้วิศวกรผู้ได้รับใบอนุญาตตรวจสอบก่อนนำไปใช้จริง</strong>
    <p>${esc(LICENSE_NOTE)}</p>
    <p>${esc(DISCLAIMER)}</p>
  </div>
  <footer class="site">
    <p><a href="https://www.facebook.com/ElectricalEngineerNo.1" target="_blank" rel="noopener">Electrical Engineer No.1</a>
      · <a href="#notes">ตรวจสอบค่า</a>
      · <a href="eleccalc/">เครื่องคำนวณพื้นฐาน</a></p>
  </footer>`;
}

function homeView() {
  const groups = GROUPS.map((group) => `
    <section class="group">
      <h2>${esc(group.title)}</h2>
      <div class="grid home">${group.ids.map((id) => cardLink(calcById(id))).join("")}</div>
    </section>`).join("");
  return shell(`
    <section class="lead">
      <h1>คำนวณสายไฟให้อ่านผลได้ทันที</h1>
      <p>เลือกงานจากรายการด้านล่าง แล้วปรับตัวเลขได้เลย ผลหลัก เช่น ขนาดสาย เบรกเกอร์ หรือแรงดันตก จะโชว์ตัวใหญ่ให้เห็นชัด</p>
    </section>
    <input id="q" class="search" type="search" placeholder="ค้นหา เช่น แรงดันตก, มอเตอร์, โซลาร์" aria-label="ค้นหาฟังก์ชัน">
    ${groups}
    <section class="group">
      <h2>อื่น ๆ</h2>
      <div class="grid">
        <a class="calc-card" href="#notes">
          <span class="icon">${icon(1)}</span>
          <span><h3>ตรวจสอบค่าโดยประมาณ</h3><p>รายการที่ต้องเทียบกับมาตรฐานก่อนใช้จริง</p></span>
        </a>
        <a class="calc-card" href="eleccalc/">
          <span class="icon">${icon(15)}</span>
          <span><h3>เครื่องคำนวณพื้นฐาน</h3><p>ElecCalc Pro — กฎของโอห์ม กำลังไฟฟ้า และวงจร RLC</p></span>
        </a>
      </div>
    </section>
    ${footer()}
  `);
}

function notesView() {
  const blocks = [
    ["ค่าที่ต้องตรวจสอบ", engine.data.approx_items],
    ["หมายเหตุจากตารางมาตรฐาน", engine.data.notes],
    ["การจัดฉนวนและข้อจำกัดของชุดข้อมูล", EXTRA_NOTES],
  ].map(([title, items]) => `
    <section class="card" style="margin-bottom:12px">
      <h2>${esc(title)}</h2>
      <ul class="quiet">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
    </section>`).join("");
  return shell(`
    <section class="lead">
      <h1>ตรวจสอบค่า</h1>
      <p>รายการจากชีตตารางมาตรฐาน ค่าโดยประมาณเหล่านี้ถูกซ่อนไว้ในแต่ละเครื่องคิดเลข กดเปิดเมื่อต้องการอ่านรายละเอียด</p>
    </section>
    ${blocks}
    ${footer()}
  `, "ตรวจสอบค่า", "notes");
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
  const parts = [
    field("cableType", "ชนิดสาย", selectInput("cableType", input.cableType, cableOptions()), `<span id="type-hint"></span>`),
    field("cores", "รูปแบบแกน", selectInput("cores", input.cores, coreOptions()), "แกนเดียวหรือหลายแกน ตามวิธีเดินสาย"),
    field("group", "กลุ่มติดตั้ง", selectInput("group", input.group, groupOptions()), `<span id="group-hint"></span>`),
  ];
  if (options.motor) {
    const cfg = engine.motorCfg;
    parts.unshift(field("motorType", "ชนิดมอเตอร์", selectInput("motorType", input.motorType, [
      { value: "M1", label: `M1 — 1 เฟส ${cfg.M1.voltage} V, ตัวคูณ ${cfg.M1.sizingMultiplier}` },
      { value: "M2", label: `M2 — DOL 3 เฟส ${cfg.M2.voltage} V, ตัวคูณ ${cfg.M2.sizingMultiplier}` },
      { value: "M3", label: `M3 — Star-Delta 3 เฟส ${cfg.M3.voltage} V, ตัวคูณ ${cfg.M3.sizingMultiplier}` },
    ]), "กระแสออกแบบใช้ FLC จากตาราง คูณตัวคูณสตาร์ท"));
    parts.push(field("load", "กำลังมอเตอร์", selectInput("load", input.load, engine.motorKw(input.motorType).map((kw) => ({ value: kw, label: `${kw} kW` }))), "หน่วยเป็น kW"));
    parts.push(`<input type="hidden" name="unit" value="kW">`);
  } else if (options.transformer) {
    parts.push(field("load", "ขนาดหม้อแปลง", numInput("load", input.load, "1"), "หน่วยเป็น kVA กระแสคิดจาก √3 และแรงดัน"));
    parts.push(`<input type="hidden" name="unit" value="kVA">`);
  } else {
    parts.push(field("unit", "หน่วยโหลด", selectInput("unit", input.unit, unitOptions()), "kW, kVA หรือกรอกเป็นแอมแปร์ตรง ๆ"));
    parts.push(field("load", "ค่าโหลด", numInput("load", input.load, "0.01"), "ตัวเลขตามหน่วยที่เลือก"));
  }
  parts.push(
    field("volt", "แรงดันระบบ", numInput("volt", input.volt, "1"), "โวลต์ เช่น 230 หรือ 400"),
    field("pf", "เพาเวอร์แฟกเตอร์", numInput("pf", input.pf, "0.01"), "ค่าระหว่าง 0 ถึง 1"),
    field("length", "ความยาวสาย", numInput("length", input.length, "0.1"), "เมตร จากต้นทางถึงโหลด"),
    field("temp", "อุณหภูมิโดยรอบ", numInput("temp", input.temp, "0.1"), "องศาเซลเซียส ใช้หาตัวคูณ Ca"),
    field("ncirc", "จำนวนวงจรในกลุ่ม", numInput("ncirc", input.ncirc, "1"), "วงจรเดียวใช้ 1 มากกว่านั้นจะลด Cg"),
    field("sets", "จำนวนชุดขนาน", numInput("sets", input.sets, "1"), "สายขนานกี่ชุด"),
    field("vdLimit", "แรงดันตกที่ยอมให้", numInput("vdLimit", input.vdLimit, "0.1"), "เปอร์เซ็นต์ เช่น 3"),
    field("phase", "จำนวนเฟส", selectInput("phase", input.phase, phaseOptions())),
  );
  const advanced = [
    field("breaker", "เบรกเกอร์กำหนดเอง", selectInput("breaker", input.breaker, breakerOptions()), "เว้นว่างไว้ให้เลือกขนาดอัตโนมัติ"),
    field("isc", "กระแสลัดวงจร", numInput("isc", input.isc, "0.01"), "กิโลแอมแปร์ เว้นว่างถ้ายังไม่ตรวจ"),
    field("tsec", "เวลาตัดวงจร", numInput("tsec", input.tsec, "0.01"), "วินาที ใช้คู่กับกระแสลัดวงจร"),
    field("maxSize", "ขนาดสายสูงสุด", selectInput("maxSize", input.maxSize, sizeOptions(true)), "เว้นว่างถ้าไม่จำกัด"),
  ].join("");
  if (options.wiring) {
    parts.unshift(
      field("designMode", "วิธีกำหนดขนาด", selectInput("designMode", input.designMode || "load", [
        { value: "load", label: "จากโหลด แล้วเลือกเบรกเกอร์ให้" },
        { value: "breaker", label: "เลือกเบรกเกอร์ In ก่อน" },
      ]), "ถ้าเลือกเบรกเกอร์ก่อนและไม่กรอกโหลด ระบบใช้ In เป็นกระแสออกแบบ"),
      field("wiring", "ชุดสาย", selectInput("wiring", input.wiring || "", [{ value: "", label: "ไม่ระบุ — ใช้จำนวนเฟสด้านล่าง" }, ...WIRING_OPTIONS.map((item) => ({ value: item.id, label: item.label }))]), "ถ้าระบุชุดสาย จำนวนเฟสจะยึดตามชุดนี้"),
      field("neutralRatio", "ขนาดนิวทรัล", selectInput("neutralRatio", input.neutralRatio == null ? 1 : input.neutralRatio, [
        { value: 1, label: "100% ของสายเฟส" },
        { value: 0.5, label: "50% ของสายเฟส แล้วปัดขึ้น" },
      ]), "ใช้เมื่อชุดสายมีนิวทรัล"),
    );
  }
  if (options.mv) {
    parts.push(
      field("mvClass", "ชั้นแรงดัน MV", selectInput("mvClass", input.mvClass || "12/20", MV_CLASSES.map((item) => ({ value: item, label: `${item} kV` }))), "ชุดข้อมูลใช้พิกัด Iz ชุดเดียวกันทุกชั้นแรงดัน"),
      field("buriedSpacing", "ระยะวงจรฝังดิน", selectInput("buriedSpacing", input.buriedSpacing || "", [
        { value: "", label: "ไม่ระบุ" },
        { value: "touching", label: "วางชิดกัน" },
        { value: "one-diameter", label: "ห่างหนึ่งเส้นผ่านศูนย์กลาง" },
      ]), "ไม่มีตาราง 5-45/5-46 จึงไม่เปลี่ยนตัวเลข Cg"),
    );
  }
  parts.push(`<details class="fold"><summary>ตัวเลือกเพิ่มเติม</summary><div class="fold-body fields">${advanced}</div></details>`);
  if (options.duct) {
    parts.push(field("ductCircuits", "จำนวนวงจรใน duct bank", numInput("ductCircuits", input.ductCircuits, "1"), "เว้นว่างเพื่อใช้กลุ่มติดตั้งด้านบน ตาราง 5-38 เป็นค่าอ้างอิง"));
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
      field("cableType", "ชนิดสาย", selectInput("cableType", input.cableType, cableOptions()), `<span id="type-hint"></span>`),
      field("cores", "รูปแบบแกน", selectInput("cores", input.cores, coreOptions())),
      field("group", "กลุ่มติดตั้ง", selectInput("group", input.group, groupOptions()), `<span id="group-hint"></span>`),
      field("size", "ขนาดสาย", selectInput("size", input.size, sizeOptions()), "ตารางหน่วยเป็น mm²"),
      field("sets", "จำนวนชุดขนาน", numInput("sets", input.sets, "1")),
      field("temp", "อุณหภูมิโดยรอบ", numInput("temp", input.temp, "0.1"), "องศาเซลเซียส"),
      field("ncirc", "จำนวนวงจรในกลุ่ม", numInput("ncirc", input.ncirc, "1")),
      field("phase", "จำนวนเฟส", selectInput("phase", input.phase, phaseOptions())),
    ].join("");
  }
  if (id === 2 || id === 3) return sizingFields(input, { wiring: true });
  if (id === 6) return sizingFields(input, { duct: true, mv: true });
  if (id === 10) return sizingFields(input);
  if (id === 4) return sizingFields(input, { motor: true });
  if (id === 5) return sizingFields(input, { transformer: true, wiring: true });
  if (id === 7) {
    return [
      field("volt", "แรงดันต้นทาง", numInput("volt", input.volt, "1"), "โวลต์"),
      field("limit", "เกณฑ์แรงดันตกรวม", numInput("limit", input.limit, "0.1"), "เปอร์เซ็นต์ของแรงดันต้นทาง"),
      sectionFields(input.sections),
    ].join("");
  }
  if (id === 8) {
    return [
      field("conduitMm", "ขนาดท่อ", selectInput("conduitMm", input.conduitMm, [{ value: "", label: "เลือกให้ขนาดเล็กสุดที่ผ่าน" }, ...engine.conduit.map((item) => ({ value: item.conduitMm, label: `${item.conduitMm} mm (${item.conduitInch}")` }))]), "เว้นว่างถ้าต้องการให้โปรแกรมเลือกให้"),
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
      field("phaseSize", "ขนาดสายเฟส", selectInput("phaseSize", input.phaseSize, sizeOptions()), "mm²"),
      field("material", "วัสดุตัวนำ", selectInput("material", input.material, [{ value: "copper", label: "ทองแดง" }, { value: "aluminium", label: "อะลูมิเนียม" }]), "สูตรหลักใช้ขนาดเฟส วัสดุเก็บไว้ให้ตรงกับตาราง"),
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
      field("billBaht", "ค่าไฟต่อเดือน (บาท)", numInput("billBaht", input.billBaht, "1"), "เว้นว่างถ้ากรอกพลังงานกลางวันเอง"),
      field("tariff", "อัตราค่าไฟ (บาท/kWh)", numInput("tariff", input.tariff, "0.01")),
      field("daytimeShare", "สัดส่วนใช้กลางวัน (0–1)", numInput("daytimeShare", input.daytimeShare, "0.01"), "เช่น 0.5 คือครึ่งหนึ่งของหน่วยในบิล"),
      field("kwhDay", "พลังงานใช้กลางวัน (kWh/วัน)", numInput("kwhDay", input.kwhDay, "0.1"), "ใช้เมื่อไม่ได้กรอกค่าไฟ"),
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
    const appliances = [0, 1, 2, 3].map((index) => `
      <div class="row-card">
        <h3>เครื่องใช้ ${index + 1}</h3>
        ${field(`a${index}w`, "กำลัง (W)", numInput(`a${index}w`, null, "1"))}
        ${field(`a${index}qty`, "จำนวน", numInput(`a${index}qty`, null, "1"))}
        ${field(`a${index}hours`, "ชั่วโมง/วัน", numInput(`a${index}hours`, null, "0.1"))}
      </div>`).join("");
    return [
      field("batteryType", "ชนิดแบตเตอรี่", selectInput("batteryType", input.batteryType || "", [
        { value: "", label: "กรอก DOD และประสิทธิภาพเอง" },
        { value: "lithium", label: "ลิเธียม LiFePO₄ — DOD 0.8, ประสิทธิภาพ 0.95" },
        { value: "lead", label: "ตะกั่วกรด — DOD 0.5, ประสิทธิภาพ 0.85" },
      ]), "ค่าตั้งต้นเป็นค่าประมาณของการออกแบบ"),
      appliances,
      field("whDay", "พลังงานโหลดต่อวัน (Wh/วัน)", numInput("whDay", input.whDay, "1"), "ใช้เมื่อไม่ได้กรอกเครื่องใช้ด้านบน"),
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
  if (id === 19) {
    return [
      field("unit", "หน่วยโหลด", selectInput("unit", input.unit, unitOptions())),
      field("load", "ค่าโหลด", numInput("load", input.load, "0.01")),
      field("volt", "แรงดันระบบ", numInput("volt", input.volt, "1"), "โวลต์"),
      field("pf", "เพาเวอร์แฟกเตอร์", numInput("pf", input.pf, "0.01")),
      field("phase", "จำนวนเฟส", selectInput("phase", input.phase, phaseOptions())),
      field("length", "ความยาวสาย", numInput("length", input.length, "0.1"), "เมตร ใช้กับแรงดันตกโดยประมาณ"),
      field("temp", "อุณหภูมิโดยรอบ", numInput("temp", input.temp, "0.1"), "ตารางกำหนดที่ 40°C"),
      field("sets", "จำนวนชุดขนาน", numInput("sets", input.sets, "1")),
      field("designMode", "วิธีกำหนดขนาด", selectInput("designMode", input.designMode || "load", [
        { value: "load", label: "จากโหลด" },
        { value: "breaker", label: "เลือกเบรกเกอร์ก่อน" },
      ])),
      field("breaker", "เบรกเกอร์", selectInput("breaker", input.breaker, breakerOptions())),
    ].join("");
  }
  if (id === 20) {
    const conduits = (input.conduits || [50]).map((size, index) => field(`c${index}`, `ท่อ ${index + 1} (mm)`, numInput(`c${index}`, size, "1"), index === 0 ? "ท่อที่ใหญ่สุดใช้เป็นฐานของ 8× หรือ 6×" : "เว้นว่างได้"));
    return [
      field("mode", "ลักษณะการดึง", selectInput("mode", input.mode, [
        { value: "straight", label: "ดึงตรง (Straight pull)" },
        { value: "angle", label: "ดึงมุม (Angle pull)" },
        { value: "u", label: "ดึงกลับรูปตัว U" },
      ])),
      ...conduits,
    ].join("");
  }
  return [
    field("size", "ขนาดตัวนำหลัก (mm²)", selectInput("size", input.size, sizeOptions())),
    field("conductors", "จำนวนตัวนำ (ไม่รวมสายดิน)", numInput("conductors", input.conductors, "1")),
    field("earth", "รวมสายดิน?", selectInput("earth", input.earth, [{ value: 1, label: "ใช่ (นับ 1)" }, { value: 0, label: "ไม่นับ" }])),
    field("devices", "จำนวนอุปกรณ์ในกล่อง (นับเป็น 2 ตัวนำต่อชุด)", numInput("devices", input.devices, "1")),
    field("terminations", "จุดต่อในกล่อง", numInput("terminations", input.terminations, "1"), "เว้นว่างเพื่อใช้จำนวนตัวนำด้านบนแบบเดิม"),
    field("through", "สายผ่าน ไม่ตัด", numInput("through", input.through, "1"), "นับ 1 ต่อเส้น"),
    field("loops", "ลูปหรือหางสาย", numInput("loops", input.loops, "1"), "นับ 1 ต่อเส้น"),
    field("category", "ประเภทกล่อง", selectInput("category", input.category, [
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
      wiring: take("wiring") || null,
      neutralRatio: take("neutralRatio", true),
      designMode: take("designMode") || "load",
    };
    if (id === 4) input.motorType = take("motorType");
    if (id === 6) {
      input.ductCircuits = take("ductCircuits", true);
      input.mvClass = take("mvClass");
      input.buriedSpacing = take("buriedSpacing") || null;
    }
    return input;
  }
  if (id === 19) {
    return {
      ...base,
      unit: take("unit"),
      load: take("load", true),
      volt: take("volt", true),
      pf: take("pf", true),
      phase: take("phase", true),
      length: take("length", true),
      temp: take("temp", true),
      sets: take("sets", true),
      breaker: take("breaker", true),
      designMode: take("designMode") || "load",
    };
  }
  if (id === 20) {
    return {
      mode: take("mode"),
      conduits: [0, 1, 2, 3].map((index) => take(`c${index}`, true)),
    };
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
      billBaht: take("billBaht", true),
      tariff: take("tariff", true),
      daytimeShare: take("daytimeShare", true),
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
      batteryType: take("batteryType") || null,
      appliances: [0, 1, 2, 3].map((index) => ({
        w: take(`a${index}w`, true),
        qty: take(`a${index}qty`, true),
        hours: take(`a${index}hours`, true),
      })),
    };
  }
  return {
    size: take("size", true),
    conductors: take("conductors", true),
    earth: take("earth", true),
    devices: take("devices", true),
    category: take("category"),
    terminations: take("terminations", true),
    through: take("through", true),
    loops: take("loops", true),
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
  return `<details class="fold"><summary>หมายเหตุที่ควรตรวจ (${list.length})</summary><div class="fold-body"><ul>${list.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div></details>`;
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
  return `<details class="fold table-wrap" id="size-table">
    <summary>ดูทุกขนาดสาย</summary>
    <div class="table-scroll"><table>
      <thead><tr><th>mm²</th><th>Iz</th><th>ปรับแล้ว</th><th>พิกัด</th><th>VD ฐ</th><th>VD R/X</th><th>VD</th><th>Smin</th><th>ช็อต</th><th>ผล</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>
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

function hero(pass, label, value, unit, extras = []) {
  const extraHtml = extras.map((item) => `<div class="spot-extra"><span>${esc(item.label)}</span><strong>${esc(item.value)}${item.unit ? ` ${esc(item.unit)}` : ""}</strong></div>`).join("");
  return `<div class="spotlight">
    <div>
      <p class="spot-k">${esc(label)}</p>
      <p class="spot-value">${esc(value)}${unit ? `<span class="spot-unit">${esc(unit)}</span>` : ""}</p>
    </div>
    ${extraHtml ? `<div class="spot-row">${extraHtml}</div>` : ""}
    ${badge(pass)}
  </div>`;
}

function renderResult(id, input, result) {
  const bits = [];
  if ([2, 3, 4, 5, 6, 10].includes(id)) {
    bits.push(hero(result.pass, "ขนาดสายที่แนะนำ", result.size == null ? "N/A" : fmtSize(result.size), result.size == null ? "" : "mm²", [
      { label: "เบรกเกอร์ In", value: result.in == null ? "N/A" : fmtNum(result.in, 0), unit: "A" },
      { label: "แรงดันตก", value: vdCell(result.vdTable), unit: "%" },
    ]));
    const trace = traceFor(id, input, result);
    if (trace) bits.push(`<p class="formula">${esc(trace)}</p>`);
    const items = [
      metric("กระแสโหลด Ib", fmtNum(result.ib), "A"),
      metric("Iz ตามตาราง", fmtNum(result.iz), "A"),
      metric("Iz หลัง Ca×Cg×ชุดขนาน", fmtNum(result.izAdj), "A"),
      metric("ตัวคูณอุณหภูมิ Ca", fmtNum(result.ca), ""),
      metric("ตัวคูณกลุ่ม Cg", fmtNum(result.cg), ""),
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
    if (result.neutralSize != null) items.push(metric("สายนิวทรัล", fmtSize(result.neutralSize), "mm²"));
    if (result.peFromBreaker != null) items.push(metric("PE จากเบรกเกอร์", fmtSize(result.peFromBreaker), "mm²"));
    if (result.peRecommended != null) items.push(metric("PE ที่แนะนำ", fmtSize(result.peRecommended), "mm²"));
    if (result.suggestedConduit && result.suggestedConduit.conduitMm) {
      items.push(metric("ท่อที่แนะนำ", String(result.suggestedConduit.conduitMm), "mm"));
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
    bits.push(hero(result.pass, "กระแสสูงสุดที่ใช้ได้", fmtNum(result.inMax), "A", [
      { label: "เบรกเกอร์", value: result.breaker == null ? "N/A" : fmtNum(result.breaker, 0), unit: "A" },
      { label: "Iz ตาราง", value: fmtNum(result.iz), unit: "A" },
    ]));
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
    bits.push(hero(result.pass, "แรงดันตกรวม", fmtNum(result.vdTableSum), "%", [
      { label: "จาก R และ X", value: fmtNum(result.vdRxSum), unit: "%" },
      { label: "ช่วงที่สูงสุด", value: result.worst == null ? "—" : String(result.worst) },
    ]));
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
    bits.push(hero(result.pass, "ขนาดท่อ", result.conduitMm == null ? "N/A" : String(result.conduitMm), result.conduitInch ? `mm (${result.conduitInch}")` : "mm", [
      { label: "พื้นที่ที่ใช้", value: fmtNum(result.fill), unit: "%" },
      { label: "จำนวนเส้น", value: fmtNum(result.conductors, 0) },
    ]));
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
    bits.push(hero(result.pass, "พื้นที่ที่ใช้ในราง", fmtNum(result.fill), "%", [
      { label: "เกณฑ์ 20%", value: fmtNum(result.limit), unit: "mm²" },
    ]));
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
    bits.push(hero(result.pass, "พิกัดทริป AT", result.at == null ? "N/A" : fmtNum(result.at, 0), "A", [
      { label: "เฟรม AF", value: result.af == null ? "N/A" : String(result.af), unit: "A" },
      { label: "กระแส", value: fmtNum(result.in), unit: "A" },
    ]));
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
    bits.push(hero(result.pass, "คาปาซิเตอร์ที่ต้องใช้", fmtNum(result.qc), "kVAR", [
      { label: "กระแสลดลง", value: fmtNum(result.iDrop), unit: "A" },
    ]));
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
    bits.push(hero(result.pass, "ขนาดสาย DC", result.dcSize == null ? "N/A" : fmtSize(result.dcSize), "mm²", [
      { label: "ขนาดระบบ", value: fmtNum(result.kwp), unit: "kWp" },
      { label: "กระแส AC", value: fmtNum(result.ibAc), unit: "A" },
    ]));
    bits.push(`<div class="metrics">
      ${metric("kWp จากหลังคา", fmtNum(result.kwpRoof), "kWp")}
      ${metric("kWp จากพลังงาน", fmtNum(result.kwpEnergy), "kWp")}
      ${metric("ขนาดระบบที่แนะนำ", fmtNum(result.kwp), "kWp")}
      ${metric("กระแส AC Ib", fmtNum(result.ibAc), "A")}
      ${metric("กระแสออกแบบ DC", fmtNum(result.iDc), "A")}
      ${metric("Ca สาย PV", fmtNum(result.ca), "")}
      ${metric("พิกัดสาย DC หลัง Ca", fmtNum(result.dcIz), "A")}
      ${metric("พลังงานจากบิล", fmtNum(result.kwhFromBill), "kWh/วัน")}
      ${metric("ขนาดสาย AC", result.acSize == null ? "N/A" : fmtSize(result.acSize), "mm²")}
      ${metric("เบรกเกอร์สาย AC", result.acIn == null ? "N/A" : fmtNum(result.acIn, 0), "A")}
      ${metric("แรงดันตกสาย AC", vdCell(result.acVd), "%")}
    </div>`);
    bits.push(`<p class="formula">สาย AC ${fmtNum(result.ibAc)} A ขนาด ${result.acSize == null ? "N/A" : fmtSize(result.acSize)} mm² ที่ ${esc(input.cableType)} / ${esc(input.group)}</p>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    bits.push(alerts(result.alerts));
    return bits.join("");
  }
  if (id === 17) {
    bits.push(hero(result.pass, "ความจุแบตเตอรี่", fmtNum(result.ah), "Ah", [
      { label: "แผงโซลาร์", value: fmtNum(result.pvW), unit: "W" },
      { label: "อินเวอร์เตอร์", value: fmtNum(result.inverter, 0), unit: "W" },
    ]));
    bits.push(`<div class="metrics">
      ${metric("พลังงานที่แบตต้องเก็บ", fmtNum(result.storeWh), "Wh")}
      ${metric("กำลังแผงที่ควรติดตั้ง", fmtNum(result.pvW), "W")}
      ${metric("กระแสชาร์จคอนโทรลเลอร์", fmtNum(result.scc), "A")}
      ${metric("อินเวอร์เตอร์แนะนำ", fmtNum(result.inverter, 0), "W")}
      ${metric("กระแสสาย DC ฝั่งแบต", fmtNum(result.idc), "A")}
      ${metric("แรงดันที่แนะนำ", result.suggestedVolt == null ? "—" : String(result.suggestedVolt), "V")}
      ${metric("ชาร์จคอนโทรลเลอร์", result.controllerStep == null ? "N/A" : String(result.controllerStep), "A")}
      ${metric("อินเวอร์เตอร์มาตรฐาน", result.inverterStep == null ? "N/A" : String(result.inverterStep), "W")}
      ${metric("สาย DC", result.dcSize == null ? "N/A" : fmtSize(result.dcSize), "mm²")}
    </div>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    if (input.acVolt) bits.push(`<p class="hint">แรงดันอินเวอร์เตอร์ AC ${esc(input.acVolt)} V ถูกบันทึกตามชีตต้นทาง สูตรขนาดอินเวอร์เตอร์ใช้กำลังโหลดสูงสุด × 1.25</p>`);
    bits.push(alerts(result.alerts));
    return bits.join("");
  }
  if (id === 19) {
    bits.push(hero(result.pass, "ขนาดสายอากาศ", result.size == null ? "N/A" : fmtSize(result.size), "mm²", [
      { label: "กระแส Ib", value: fmtNum(result.ib), unit: "A" },
      { label: "เบรกเกอร์", value: result.in == null ? "N/A" : fmtNum(result.in, 0), unit: "A" },
    ]));
    bits.push(`<div class="metrics">
      ${metric("Iz ตาราง 40°C", fmtNum(result.iz, 0), "A")}
      ${metric("Iz หลัง Ca และชุดขนาน", fmtNum(result.izAdj), "A")}
      ${metric("Ca", fmtNum(result.ca), "")}
      ${metric("แรงดันตกโดยประมาณ", fmtNum(result.vd), "%")}
    </div>`);
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    bits.push(alerts(result.alerts));
    return bits.join("");
  }
  if (id === 20) {
    const modeName = result.mode === "straight" ? "ดึงตรง" : result.mode === "u" ? "ดึงกลับรูปตัว U" : "ดึงมุม";
    bits.push(hero(result.pass, "ความยาวกล่องอย่างน้อย", result.length == null ? "N/A" : fmtNum(result.length, 0), "mm", [
      { label: "ท่อใหญ่สุด", value: result.largest == null ? "—" : fmtNum(result.largest, 0), unit: "mm" },
      { label: "ลักษณะ", value: modeName },
    ]));
    bits.push(`<p>${esc(result.reason || "")}</p>`);
    bits.push(alerts(result.alerts));
    return bits.join("");
  }
  const box = result.box;
  bits.push(hero(result.pass, "กล่องที่พอใช้", box ? box.metricLabel : "N/A", box ? "มม." : "", [
    { label: "ตัวนำเทียบเท่า", value: result.equiv == null ? "—" : String(result.equiv) },
  ]));
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

function pager(id) {
  const prev = id > 1 ? calcById(id - 1) : null;
  const next = id < 20 ? calcById(id + 1) : null;
  return `<nav class="pager" aria-label="เครื่องคำนวณถัดไป">
    ${prev ? `<a href="#${prev.id}">← ${esc(prev.title)}</a>` : "<span></span>"}
    ${next ? `<a href="#${next.id}">${esc(next.title)} →</a>` : "<span></span>"}
  </nav>`;
}

function calcView(id) {
  const calc = calcById(id);
  const input = defaultInput(id);
  return shell(`
    <div class="layout">
      <section class="card">
        <h2>${esc(calc.title)}</h2>
        <p class="en">${esc(calc.en)}</p>
        <details class="fold">
          <summary>ตัวอย่างที่กรอกไว้</summary>
          <div class="fold-body">
            <p>${esc(calc.example)}</p>
            <p>${esc(calc.refs)}</p>
          </div>
        </details>
        <form id="calc-form" autocomplete="off">
          ${field("projectName", "ชื่องานสำหรับรายงาน", `<input id="projectName" name="projectName" type="text" value="">`, "แสดงบนแผ่นพิมพ์")}
          <div class="fields">${formFor(id, input)}</div>
          <div class="actions">
            <button type="button" id="reset" class="ghost">คืนค่าตัวอย่าง</button>
            <button type="button" id="print" class="ghost">พิมพ์</button>
          </div>
        </form>
      </section>
      <section class="card results" id="calc-out" aria-live="polite"></section>
    </div>
    ${pager(id)}
    <article id="print-sheet" class="print-sheet"></article>
    ${footer()}
  `, calc.title, id);
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
    document.querySelectorAll(".group").forEach((group) => {
      const cards = [...group.querySelectorAll(".calc-card")];
      if (!cards.length) return;
      group.hidden = cards.every((card) => card.hidden);
    });
  });
}

function bindMenu() {
  const sheet = document.getElementById("nav-sheet");
  const open = document.getElementById("menu-btn");
  if (!sheet || !open) return;
  const setOpen = (next) => {
    sheet.hidden = !next;
    open.setAttribute("aria-expanded", next ? "true" : "false");
  };
  open.addEventListener("click", () => setOpen(sheet.hidden));
  sheet.addEventListener("click", (event) => {
    if (event.target.closest("[data-close], a")) setOpen(false);
  });
  const search = document.getElementById("menu-q");
  if (search) {
    search.addEventListener("input", () => {
      const query = search.value.trim().toLowerCase();
      sheet.querySelectorAll(".menu-link[data-text]").forEach((link) => {
        link.hidden = Boolean(query) && !link.dataset.text.includes(query);
      });
    });
  }
}

function bindCalc(id) {
  const form = document.getElementById("calc-form");
  const out = document.getElementById("calc-out");
  const paintResult = () => {
    const open = document.getElementById("size-table");
    const wasOpen = open ? open.open : false;
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
  document.getElementById("print").addEventListener("click", () => {
    const calc = calcById(id);
    const project = (form.elements.projectName && form.elements.projectName.value.trim()) || "ไม่ได้ตั้งชื่อ";
    const sheet = document.getElementById("print-sheet");
    sheet.innerHTML = `
      <p class="quiet">โปรแกรมคำนวณสายไฟ No.1</p>
      <h1>${esc(project)}</h1>
      <h2>${esc(calc.title)} <span class="en">${esc(calc.en)}</span></h2>
      <h3>ข้อมูลที่กรอก</h3>
      <p>${[...form.querySelectorAll(".field")].map((node) => {
        const label = node.querySelector(".field-label");
        const control = node.querySelector("input, select");
        if (!label || !control || control.name === "projectName") return "";
        const shown = control.tagName === "SELECT" ? control.selectedOptions[0]?.textContent || control.value : control.value;
        return shown ? `${label.textContent}: ${shown}` : "";
      }).filter(Boolean).join("<br>")}</p>
      <h3>ผลลัพธ์</h3>
      ${out.innerHTML}
      <h3>มาตรฐาน</h3>
      <p>${esc(calc.refs)}</p>
      <p><strong>${esc(LICENSE_NOTE)}</strong></p>
      <p>${esc(DISCLAIMER)}</p>`;
    window.print();
  });
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
  bindMenu();
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
      navigator.serviceWorker.register(new URL("../sw.js", import.meta.url), { updateViaCache: "none" }).catch(() => {});
    }
  } catch (error) {
    app.innerHTML = `<p class="error wrap">โหลดตารางมาตรฐานไม่สำเร็จ (${esc(error.message)}) ลองรีเฟรชหน้าอีกครั้ง</p>`;
  }
}

boot();
