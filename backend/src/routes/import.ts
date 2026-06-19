import { Router } from 'express';
import multer from 'multer';
import prisma from '../lib/prisma';
import { requireRole } from '../middleware/auth';

type PdfParseFunc = (buf: Buffer) => Promise<{ text: string }>;
let _pdfParse: PdfParseFunc | null = null;
function getPdfParse(): PdfParseFunc {
  if (!_pdfParse) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _pdfParse = require('pdf-parse/lib/pdf-parse.js') as PdfParseFunc;
  }
  return _pdfParse;
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const CONSUMABLE_KEYWORDS = [
  'verbrauchsmaterial', 'toner', 'entwickler', 'resttonerbehälter',
  'trommel', 'heftklammern', 'staple', 'heftklammer',
];

export interface ParsedItem {
  code: string;
  articleNumber: string;
  name: string;
  selected: boolean;
}

export interface ParsedModel {
  name: string;
  manufacturer: string;
  selected: boolean;
  existsAlready: boolean;
}

// ── Manufacturer detection ──────────────────────────────────────────────────

function detectManufacturer(text: string): string {
  const t = text.toLowerCase();
  if (/e-studio/i.test(text) || t.includes('toshiba')) return 'Toshiba';
  if (/utax|triumph-adler/i.test(text)) return 'Utax';
  if (/konica\s*minolta|bizhub/i.test(text)) return 'Konica Minolta';
  if (/\bricoh\b|gestetner|savin|\blasvin\b/i.test(text)) return 'Ricoh';
  return 'Unbekannt';
}

// ── Model extractors ────────────────────────────────────────────────────────

function extractModels(text: string, manufacturer: string): string[] {
  const seen = new Map<string, string>();
  const add = (name: string) => {
    const key = name.toLowerCase().trim();
    if (key.length > 1 && !seen.has(key)) seen.set(key, name.trim());
  };

  let m: RegExpExecArray | null;

  switch (manufacturer) {
    case 'Toshiba': {
      // Slash-separated: e-STUDIO2525Ac/3025Ac/3525Ac/4525Ac
      const slashRe = /e-STUDIO(\d+[A-Za-z]+)((?:\/\d+[A-Za-z]+)+)/gi;
      while ((m = slashRe.exec(text)) !== null) {
        add(`e-STUDIO${m[1]}`);
        m[2].split('/').filter(Boolean).forEach((s) => add(`e-STUDIO${s}`));
      }
      const directRe = /e-STUDIO\d+[A-Za-z]+/gi;
      while ((m = directRe.exec(text)) !== null) add(m[0]);
      break;
    }
    case 'Utax': {
      // Models: 3506ci, 4006ci, 6006ci, P-4530 MFP, CD 5540, etc.
      const re = /\bP-\d{4,5}(?:\s*MFP)?\b|\b(?:CD|CS|LP|PC)\s+\d{4,5}\b|\b\d{4,5}(?:ci|i|c)\b/gi;
      while ((m = re.exec(text)) !== null) add(m[0].replace(/\s+/g, ' '));
      break;
    }
    case 'Konica Minolta': {
      // Models: bizhub C250i, bizhub 4050i, bizhub PRO C1060
      const re = /bizhub\s+(?:PRO\s+)?(?:C\s*)?\d+\w*/gi;
      while ((m = re.exec(text)) !== null) add(m[0].replace(/\s+/g, ' '));
      break;
    }
    case 'Ricoh': {
      // Models: IM C2000, MP C2004, SP C352DN, IM 2702
      const re = /\b(?:IM|MP|SP|P)\s+C?\d+[A-Za-z]*/gi;
      while ((m = re.exec(text)) !== null) add(m[0].replace(/\s+/g, ' '));
      break;
    }
    default: {
      // Generic fallback: alphanumeric model codes
      const re = /\b[A-Z]{1,3}-?\d{3,5}[A-Za-z]*\b/g;
      while ((m = re.exec(text)) !== null) add(m[0]);
      break;
    }
  }

  return [...seen.values()];
}

// ── Accessory parsers per manufacturer ─────────────────────────────────────

function parseToshibaAccessories(text: string): ParsedItem[] {
  // pdf-parse merges columns: "KA-5005PC6AG00006726Vorlagenglasabdeckung"
  // Article numbers start with "6", end with digit
  const ITEM_RE = /\b([A-Z]{2,5}(?:-[A-Z0-9]+)+)(6[A-Z0-9]{8,10}[0-9])([^\n]{2,120})/g;
  const TRIM_RE = /[,;]?\s*\d[\d\s]*\s*(x\s*\d|mm|cm|kg|Blatt|Umschläge|Ablagen|Kapazität|g\/m).*/i;
  const accessories: ParsedItem[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = ITEM_RE.exec(text)) !== null) {
    const [, code, articleNumber, rawName] = m;
    if (seen.has(code)) continue;
    let name = rawName.trim().replace(TRIM_RE, '').replace(/[,;]\s*$/, '').trim();
    if (!name || name.length < 2) continue;
    const lower = name.toLowerCase();
    if (CONSUMABLE_KEYWORDS.some((kw) => lower.includes(kw))) continue;
    if (name.startsWith('e-STUDIO')) continue;
    seen.add(code);
    accessories.push({ code, articleNumber, name, selected: true });
  }
  return accessories;
}

function parseUtaxAccessories(text: string): ParsedItem[] {
  // Utax codes: BK-5570, TK-5570K, DC-6520, PK-5012, DV-5230K, MK-5230
  // Article numbers: 1T02NR0UT0, 1T02YK0UT0 (12-14 chars starting with 1T)
  const ITEM_RE = /\b([A-Z]{2,3}-\d{4,5}[A-Z]?)\s*(1T[A-Z0-9]{8,12})\s*([^\n]{2,120})/g;
  const accessories: ParsedItem[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = ITEM_RE.exec(text)) !== null) {
    const [, code, articleNumber, rawName] = m;
    if (seen.has(code)) continue;
    let name = rawName.trim().replace(/[,;]\s*$/, '').trim();
    if (!name || name.length < 2) continue;
    const lower = name.toLowerCase();
    if (CONSUMABLE_KEYWORDS.some((kw) => lower.includes(kw))) continue;
    seen.add(code);
    accessories.push({ code, articleNumber, name, selected: true });
  }
  // Fallback: code alone without article number
  if (accessories.length === 0) {
    const CODE_RE = /\b([A-Z]{2,3}-\d{4,5}[A-Z]?)\s+([^\n]{3,80})/g;
    while ((m = CODE_RE.exec(text)) !== null) {
      const [, code, rawName] = m;
      if (seen.has(code)) continue;
      let name = rawName.trim().replace(/[,;]\s*$/, '').trim();
      if (!name || name.length < 2) continue;
      const lower = name.toLowerCase();
      if (CONSUMABLE_KEYWORDS.some((kw) => lower.includes(kw))) continue;
      seen.add(code);
      accessories.push({ code, articleNumber: '', name, selected: true });
    }
  }
  return accessories;
}

function parseKonicaMinoltaAccessories(text: string): ParsedItem[] {
  // KM codes: TNP-79K, IU-213K, DV-216K, WT-506
  // Article numbers: A8K3350, ACF0060 (start with A, 7-9 chars)
  const ITEM_RE = /\b([A-Z]{2,4}-\d{1,4}[A-Z]?)\s*(A[A-Z0-9]{6,9})\s*([^\n]{2,120})/g;
  const accessories: ParsedItem[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = ITEM_RE.exec(text)) !== null) {
    const [, code, articleNumber, rawName] = m;
    if (seen.has(code)) continue;
    let name = rawName.trim().replace(/[,;]\s*$/, '').trim();
    if (!name || name.length < 2) continue;
    const lower = name.toLowerCase();
    if (CONSUMABLE_KEYWORDS.some((kw) => lower.includes(kw))) continue;
    seen.add(code);
    accessories.push({ code, articleNumber, name, selected: true });
  }
  if (accessories.length === 0) {
    const CODE_RE = /\b([A-Z]{2,4}-\d{1,4}[A-Z]?)\s+([^\n]{3,80})/g;
    while ((m = CODE_RE.exec(text)) !== null) {
      const [, code, rawName] = m;
      if (seen.has(code)) continue;
      let name = rawName.trim().replace(/[,;]\s*$/, '').trim();
      if (!name || name.length < 2) continue;
      const lower = name.toLowerCase();
      if (CONSUMABLE_KEYWORDS.some((kw) => lower.includes(kw))) continue;
      seen.add(code);
      accessories.push({ code, articleNumber: '', name, selected: true });
    }
  }
  return accessories;
}

function parseRicohAccessories(text: string): ParsedItem[] {
  // Ricoh article numbers: 6-digit like 408181, 407740 or D-series like D1362050
  // Codes: often just names without fixed codes
  const ITEM_RE = /\b([A-Z]{1,2}\d{7,8}|\d{6})\s+([^\n]{3,120})/g;
  const accessories: ParsedItem[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = ITEM_RE.exec(text)) !== null) {
    const [, articleNumber, rawName] = m;
    if (seen.has(articleNumber)) continue;
    let name = rawName.trim().replace(/[,;]\s*$/, '').trim();
    if (!name || name.length < 2) continue;
    const lower = name.toLowerCase();
    if (CONSUMABLE_KEYWORDS.some((kw) => lower.includes(kw))) continue;
    seen.add(articleNumber);
    accessories.push({ code: articleNumber, articleNumber, name, selected: true });
  }
  return accessories;
}

function parseAccessories(text: string, manufacturer: string): ParsedItem[] {
  switch (manufacturer) {
    case 'Toshiba': return parseToshibaAccessories(text);
    case 'Utax': return parseUtaxAccessories(text);
    case 'Konica Minolta': return parseKonicaMinoltaAccessories(text);
    case 'Ricoh': return parseRicohAccessories(text);
    default: return parseToshibaAccessories(text);
  }
}

// ── POST /api/import/parse-pdf ───────────────────────────────────────────────
router.post('/parse-pdf', requireRole('ADMIN'), upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Keine Datei hochgeladen.' });

    const data = await getPdfParse()(req.file.buffer);
    const manufacturer = detectManufacturer(data.text);
    const rawModels = extractModels(data.text, manufacturer);
    const accessories = parseAccessories(data.text, manufacturer);

    const existing = await prisma.machineModel.findMany({
      where: { modelName: { in: rawModels } },
      select: { modelName: true },
    });
    const existingNames = new Set(existing.map((e) => e.modelName));

    const machineModels: ParsedModel[] = rawModels.map((name) => ({
      name,
      manufacturer,
      selected: true,
      existsAlready: existingNames.has(name),
    }));

    res.json({ manufacturer, machineModels, accessories });
  } catch (error) {
    console.error('PDF parse error:', error);
    res.status(500).json({ message: 'Fehler beim Lesen der PDF. Bitte prüfen ob es ein gültiges PDF ist.' });
  }
});

// ── POST /api/import/confirm ─────────────────────────────────────────────────
router.post('/confirm', requireRole('ADMIN'), async (req, res) => {
  try {
    const { accessories, machineModels } = req.body as {
      accessories: ParsedItem[];
      machineModels: ParsedModel[];
    };

    const modelIds: string[] = [];
    for (const m of machineModels) {
      if (!m.selected) continue;
      let model = await prisma.machineModel.findFirst({ where: { modelName: m.name } });
      if (!model) {
        model = await prisma.machineModel.create({
          data: { modelName: m.name, manufacturer: m.manufacturer || null },
        });
      } else if (m.manufacturer && !model.manufacturer) {
        // Fill in manufacturer if it was missing
        await prisma.machineModel.update({
          where: { id: model.id },
          data: { manufacturer: m.manufacturer },
        });
      }
      modelIds.push(model.id);
    }

    const manufacturer = machineModels.find((m) => m.manufacturer)?.manufacturer ?? null;

    let created = 0;
    let skipped = 0;
    for (const acc of accessories) {
      if (!acc.selected || !acc.name?.trim()) continue;
      const exists = await prisma.accessory.findFirst({ where: { name: acc.name.trim() } });
      if (exists) {
        for (const modelId of modelIds) {
          const linked = await prisma.machineModelAccessory.findUnique({
            where: { machineModelId_accessoryId: { machineModelId: modelId, accessoryId: exists.id } },
          });
          if (!linked) {
            await prisma.machineModelAccessory.create({
              data: { machineModelId: modelId, accessoryId: exists.id },
            });
          }
        }
        skipped++;
        continue;
      }
      await prisma.accessory.create({
        data: {
          manufacturer: manufacturer || null,
          code: acc.code || undefined,
          name: acc.name.trim(),
          description: acc.articleNumber ? `Art.-Nr.: ${acc.articleNumber}` : undefined,
          hasSerialNumber: true,
          compatibleModels: {
            create: modelIds.map((id) => ({ machineModelId: id })),
          },
        },
      });
      created++;
    }

    const newModels = machineModels.filter((m) => m.selected && !m.existsAlready).length;
    res.json({
      created,
      skipped,
      newModels,
      message: `${newModels} Modelle + ${created} Zubehör-Artikel angelegt, ${skipped} bereits vorhanden (Verlinkung aktualisiert).`,
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Fehler beim Importieren.' });
  }
});

export default router;
