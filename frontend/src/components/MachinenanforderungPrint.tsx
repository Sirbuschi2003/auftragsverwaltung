import { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { MachineRequest } from '../api/client';

interface Props {
  request: MachineRequest;
  onClose: () => void;
}

const STANDARD_ZUBEHOER = [
  'DADF/RADF',
  'Finisher',
  'Ablage (KK)',
  'Papier-\nKassette',
  'Papier-\nKassette',
  'Papier-\nKassette',
  'Desk',
  'Aktiver KD',
  'Faxmodul',
  'HDD',
  'Tastatur GR',
  'Speicher',
  '',
  '',
  '',
  'Toner',
];

const PRUFLISTE_LEFT = [
  'Belichtung - Vergrößerung/Verkleinerung/Foto',
  'Flächendeckung',
  'Kopfanfänge - Kassetten/Duplex/ADF',
  'Seitliche Ausrichtung - Kassetten/Duplex/ADF',
  'Ausleuchtung/Bildschärfe/Maßstab/Winkeligkeit',
  'Sauberkeit/Gehäusezustand',
  'Laufruhe',
  'Trommelspannungen / Doctorblade eingemessen',
  'Wartungs-Trommelzähler gelöscht',
  'A3 Doppelzählung aktiviert',
  'CNT-Brücke',
  'Firmwareupdate Maschine/Optionen',
  'Kundendaten gelöscht? HDD, E-Filing, Faxdaten,',
  'Adressbuch, Templates, Netzw, Sicherungsdateien',
  '',
  'PM - Liste gepflegt',
];

const PRUFLISTE_RIGHT = [
  'Faxfunktion senden/empfangen geprüft',
  'Druckfunktion / USB / Netzwerk geprüft',
  'Scanfunktion geprüft',
  '',
  'Faxdaten programmiert',
  'Druckertreiber / Software / CD / DVD',
  'Faxkabel',
  'Druckerkabel',
  'Netzkabel',
  'Bordkarte / RR-Aufkleber / Konfigurationskarte',
  'QR-Code',
  'Einstellung automatische Tonerbestellung per-Mail',
  'Einstellung Tonerbestellung telefonisch',
  'Aufkleber Tonerbestellung / Mail',
  '',
  '',
];

const S = '1px solid #333';
const SL = '1px solid #bbb';

function Cb() {
  return (
    <span style={{
      display: 'inline-block', width: 11, height: 11,
      border: S, verticalAlign: 'middle', flexShrink: 0,
    }} />
  );
}

const td = (
  content: React.ReactNode,
  style: React.CSSProperties = {},
  colSpan?: number,
) => (
  <td colSpan={colSpan} style={{ border: S, padding: '2px 4px', verticalAlign: 'top', fontSize: 9, ...style }}>
    {content}
  </td>
);

const ERSATZ_ROWS = 13;

export default function MachinenanforderungPrint({ request, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Maschinenanforderung ${request.requestNumber}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;font-size:9px;color:#000;background:#fff}
        @page{size:A4;margin:8mm}
        table{border-collapse:collapse;width:100%}
        td,th{border:1px solid #333;padding:2px 4px;font-size:9px;vertical-align:top}
        .page2{page-break-before:always}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style></head>
      <body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  const site = request.customerSite;
  const cust = request.customer;
  const model = request.machineModel;
  const date = new Date(request.createdAt).toLocaleDateString('de-DE');

  // request.accessories go into the left Ersatzteil table (pre-filled)
  const accs = request.accessories;
  const leftRows = ERSATZ_ROWS;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4 flex flex-col">

          {/* Modal-Kopf */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Maschinenanforderung</h2>
              <p className="text-xs text-gray-500">{request.requestNumber} · {cust.companyName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-primary" onClick={handlePrint}>
                <Printer className="w-4 h-4" /> Drucken
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Druckvorschau */}
          <div className="overflow-y-auto p-6 bg-gray-100">
            <div ref={printRef} style={{ background: '#fff', fontFamily: 'Arial, sans-serif', color: '#000', fontSize: 9 }}>

              {/* ══════════════════ SEITE 1 ══════════════════ */}
              <div style={{ width: '190mm', padding: '5mm' }}>

                {/* Zeile 1: Eingang / Lieferung / Toner */}
                <table style={{ marginBottom: 2 }}>
                  <tbody>
                    <tr>
                      <td style={{ border: S, padding: '2px 4px', width: '33%', fontWeight: 'bold', fontSize: 9 }}>
                        Eingang Technik<br /><span style={{ display: 'inline-block', height: 12 }} />
                      </td>
                      <td style={{ border: S, padding: '2px 4px', width: '33%', fontWeight: 'bold', fontSize: 9 }}>
                        Lieferung geplant<br /><span style={{ display: 'inline-block', height: 12 }} />
                      </td>
                      <td style={{ border: S, padding: '2px 4px', fontSize: 9 }}>
                        Tonerbestellung per Mail<br />
                        <span style={{ display: 'inline-block', marginTop: 2 }}><Cb /></span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Zeile 2: Anforderung Nr. / Weitere Systeme / Datum / Liefertermin */}
                <table style={{ marginBottom: 3 }}>
                  <tbody>
                    <tr>
                      <td style={{ border: S, padding: '3px 5px', width: '24%' }}>
                        <span style={{ fontWeight: 'bold', fontSize: 11 }}>Anforderung Nr.{request.requestNumber}</span>
                        <br /><span style={{ display: 'inline-block', height: 8 }} />
                      </td>
                      <td style={{ border: S, padding: '3px 5px', width: '18%' }}>
                        <span style={{ fontWeight: 'bold' }}>Weitere Systeme?</span>
                        <br /><Cb />
                      </td>
                      <td style={{ border: S, padding: '3px 5px', width: '30%' }}>
                        <span style={{ fontWeight: 'bold' }}>Anforderungsdatum :</span>
                        <br /><span>{date}</span>
                      </td>
                      <td style={{ border: S, padding: '3px 5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Liefertermin Vertrieb</span>
                        <br /><span style={{ display: 'inline-block', height: 8 }} />
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Hauptbereich 2 Spalten */}
                <table>
                  <tbody>
                    <tr style={{ verticalAlign: 'top' }}>

                      {/* ── LINKE SPALTE ── */}
                      <td style={{ border: S, padding: '4px 5px', width: '46%', verticalAlign: 'top' }}>

                        {/* Modell */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 3 }}>
                          <b>Modell:</b>
                          <span style={{ flex: 1, borderBottom: S, paddingBottom: 1 }}>{model.modelName}</span>
                        </div>
                        {/* Herkunft */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 3 }}>
                          <b>Herkunft :</b>
                          <span style={{ flex: 1, borderBottom: S, paddingBottom: 1 }} />
                        </div>
                        {/* Masch.-Nr. */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 3 }}>
                          <b>Masch.-Nr.:</b>
                          <span style={{ flex: 1, borderBottom: S, paddingBottom: 1 }}>{request.machineSerialNumber ?? ''}</span>
                        </div>

                        {/* Kunde */}
                        <div style={{ marginBottom: 3 }}>
                          <b>Kunde :</b>
                          {[cust.companyName, site.street, `${site.zip} ${site.city}`, site.contactPerson ?? ''].map((line, i) => (
                            <div key={i} style={{ borderBottom: S, minHeight: 14, paddingLeft: 2, marginTop: 1 }}>{line}</div>
                          ))}
                        </div>

                        {/* Tel. */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 3 }}>
                          <b>Tel.:</b>
                          <span style={{ flex: 1, borderBottom: S, paddingBottom: 1 }}>{cust.phone ?? ''}</span>
                        </div>
                        {/* Rücknahme */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 6 }}>
                          <b>Rücknahme Modell:</b>
                          <span style={{ flex: 1, borderBottom: S, paddingBottom: 1 }} />
                        </div>

                        {/* Zähler */}
                        <table style={{ marginBottom: 5, fontSize: 9 }}>
                          <tbody>
                            <tr>
                              <td colSpan={2} style={{ border: SL, padding: '2px 3px', fontWeight: 'bold' }}>Gesamt - Zähler ALT:</td>
                            </tr>
                            <tr>
                              <td style={{ border: SL, padding: '2px 3px', width: '50%' }}><b>Schwarz ALT:</b></td>
                              <td style={{ border: SL, padding: '2px 3px' }}><b>Farbe ALT:</b></td>
                            </tr>
                            <tr>
                              <td colSpan={2} style={{ border: SL, padding: '2px 3px', fontWeight: 'bold' }}>Gesamt - Zähler NEU:</td>
                            </tr>
                            <tr>
                              <td style={{ border: SL, padding: '2px 3px' }}><b>Schwarz NEU:</b></td>
                              <td style={{ border: SL, padding: '2px 3px' }}><b>Farbe Neu:</b></td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Ersatzteil-Tabelle links – vorausgefüllt mit Zubehör aus dem Auftrag */}
                        <table style={{ fontSize: 9 }}>
                          <thead>
                            <tr>
                              <th style={{ border: S, padding: '2px 3px', width: '15%' }}>Menge</th>
                              <th style={{ border: S, padding: '2px 3px' }}>Ersatzteil</th>
                              <th style={{ border: S, padding: '2px 3px', width: '28%' }}>Artikel-Nr.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: leftRows }).map((_, i) => {
                              const a = accs[i];
                              return (
                                <tr key={i}>
                                  <td style={{ border: S, padding: '2px 3px', height: 14 }}>{a ? a.quantity : ''}</td>
                                  <td style={{ border: S, padding: '2px 3px', height: 14 }}>
                                    {a ? `${a.accessory.code ? a.accessory.code + ' ' : ''}${a.accessory.name}` : ''}
                                  </td>
                                  <td style={{ border: S, padding: '2px 3px', height: 14 }}>{a?.serialNumber ?? ''}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </td>

                      {/* ── RECHTE SPALTE ── */}
                      <td style={{ border: S, padding: '4px 5px', verticalAlign: 'top' }}>

                        {/* V.-Beginn / Verkauft / KD.NR / geprüft */}
                        <table style={{ marginBottom: 4, fontSize: 9 }}>
                          <tbody>
                            <tr>
                              <td style={{ border: SL, padding: '2px 3px', width: '65%' }}>
                                <b>Verkauft :</b>&nbsp;
                                <span style={{ borderBottom: SL, display: 'inline-block', width: 50 }} />
                              </td>
                              <td style={{ border: SL, padding: '2px 3px' }}><b>V.-Beginn</b></td>
                            </tr>
                            <tr>
                              <td style={{ border: SL, padding: '2px 3px' }}><b>geprüft:</b></td>
                              <td style={{ border: SL, padding: '2px 3px' }}><b>KD.NR:</b> {cust.customerNumber}</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Checkboxen */}
                        {[
                          ['Rebuild', 'Kopierfähig', 'Neuinstal.'],
                          ['Kauf :', 'CA :', 'Vorführung:'],
                          ['Miete:', 'CP :', 'Probestellung:'],
                        ].map((row, ri) => (
                          <div key={ri} style={{ display: 'flex', gap: 14, marginBottom: 4, alignItems: 'center' }}>
                            {row.map((l) => (
                              <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 'bold', fontSize: 9 }}>
                                {l} <Cb />
                              </span>
                            ))}
                          </div>
                        ))}

                        {/* Zubehör-Tabelle – Standard-Liste, leer (manuell ausfüllen) */}
                        <table style={{ fontSize: 9, marginBottom: 4 }}>
                          <thead>
                            <tr>
                              <th style={{ border: S, padding: '2px 3px', width: '32%', fontWeight: 'bold' }}>Zubehör:</th>
                              <th style={{ border: S, padding: '2px 3px', fontWeight: 'bold' }}>TYP/Modell</th>
                              <th style={{ border: S, padding: '2px 3px', fontWeight: 'bold' }}>Maschinenummer</th>
                            </tr>
                          </thead>
                          <tbody>
                            {STANDARD_ZUBEHOER.map((label, i) => (
                              <tr key={i}>
                                <td style={{ border: S, padding: '1px 3px', height: 13 }}>
                                  {label && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'pre-line', fontSize: 8 }}>
                                      <span style={{ fontSize: 8 }}>{label}</span>&nbsp;<Cb />
                                    </span>
                                  )}
                                </td>
                                <td style={{ border: S, padding: '1px 3px', height: 13 }} />
                                <td style={{ border: S, padding: '1px 3px', height: 13 }} />
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Technikünterstützung */}
                        <div style={{ fontSize: 9, marginBottom: 2 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <b>Technikünterstützung für Installation erforderlich</b>&nbsp;<Cb />
                          </span>
                        </div>
                        <div style={{ fontSize: 9, marginBottom: 2 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            gegen Berechnung laut Vertrag und Anlage/n&nbsp;<Cb />
                          </span>
                        </div>
                        <div style={{ fontSize: 9, marginBottom: 5 }}>
                          ohne Berechnung laut Vertrag bis zu&nbsp;
                          <span style={{ borderBottom: S, display: 'inline-block', width: 30 }} />&nbsp;Stunden
                        </div>

                        {/* Ersatzteil-Tabelle rechts – leer, manuell */}
                        <table style={{ fontSize: 9 }}>
                          <thead>
                            <tr>
                              <th style={{ border: S, padding: '2px 3px', width: '15%' }}>Menge</th>
                              <th style={{ border: S, padding: '2px 3px' }}>Ersatzteil</th>
                              <th style={{ border: S, padding: '2px 3px', width: '28%' }}>Artikel-Nr.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 10 }).map((_, i) => (
                              <tr key={i}>
                                <td style={{ border: S, padding: '2px 3px', height: 14 }} />
                                <td style={{ border: S, padding: '2px 3px', height: 14 }} />
                                <td style={{ border: S, padding: '2px 3px', height: 14 }} />
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ══════════════════ SEITE 2 ══════════════════ */}
              <div className="page2" style={{ width: '190mm', padding: '5mm', pageBreakBefore: 'always' }}>

                {/* Fax-Box */}
                <table style={{ marginBottom: 4, fontSize: 9 }}>
                  <tbody>
                    <tr>
                      <td style={{ border: S, padding: '3px 5px', width: '50%' }}>
                        <b>Faxnummer:</b>&nbsp;
                        <span style={{ borderBottom: S, display: 'inline-block', width: 80 }} />
                      </td>
                      <td style={{ border: S, padding: '3px 5px' }}>
                        <b>Kopfzeile:</b>&nbsp;
                        <span style={{ borderBottom: S, display: 'inline-block', width: 100 }} />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ border: S, padding: '3px 5px' }}>
                        <span style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 8, flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>Hauptanschluß <Cb /></span>
                          <span>Amtsholung: <span style={{ borderBottom: S, display: 'inline-block', width: 40 }} /></span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>TAE <Cb /></span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>Western <Cb /></span>
                          <span>Sendebericht: <span style={{ borderBottom: S, display: 'inline-block', width: 35 }} /></span>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Fortsetzung Ersatzteile */}
                <table style={{ marginBottom: 1, fontSize: 9 }}>
                  <thead>
                    <tr>
                      <th colSpan={6} style={{ border: S, padding: '3px 5px', background: '#f0f0f0', textAlign: 'left', fontWeight: 'bold', fontSize: 10 }}>
                        Fortsetzung Ersatzteile
                      </th>
                    </tr>
                    <tr>
                      <th style={{ border: S, padding: '2px 3px', width: '7%' }}>Menge</th>
                      <th style={{ border: S, padding: '2px 3px', width: '30%' }}>Ersatzteil</th>
                      <th style={{ border: S, padding: '2px 3px', width: '13%' }}>Artikelnummer</th>
                      <th style={{ border: S, padding: '2px 3px', width: '7%' }}>Menge</th>
                      <th style={{ border: S, padding: '2px 3px', width: '30%' }}>Ersatzteil</th>
                      <th style={{ border: S, padding: '2px 3px' }}>Artikelnummer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <tr key={i}>
                        {[0, 1, 2, 3, 4, 5].map((c) => (
                          <td key={c} style={{ border: S, padding: '2px 3px', height: 15 }} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Prüfliste */}
                <table style={{ marginBottom: 4, fontSize: 9 }}>
                  <thead>
                    <tr>
                      <th colSpan={4} style={{ border: S, padding: '3px 5px', background: '#f0f0f0', textAlign: 'left', fontWeight: 'bold', fontSize: 10 }}>
                        Prüfliste - Vom Techniker auszufüllen
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRUFLISTE_LEFT.map((item, i) => (
                      <tr key={i}>
                        <td style={{ border: SL, padding: '2px 4px', height: 15, width: '43%' }}>
                          {item && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 9, fontWeight: item.startsWith('Kundendaten') ? 'bold' : 'normal' }}>{item}</span>
                            </span>
                          )}
                        </td>
                        <td style={{ border: SL, padding: '2px 4px', height: 15, width: '7%', textAlign: 'center' }}>
                          {item && <Cb />}
                        </td>
                        <td style={{ border: SL, padding: '2px 4px', height: 15, width: '43%' }}>
                          {PRUFLISTE_RIGHT[i] && <span style={{ fontSize: 9 }}>{PRUFLISTE_RIGHT[i]}</span>}
                        </td>
                        <td style={{ border: SL, padding: '2px 4px', height: 15, width: '7%', textAlign: 'center' }}>
                          {PRUFLISTE_RIGHT[i] && <Cb />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Datum / Einheiten */}
                <table style={{ fontSize: 9, marginBottom: 4 }}>
                  <tbody>
                    {[
                      ['Fertigstellung und Prüfliste abgearbeitet.', true],
                      ['Techniker/Datum', true],
                      ['', false],
                      ['', false],
                    ].map(([label, bold], i) => (
                      <tr key={i}>
                        <td style={{ border: SL, padding: '2px 5px', width: '12%' }}><b>Datum:</b></td>
                        <td style={{ border: SL, padding: '2px 5px', width: '26%' }} />
                        <td style={{ border: SL, padding: '2px 5px', width: '12%' }}><b>Einheiten</b></td>
                        <td style={{ border: SL, padding: '2px 5px' }}>
                          {label && <span style={{ fontWeight: bold ? 'bold' : 'normal' }}>{label as string}</span>}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2} style={{ border: SL, padding: '2px 5px', fontWeight: 'bold' }}>Zeit Gesammt (Einheiten)</td>
                      <td colSpan={2} style={{ border: SL, padding: '2px 5px' }} />
                    </tr>
                  </tbody>
                </table>

                {/* Abnahme / Netzwerkanalyse */}
                <table style={{ fontSize: 9 }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '2px solid #333', padding: '10px 5px', fontWeight: 'bold', width: '45%' }}>
                        Abnahme: Datum, Unterschrift
                      </td>
                      <td style={{ border: '2px solid #333', padding: '4px 5px' }}>
                        <b>Netzwerkanalysebogen vorhanden: Ja</b>&nbsp;<Cb />&nbsp;&nbsp;
                        <b>Nein</b>&nbsp;<Cb />
                      </td>
                    </tr>
                  </tbody>
                </table>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
