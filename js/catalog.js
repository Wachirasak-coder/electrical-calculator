/** Labels, defaults and references for the 18 calculators. */

export const CALCS = [
  {
    id: 1,
    title: "พิกัดกระแส LV",
    en: "LV Current Rating",
    blurb: "โหมดย้อนกลับ — จากขนาดสายหา Iz หลัง Ca และ Cg",
    refs: "อ้างอิง: วสท. 022001-22 ตาราง 5-20 ถึง 5-42, ตาราง 5-43/5-44, ตาราง 5-8",
    example: "ตัวอย่าง: IEC 01 (THW) 10 mm², G2, 35°C, 1 วงจร, 1 เฟส",
  },
  {
    id: 2,
    title: "ขนาดสาย 1 เฟส",
    en: "1-Phase Cable Sizing",
    blurb: "เลือกขนาดมาตรฐานเล็กสุดที่ผ่านพิกัดกระแสและแรงดันตก",
    refs: "อ้างอิง: วสท. ตาราง 5-20 (G2), 5-43, 5-8, ฐ.1–ฐ.4, ตาราง 4-1, IEC 60364 — ไม่คำนวณ VD ของ THW-A",
    example: "ตัวอย่าง: 1 เฟส 230 V โหลด 5 kW PF 0.9 ยาว 40 m สายทองแดง IEC 01 (THW) G2 ที่ 35°C วงจรเดียว VD ≤ 3%",
  },
  {
    id: 3,
    title: "ขนาดสาย 3 เฟส",
    en: "3-Phase Cable Sizing",
    blurb: "Ib จาก kW / kVA / A แล้วเลือกสายที่ผ่านทุกเงื่อนไข",
    refs: "อ้างอิง: วสท. ตาราง 5-27 (XLPE, G1/G2), 5-43, 5-8, ตาราง ฐ, ตาราง 4-1, IEC 60364 (R/X และ k)",
    example: "ตัวอย่าง: 3 เฟส 400 V 30 kW PF 0.85 ยาว 80 m สายทองแดง CV/XLPE ร้อยท่อในอากาศ (G2) 35°C วงจรเดียว VD ≤ 3%",
  },
  {
    id: 4,
    title: "วงจรมอเตอร์",
    en: "Motor Circuit",
    blurb: "กระแสออกแบบ = FLC จากตาราง × ตัวคูณ DOL หรือ Star-Delta",
    refs: "อ้างอิง: ตารางกระแสมอเตอร์มาตรฐาน, ตัวคูณ DOL 1.25 / Star-Delta 0.91, วสท. ตารางพิกัดกระแสและแรงดันตก",
    example: "ตัวอย่าง: มอเตอร์ 3 เฟส 400 V 15 kW สตาร์ท DOL สายทองแดง NYY หลายแกน G3 ยาว 50 m ที่ 35°C",
  },
  {
    id: 5,
    title: "สายเมนหม้อแปลง",
    en: "Transformer Feeder",
    blurb: "Ib = kVA × 1000 / (√3 × V) แล้วเลือกสายบนรางเคเบิล",
    refs: "อ้างอิง: วสท. ตารางพิกัดกระแส XLPE กลุ่มที่ 7 (5-32), ตาราง 5-43, 5-40/5-41, ตาราง ฐ, ตาราง 4-1 — รางเคเบิลคำนวณแบบชั้นเดียว",
    example: "ตัวอย่าง: หม้อแปลง 500 kVA 400 V สายทองแดง CV/XLPE แกนเดียว วางเว้นระยะบนรางเคเบิลบันไดไม่มีฝา (G7) ยาว 30 m ที่ 40°C",
  },
  {
    id: 6,
    title: "สายแรงดัน MV",
    en: "MV Current Rating",
    blurb: "พิกัดสายแรงดันปานกลางตามตาราง 5-36/5-37 และอ้างอิง duct bank 5-38",
    refs: "อ้างอิง: วสท. ตาราง 5-36 และ 5-37, ตาราง 5-38 (duct bank), ตาราง ฐ.3/ฐ.4 สำหรับ XLPE 90°C — ถ้าไม่มีแถวตรงชนิด/กลุ่ม โปรแกรมจะไม่เดาค่า",
    example: "ตัวอย่าง: สาย MV XLPE ทองแดง 12/20 kV โหลด 200 A ยาว 200 m PF 0.85 VD ≤ 3% ที่ 40°C",
  },
  {
    id: 7,
    title: "แรงดันตก",
    en: "Voltage Drop Route",
    blurb: "รวมแรงดันตกได้สูงสุด 5 ช่วง จากตาราง ฐ และจาก R, X",
    refs: "อ้างอิง: วสท. บทที่ 9 / ตาราง ฐ.1–ฐ.4 และสูตร IEC 60364 ΔV = K·I·L·(R cosφ + X sinφ) โดย K = 2 (1 เฟส) หรือ √3 (3 เฟส)",
    example: "ตัวอย่าง: เมน 150 A สาย 95 mm² ยาว 60 m ต่อวงจรย่อย 40 A สาย 16 mm² ยาว 25 m เกณฑ์รวม 5%",
  },
  {
    id: 8,
    title: "ท่อร้อยสาย",
    en: "Conduit Fill",
    blurb: "เกณฑ์ตาราง 5-3: 1 เส้น 53%, 2 เส้น 31%, ตั้งแต่ 3 เส้น 40%",
    refs: "อ้างอิง: วสท. ตาราง 5-3 หลักเกณฑ์ร้อยละการบรรจุตัวนำในท่อร้อยสาย",
    example: "ตัวอย่าง: IEC 01 4 mm² จำนวน 4 เส้น และ VCT 1/C 2.5 mm² จำนวน 3 เส้น รวม 7 เส้น ใช้เกณฑ์ 40%",
  },
  {
    id: 9,
    title: "รางเดินสาย",
    en: "Wireway Fill",
    blurb: "พื้นที่บรรจุสายรวมต้องไม่เกิน 20% ของหน้าตัดราง",
    refs: "อ้างอิง: เกณฑ์การติดตั้ง พื้นที่บรรจุสายรวมต้องไม่เกินร้อยละ 20 ของพื้นที่หน้าตัดรางเดินสาย",
    example: "ตัวอย่าง: ราง 100×300 mm มี NYY 25 mm² จำนวน 6 เส้น และ VCT 4 mm² จำนวน 8 เส้น",
  },
  {
    id: 10,
    title: "รางเคเบิล G7",
    en: "Cable Tray Ampacity",
    blurb: "พิกัดกระแสกลุ่มที่ 7 แบบชั้นเดียว พร้อมแรงดันตก",
    refs: "อ้างอิง: วสท. ตาราง 5-32/5-33 (XLPE กลุ่มที่ 7) และตาราง 5-40/5-41 ตัวคูณกลุ่มวงจร — แบบชั้นเดียว (single-layer) เท่านั้น",
    example: "ตัวอย่าง: สาย CV/XLPE ทองแดง แกนเดียว วางเว้นระยะบนรางบันไดไม่มีฝา ที่ 40°C โหลด 200 A",
  },
  {
    id: 11,
    title: "สายดิน PE",
    en: "PE / Earthing Conductor",
    blurb: "S ≤ 16 ใช้เท่าเฟส, 16 < S ≤ 35 ใช้ 16, S > 35 ใช้ครึ่งหนึ่งแล้วปัดขึ้น",
    refs: "อ้างอิง: วสท. ตาราง 4-1 และ IEC 60364-5-54 Table 54.2",
    example: "ตัวอย่าง: สายเฟส 95 mm² ทองแดง ต้องการ PE ชนิด IEC 01 ในกลุ่ม G2 (95/2 = 47.5 → 50 mm²)",
  },
  {
    id: 12,
    title: "ตู้ MDB",
    en: "Breaker AT / AF",
    blurb: "โหมด A จากตาราง ส-1 หรือโหมด B จากกระแสออกแบบ",
    refs: "อ้างอิง: วสท. ภาคผนวก ส ตาราง ส-1 สำหรับโหมด A",
    example: "ตัวอย่างโหมด B: กระแสออกแบบ 800 A เลือก AT 800 A และ AF เป็นเฟรมมาตรฐานที่ไม่เล็กกว่า AT",
  },
  {
    id: 13,
    title: "ลัดวงจร MDB",
    en: "Short Circuit at MDB",
    blurb: "Ik จากตาราง ส-1 แล้วเผื่อ Icu ตามข้อ 3.5.2",
    refs: "อ้างอิง: วสท. ภาคผนวก ส ตาราง ส-1 และข้อ 3.5.2 แนะนำเผื่อ 25%",
    example: "ตัวอย่าง: หม้อแปลง 1,000 kVA",
  },
  {
    id: 14,
    title: "ลัดวงจร DB",
    en: "Short Circuit at DB",
    blurb: "Ik จากตาราง ส-2 โดยใช้ระยะที่สั้นกว่าอย่างอนุรักษ์นิยม",
    refs: "อ้างอิง: วสท. ภาคผนวก ส ตาราง ส-2 และข้อ 3.5.2",
    example: "ตัวอย่าง: หม้อแปลง 1,000 kVA สาย 185 mm² ยาว 40 m (ใช้ค่าที่ระยะ 25 m เพราะตารางมีแค่ 25 และ 50 m)",
  },
  {
    id: 15,
    title: "เพาเวอร์แฟกเตอร์",
    en: "Power Factor Correction",
    blurb: "Qc = P (tan φ1 − tan φ2)",
    refs: "อ้างอิงสูตรมาตรฐาน Qc = P (tan φ1 − tan φ2)",
    example: "ตัวอย่าง: โหลด 3 เฟส 400 V 80 kW PF 0.75 ปรับเป็น 0.95",
  },
  {
    id: 16,
    title: "โซลาร์ On-Grid",
    en: "Solar On-grid",
    blurb: "ขนาดระบบจากหลังคา พลังงาน และอินเวอร์เตอร์ สาย DC คูณ 1.5625",
    refs: "อ้างอิง: EIT 022013-25 ภาคผนวก ฌ ตาราง ฌ.1–ฌ.2, ตัวคูณกระแส DC 1.25×1.25 = 1.5625, สาย AC ตาม วสท. 2564",
    example: "ตัวอย่าง: หลังคา 80 m² ใช้ไฟกลางวัน 12 kWh/วัน อินเวอร์เตอร์ 5 kW 3 เฟส 400 V",
  },
  {
    id: 17,
    title: "โซลาร์ Off-Grid",
    en: "Solar Off-grid",
    blurb: "ลำดับ Load → Battery → PV → SCC → Inverter",
    refs: "ลำดับสูตรทางวิศวกรรมทั่วไปสำหรับระบบ Off-grid (ต้องปรับกับข้อมูลแผง/แบตจริง)",
    example: "ตัวอย่าง: โหลด 1,200 Wh/วัน สำรอง 2 วัน ระบบ 48 V DOD 50%",
  },
  {
    id: 18,
    title: "กล่องไฟฟ้า",
    en: "Box Fill / Pull Box",
    blurb: "ตัวนำเทียบเท่า = จำนวนสาย + สายดิน + อุปกรณ์ × 2 เทียบตาราง 6.4",
    refs: "อ้างอิง: วสท. ตาราง 6.4 ขนาดกล่องมาตรฐานและจำนวนตัวนำสูงสุด",
    example: "ตัวอย่าง: ตัวนำ 4 mm² จำนวน 8 เส้น รวมสายดิน และอุปกรณ์ 2 ชุด",
  },
];

function section(partial) {
  return {
    phase: 3,
    current: null,
    length: null,
    cableType: "",
    size: null,
    cores: "แกนเดียว (single-core)",
    group: "G2",
    pf: 0.85,
    ...partial,
  };
}

function line(partial) {
  return { label: "", size: null, qty: null, ...partial };
}

export function defaultInput(id) {
  switch (Number(id)) {
    case 1:
      return {
        cableType: "IEC 01 (THW)",
        cores: "แกนเดียว (single-core)",
        group: "G2",
        size: 10,
        sets: 1,
        temp: 35,
        ncirc: 1,
        phase: 1,
      };
    case 2:
      return {
        cableType: "IEC 01 (THW)",
        cores: "แกนเดียว (single-core)",
        group: "G2",
        unit: "kW",
        load: 5,
        volt: 230,
        pf: 0.9,
        length: 40,
        temp: 35,
        ncirc: 1,
        sets: 1,
        vdLimit: 3,
        breaker: null,
        isc: null,
        tsec: null,
        maxSize: null,
        phase: 1,
      };
    case 3:
      return {
        cableType: "CV/XLPE 0.6/1 kV",
        cores: "แกนเดียว (single-core)",
        group: "G2",
        unit: "kW",
        load: 30,
        volt: 400,
        pf: 0.85,
        length: 80,
        temp: 35,
        ncirc: 1,
        sets: 1,
        vdLimit: 3,
        breaker: null,
        isc: null,
        tsec: null,
        maxSize: null,
        phase: 3,
      };
    case 4:
      return {
        cableType: "NYY",
        cores: "หลายแกน (multi-core)",
        group: "G3",
        unit: "kW",
        load: 15,
        volt: 400,
        pf: 0.85,
        length: 50,
        temp: 35,
        ncirc: 1,
        sets: 1,
        vdLimit: 3,
        breaker: null,
        isc: null,
        tsec: null,
        maxSize: null,
        phase: 3,
        motorType: "M2",
      };
    case 5:
      return {
        cableType: "CV/XLPE 0.6/1 kV",
        cores: "แกนเดียว (single-core)",
        group: "G7_NOCOVER_LADDER_SPACED",
        unit: "kVA",
        load: 500,
        volt: 400,
        pf: 1,
        length: 30,
        temp: 40,
        ncirc: 1,
        sets: 1,
        vdLimit: 3,
        breaker: null,
        isc: null,
        tsec: null,
        maxSize: null,
        phase: 3,
      };
    case 6:
      return {
        cableType: "CV MV (IEC 60502-2)",
        cores: "แกนเดียว (single-core)",
        group: "G2",
        unit: "A",
        load: 200,
        volt: 20000,
        pf: 0.85,
        length: 200,
        temp: 40,
        ncirc: 1,
        sets: 1,
        vdLimit: 3,
        breaker: null,
        isc: null,
        tsec: null,
        maxSize: null,
        phase: 3,
        ductCircuits: null,
      };
    case 7:
      return {
        volt: 400,
        limit: 5,
        sections: [
          section({
            phase: 3,
            current: 150,
            length: 60,
            cableType: "CV/XLPE 0.6/1 kV",
            size: 95,
            cores: "หลายแกน (multi-core)",
            group: "G2",
            pf: 0.85,
          }),
          section({
            phase: 3,
            current: 40,
            length: 25,
            cableType: "IEC 01 (THW)",
            size: 16,
            cores: "แกนเดียว (single-core)",
            group: "G2",
            pf: 0.9,
          }),
          section({}),
          section({}),
          section({}),
        ],
      };
    case 8:
      return {
        conduitMm: null,
        lines: [
          line({ label: "IEC 01", size: 4, qty: 4 }),
          line({ label: "VCT 1/C", size: 2.5, qty: 3 }),
          line({}),
          line({}),
          line({}),
          line({}),
          line({}),
          line({}),
        ],
      };
    case 9:
      return {
        label: "100×300",
        lines: [
          line({ label: "NYY 3/C", size: 25, qty: 6 }),
          line({ label: "VCT 1/C", size: 4, qty: 8 }),
          line({}),
          line({}),
          line({}),
          line({}),
          line({}),
          line({}),
        ],
      };
    case 10:
      return {
        cableType: "CV/XLPE 0.6/1 kV",
        cores: "แกนเดียว (single-core)",
        group: "G7_NOCOVER_LADDER_SPACED",
        unit: "A",
        load: 200,
        volt: 400,
        pf: 0.85,
        length: 50,
        temp: 40,
        ncirc: 1,
        sets: 1,
        vdLimit: 3,
        breaker: null,
        isc: null,
        tsec: null,
        maxSize: null,
        phase: 3,
      };
    case 11:
      return { phaseSize: 95, material: "copper", cableType: "IEC 01 (THW)", group: "G2" };
    case 12:
      return { mode: "B", kva: 500, designA: 800 };
    case 13:
      return { kva: 1000, margin: 25, installedIcu: null };
    case 14:
      return { kva: 1000, size: "185", length: 40, margin: 25 };
    case 15:
      return { p: 80, pf1: 0.75, pf2: 0.95, volt: 400, phase: 3, freq: 50 };
    case 16:
      return {
        roof: 80,
        kwhDay: 12,
        inverterKw: 5,
        volt: 400,
        phase: 3,
        length: 25,
        tempDc: 50,
        ncirc: 1,
        vdc: 400,
        psh: 4.5,
        m2PerKwp: 6,
        cableType: "CV/XLPE 0.6/1 kV",
        group: "G2",
      };
    case 17:
      return {
        whDay: 1200,
        days: 2,
        volt: 48,
        dod: 0.5,
        battEff: 0.9,
        psh: 4.5,
        chargeEff: 0.8,
        acVolt: 230,
        peakW: 400,
      };
    case 18:
      return { size: 4, conductors: 8, earth: 1, devices: 2, category: "" };
    default:
      return {};
  }
}

export function calcById(id) {
  return CALCS.find((item) => item.id === Number(id));
}
