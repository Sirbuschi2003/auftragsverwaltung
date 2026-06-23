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
  'Papier-Kassette',
  'Papier-Kassette',
  'Papier-Kassette',
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
  'Belichtung – Vergrößerung/Verkleinerung/Foto',
  'Flächendeckung',
  'Kopfanfänge – Kassetten/Duplex/ADF',
  'Seitliche Ausrichtung – Kassetten/Duplex/ADF',
  'Ausleuchtung/Bildschärfe/Maßstab/Winkeligkeit',
  'Sauberkeit/Gehäusezustand',
  'Laufruhe',
  'Trommelspannungen / Doctorblade eingemessen',
  'Wartungs-Trommelzähler gelöscht',
  'A3 Doppelzählung aktiviert',
  'CNT-Brücke',
  'Firmwareupdate Maschine/Optionen',
  'Kundendaten gelöscht? HDD, E-Filing, Faxdaten, Einstellung',
  'Adressbuch, Templates, Netzw, Sicherungsdateien',
  'PM-Liste gepflegt',
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
];

function Checkbox({ label, checked = false, bold = false }: { label?: string; checked?: boolean; bold?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] ${bold ? 'font-bold' : ''}`}>
      <span style={{
        display: 'inline-block', width: 12, height: 12,
        border: '1px solid #333', flexShrink: 0,
        backgroundColor: checked ? '#222' : 'white',
      }} />
      {label && <span>{label}</span>}
    </span>
  );
}

function Field({ label, value, width = 'auto' }: { label: string; value?: string; width?: string }) {
  return (
    <div style={{ width }} className="text-[10px]">
      <span className="font-bold">{label}</span>
      <div style={{ borderBottom: '1px solid #333', minHeight: 16, marginTop: 1 }}>
        {value && <span className="text-[11px]">{value}</span>}
      </div>
    </div>
  );
}

function Row({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex gap-3 items-start ${className}`}>{children}</div>;
}

export default function MachinenanforderungPrint({ request, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Maschinenanforderung ${request.requestNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 10px; color: #000; background: white; }
          @page { size: A4; margin: 10mm; }
          .page { width: 190mm; min-height: 277mm; padding: 0; }
          .page-break { page-break-after: always; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #333; padding: 2px 4px; font-size: 9px; vertical-align: top; }
          .no-border td, .no-border th { border: none; }
          .bold { font-weight: bold; }
          .section-header { background: #e8e8e8; font-weight: bold; font-size: 10px; }
          .checkbox-box { display: inline-block; width: 11px; height: 11px; border: 1px solid #333; vertical-align: middle; }
          .underline-field { border-bottom: 1px solid #333; min-height: 14px; display: inline-block; }
          .label { font-weight: bold; white-space: nowrap; }
          .small { font-size: 8px; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  const site = request.customerSite;
  const customer = request.customer;
  const model = request.machineModel;
  const date = new Date(request.createdAt).toLocaleDateString('de-DE');

  // Map request accessories to standard Zubehör rows
  const accNames = request.accessories.map((a) => a.accessory.name.toLowerCase());
  const matchStd = (label: string) => {
    if (!label) return false;
    return accNames.some((n) => n.includes(label.toLowerCase().split(/[\s/]/)[0].toLowerCase()));
  };

  // Remaining accessories (not matched to standard list) go into ersatzteil table
  const ersatzteile = request.accessories.map((a) => ({
    menge: String(a.quantity),
    name: `${a.accessory.code ? a.accessory.code + ' ' : ''}${a.accessory.name}`,
    artikelNr: a.serialNumber ?? '',
  }));

  return (
    <>
      {/* Preview modal */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4 flex flex-col">
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Maschinenanforderung</h2>
              <p className="text-xs text-gray-500">{request.requestNumber} · {customer.companyName}</p>
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

          {/* Print preview */}
          <div className="overflow-y-auto p-6 bg-gray-100">
            <div ref={printRef} style={{ background: 'white' }}>

              {/* ═══════════════════════════════════════════════════════ PAGE 1 ═══ */}
              <div style={{ width: '190mm', padding: '6mm', fontFamily: 'Arial, sans-serif', fontSize: 10, color: '#000' }}>

                {/* Top header row */}
                <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 3 }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #333', padding: '3px 5px', width: '28%', fontWeight: 'bold', fontSize: 10 }}>
                        Eingang Technik
                      </td>
                      <td style={{ border: '1px solid #333', padding: '3px 5px', width: '28%', fontWeight: 'bold', fontSize: 10 }}>
                        Lieferung geplant
                      </td>
                      <td style={{ border: '1px solid #333', padding: '3px 5px', fontSize: 10 }}>
                        Tonerbestellung per Mail &nbsp;
                        <span style={{ display: 'inline-block', width: 11, height: 11, border: '1px solid #333', verticalAlign: 'middle' }} />
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Anforderung Nr. row */}
                <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 3 }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #333', padding: '3px 5px', width: '22%' }}>
                        <span style={{ fontWeight: 'bold', fontSize: 11 }}>Anforderung Nr. {request.requestNumber}</span>
                      </td>
                      <td style={{ border: '1px solid #333', padding: '3px 5px', width: '18%' }}>
                        <span style={{ fontWeight: 'bold' }}>Weitere Systeme?</span>&nbsp;
                        <span style={{ display: 'inline-block', width: 14, height: 14, border: '1px solid #333', verticalAlign: 'middle' }} />
                      </td>
                      <td style={{ border: '1px solid #333', padding: '3px 5px', width: '30%' }}>
                        <span style={{ fontWeight: 'bold' }}>Anforderungsdatum:</span>&nbsp;
                        <span>{date}</span>
                      </td>
                      <td style={{ border: '1px solid #333', padding: '3px 5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Liefertermin Vertrieb</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Main two-column layout */}
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <tbody>
                    <tr>
                      {/* LEFT COLUMN */}
                      <td style={{ border: '1px solid #333', padding: '4px 5px', width: '48%', verticalAlign: 'top' }}>
                        <div style={{ marginBottom: 5 }}>
                          <span style={{ fontWeight: 'bold' }}>Modell: </span>
                          <span style={{ borderBottom: '1px solid #333', display: 'inline-block', minWidth: 120 }}>{model.modelName}</span>
                        </div>
                        <div style={{ marginBottom: 5 }}>
                          <span style={{ fontWeight: 'bold' }}>Herkunft: </span>
                          <span style={{ borderBottom: '1px solid #333', display: 'inline-block', minWidth: 140 }} />
                        </div>
                        <div style={{ marginBottom: 5 }}>
                          <span style={{ fontWeight: 'bold' }}>Masch.-Nr.: </span>
                          <span style={{ borderBottom: '1px solid #333', display: 'inline-block', minWidth: 120 }}>
                            {request.machineSerialNumber ?? ''}
                          </span>
                        </div>

                        {/* Kunde block */}
                        <div style={{ marginBottom: 5 }}>
                          <div><span style={{ fontWeight: 'bold' }}>Kunde: </span></div>
                          <div style={{ borderBottom: '1px solid #333', minHeight: 14, paddingLeft: 4 }}>{customer.companyName}</div>
                          <div style={{ borderBottom: '1px solid #333', minHeight: 14, paddingLeft: 4 }}>{site.street}</div>
                          <div style={{ borderBottom: '1px solid #333', minHeight: 14, paddingLeft: 4 }}>{site.zip} {site.city}</div>
                          <div style={{ borderBottom: '1px solid #333', minHeight: 14, paddingLeft: 4 }}>{site.contactPerson ?? ''}</div>
                        </div>

                        <div style={{ marginBottom: 5 }}>
                          <span style={{ fontWeight: 'bold' }}>Tel.: </span>
                          <span style={{ borderBottom: '1px solid #333', display: 'inline-block', minWidth: 130 }}>{customer.phone ?? ''}</span>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontWeight: 'bold' }}>Rücknahme Modell: </span>
                          <span style={{ borderBottom: '1px solid #333', display: 'inline-block', minWidth: 100 }} />
                        </div>

                        {/* Zähler */}
                        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 6, fontSize: 9 }}>
                          <tbody>
                            <tr>
                              <td style={{ border: '1px solid #888', padding: '2px 3px', fontWeight: 'bold' }} colSpan={2}>Gesamt-Zähler ALT:</td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid #888', padding: '2px 3px' }}><span style={{ fontWeight: 'bold' }}>Schwarz ALT:</span></td>
                              <td style={{ border: '1px solid #888', padding: '2px 3px' }}><span style={{ fontWeight: 'bold' }}>Farbe ALT:</span></td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid #888', padding: '2px 3px', fontWeight: 'bold' }} colSpan={2}>Gesamt-Zähler NEU:</td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid #888', padding: '2px 3px' }}><span style={{ fontWeight: 'bold' }}>Schwarz NEU:</span></td>
                              <td style={{ border: '1px solid #888', padding: '2px 3px' }}><span style={{ fontWeight: 'bold' }}>Farbe NEU:</span></td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Ersatzteil Tabelle links */}
                        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 9 }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1px solid #333', padding: '2px 3px', width: '18%' }}>Menge</th>
                              <th style={{ border: '1px solid #333', padding: '2px 3px' }}>Ersatzteil</th>
                              <th style={{ border: '1px solid #333', padding: '2px 3px', width: '28%' }}>Artikel-Nr.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 12 }).map((_, i) => (
                              <tr key={i}>
                                <td style={{ border: '1px solid #333', padding: '2px 3px', height: 14 }}>{ersatzteile[i]?.menge ?? ''}</td>
                                <td style={{ border: '1px solid #333', padding: '2px 3px', height: 14 }}>{ersatzteile[i]?.name ?? ''}</td>
                                <td style={{ border: '1px solid #333', padding: '2px 3px', height: 14 }}>{ersatzteile[i]?.artikelNr ?? ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>

                      {/* RIGHT COLUMN */}
                      <td style={{ border: '1px solid #333', padding: '4px 5px', verticalAlign: 'top' }}>

                        {/* V.-Beginn / Verkauft / KD.NR / geprüft */}
                        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 5, fontSize: 9 }}>
                          <tbody>
                            <tr>
                              <td style={{ border: '1px solid #888', padding: '2px 3px', width: '60%' }}>
                                <span style={{ fontWeight: 'bold' }}>Verkauft:</span>
                                <span style={{ borderBottom: '1px solid #888', display: 'inline-block', width: 60 }} />
                              </td>
                              <td style={{ border: '1px solid #888', padding: '2px 3px' }}>
                                <span style={{ fontWeight: 'bold' }}>V.-Beginn:</span>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid #888', padding: '2px 3px' }}>
                                <span style={{ fontWeight: 'bold' }}>geprüft:</span>
                              </td>
                              <td style={{ border: '1px solid #888', padding: '2px 3px' }}>
                                <span style={{ fontWeight: 'bold' }}>KD.NR:</span> {customer.customerNumber}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Checkboxen Zeile 1 */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 4, fontSize: 10 }}>
                          {['Rebuild', 'Kopierfähig', 'Neuinstal.'].map((l) => (
                            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ display: 'inline-block', width: 12, height: 12, border: '1px solid #333', flexShrink: 0 }} />
                              <span style={{ fontWeight: 'bold' }}>{l}</span>
                            </span>
                          ))}
                        </div>

                        {/* Checkboxen Zeile 2 */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 4, fontSize: 10 }}>
                          {['Kauf', 'CA', 'Vorführung'].map((l) => (
                            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ display: 'inline-block', width: 12, height: 12, border: '1px solid #333', flexShrink: 0 }} />
                              <span style={{ fontWeight: 'bold' }}>{l}:</span>
                            </span>
                          ))}
                        </div>

                        {/* Checkboxen Zeile 3 */}
                        <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 10 }}>
                          {['Miete', 'CP', 'Probestellung'].map((l) => (
                            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ display: 'inline-block', width: 12, height: 12, border: '1px solid #333', flexShrink: 0 }} />
                              <span style={{ fontWeight: 'bold' }}>{l}:</span>
                            </span>
                          ))}
                        </div>

                        {/* Zubehör Tabelle */}
                        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 9, marginBottom: 5 }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1px solid #333', padding: '2px 3px', width: '38%', fontWeight: 'bold' }}>Zubehör</th>
                              <th style={{ border: '1px solid #333', padding: '2px 3px', fontWeight: 'bold' }}>TYP/Modell</th>
                              <th style={{ border: '1px solid #333', padding: '2px 3px', fontWeight: 'bold' }}>Masch.-Nr.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {STANDARD_ZUBEHOER.map((label, i) => {
                              const checked = label ? matchStd(label) : false;
                              const matchedAcc = label ? request.accessories.find((a) =>
                                a.accessory.name.toLowerCase().includes(label.toLowerCase().split(/[\s/]/)[0].toLowerCase())
                              ) : undefined;
                              return (
                                <tr key={i}>
                                  <td style={{ border: '1px solid #333', padding: '2px 3px', height: 13 }}>
                                    {label && (
                                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <span style={{
                                          display: 'inline-block', width: 10, height: 10,
                                          border: '1px solid #333', flexShrink: 0,
                                          backgroundColor: checked ? '#333' : 'white',
                                        }} />
                                        <span style={{ fontSize: 8 }}>{label}</span>
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ border: '1px solid #333', padding: '2px 3px', height: 13, fontSize: 8 }}>
                                    {matchedAcc?.accessory.code ?? ''}
                                  </td>
                                  <td style={{ border: '1px solid #333', padding: '2px 3px', height: 13, fontSize: 8 }}>
                                    {matchedAcc?.serialNumber ?? ''}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* Technikunterstützung */}
                        <div style={{ fontSize: 9, marginBottom: 3 }}>
                          <span style={{ display: 'inline-block', width: 11, height: 11, border: '1px solid #333', verticalAlign: 'middle' }} />
                          &nbsp;<span style={{ fontWeight: 'bold' }}>Technikünterstützung für Installation erforderlich</span>
                        </div>
                        <div style={{ fontSize: 9, marginBottom: 3 }}>
                          <span style={{ display: 'inline-block', width: 11, height: 11, border: '1px solid #333', verticalAlign: 'middle' }} />
                          &nbsp;gegen Berechnung laut Vertrag und Anlage/n
                        </div>
                        <div style={{ fontSize: 9, marginBottom: 6 }}>
                          ohne Berechnung laut Vertrag bis zu&nbsp;
                          <span style={{ borderBottom: '1px solid #333', display: 'inline-block', width: 30 }} />&nbsp;Stunden
                        </div>

                        {/* Ersatzteil Tabelle rechts */}
                        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 9 }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1px solid #333', padding: '2px 3px', width: '18%' }}>Menge</th>
                              <th style={{ border: '1px solid #333', padding: '2px 3px' }}>Ersatzteil</th>
                              <th style={{ border: '1px solid #333', padding: '2px 3px', width: '28%' }}>Artikel-Nr.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 8 }).map((_, i) => {
                              const idx = i + 12;
                              return (
                                <tr key={i}>
                                  <td style={{ border: '1px solid #333', padding: '2px 3px', height: 14 }}>{ersatzteile[idx]?.menge ?? ''}</td>
                                  <td style={{ border: '1px solid #333', padding: '2px 3px', height: 14 }}>{ersatzteile[idx]?.name ?? ''}</td>
                                  <td style={{ border: '1px solid #333', padding: '2px 3px', height: 14 }}>{ersatzteile[idx]?.artikelNr ?? ''}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* Fax */}
                        <div style={{ marginTop: 6, borderTop: '1px solid #333', paddingTop: 4 }}>
                          <div style={{ display: 'flex', gap: 10, fontSize: 9, marginBottom: 3 }}>
                            <span><span style={{ fontWeight: 'bold' }}>Faxnummer:</span> <span style={{ borderBottom: '1px solid #333', display: 'inline-block', width: 70 }} /></span>
                            <span><span style={{ fontWeight: 'bold' }}>Kopfzeile:</span> <span style={{ borderBottom: '1px solid #333', display: 'inline-block', width: 70 }} /></span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, fontSize: 8 }}>
                            <span>Hauptanschluss <span style={{ display: 'inline-block', width: 10, height: 10, border: '1px solid #333', verticalAlign: 'middle' }} /></span>
                            <span>Amtsholung: <span style={{ borderBottom: '1px solid #333', display: 'inline-block', width: 40 }} /></span>
                            <span>TAE <span style={{ display: 'inline-block', width: 10, height: 10, border: '1px solid #333', verticalAlign: 'middle' }} /></span>
                            <span>Western <span style={{ display: 'inline-block', width: 10, height: 10, border: '1px solid #333', verticalAlign: 'middle' }} /></span>
                            <span>Sendebericht: <span style={{ borderBottom: '1px solid #333', display: 'inline-block', width: 30 }} /></span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ═══════════════════════════════════════════════════════ PAGE 2 ═══ */}
              <div style={{ width: '190mm', padding: '6mm', fontFamily: 'Arial, sans-serif', fontSize: 10, color: '#000', pageBreakBefore: 'always' }}>

                {/* Kopfzeile Seite 2 */}
                <div style={{ textAlign: 'right', fontSize: 9, marginBottom: 4 }}>
                  Anforderung Nr. {request.requestNumber} · {customer.companyName} · {model.modelName}
                </div>

                {/* Fortsetzung Ersatzteile */}
                <div style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 3, borderBottom: '2px solid #333' }}>
                  Fortsetzung Ersatzteile
                </div>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 9, marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #333', padding: '2px 3px', width: '10%' }}>Menge</th>
                      <th style={{ border: '1px solid #333', padding: '2px 3px', width: '35%' }}>Ersatzteil</th>
                      <th style={{ border: '1px solid #333', padding: '2px 3px', width: '20%' }}>Artikelnummer</th>
                      <th style={{ border: '1px solid #333', padding: '2px 3px', width: '10%' }}>Menge</th>
                      <th style={{ border: '1px solid #333', padding: '2px 3px', width: '35%' }}>Ersatzteil</th>
                      <th style={{ border: '1px solid #333', padding: '2px 3px', width: '20%' }}>Artikelnummer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <tr key={i}>
                        {[0, 1].map((col) => {
                          const idx = i + (col * 12) + 20;
                          return (
                            <>
                              <td key={`${i}-${col}-m`} style={{ border: '1px solid #333', padding: '2px 3px', height: 14 }}>{ersatzteile[idx]?.menge ?? ''}</td>
                              <td key={`${i}-${col}-n`} style={{ border: '1px solid #333', padding: '2px 3px', height: 14 }}>{ersatzteile[idx]?.name ?? ''}</td>
                              <td key={`${i}-${col}-a`} style={{ border: '1px solid #333', padding: '2px 3px', height: 14 }}>{ersatzteile[idx]?.artikelNr ?? ''}</td>
                            </>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Prüfliste */}
                <div style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 3, borderBottom: '2px solid #333' }}>
                  Prüfliste – Vom Techniker auszufüllen
                </div>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 9, marginBottom: 8 }}>
                  <tbody>
                    {PRUFLISTE_LEFT.map((item, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid #ccc', padding: '2px 4px', height: 14, width: '43%' }}>
                          {item && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ display: 'inline-block', width: 10, height: 10, border: '1px solid #333', flexShrink: 0 }} />
                              <span style={{ fontWeight: item.includes('gelöscht') ? 'bold' : 'normal' }}>{item}</span>
                            </span>
                          )}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '2px 4px', height: 14 }}>
                          {PRUFLISTE_RIGHT[i] && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ display: 'inline-block', width: 10, height: 10, border: '1px solid #333', flexShrink: 0 }} />
                              <span>{PRUFLISTE_RIGHT[i]}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Datum / Einheiten */}
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 9, marginBottom: 5 }}>
                  <tbody>
                    {['', '', '', ''].map((_, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid #888', padding: '2px 5px', width: '15%' }}>Datum:</td>
                        <td style={{ border: '1px solid #888', padding: '2px 5px', width: '30%' }} />
                        <td style={{ border: '1px solid #888', padding: '2px 5px', width: '15%' }}>Einheiten</td>
                        <td style={{ border: '1px solid #888', padding: '2px 5px' }}>
                          {i === 0 && <strong>Fertigstellung und Prüfliste abgearbeitet.</strong>}
                          {i === 1 && <strong>Techniker/Datum</strong>}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2} style={{ border: '1px solid #888', padding: '2px 5px', fontWeight: 'bold' }}>Zeit Gesamt (Einheiten)</td>
                      <td colSpan={2} style={{ border: '1px solid #888', padding: '2px 5px' }} />
                    </tr>
                  </tbody>
                </table>

                {/* Abnahme / Netzwerkanalyse */}
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 9 }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '2px solid #333', padding: '4px 5px', fontWeight: 'bold', width: '50%' }}>
                        Abnahme: Datum, Unterschrift
                      </td>
                      <td style={{ border: '2px solid #333', padding: '4px 5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Netzwerkanalysebogen vorhanden:</span>&nbsp;
                        Ja <span style={{ display: 'inline-block', width: 12, height: 12, border: '1px solid #333', verticalAlign: 'middle' }} />&nbsp;
                        <span style={{ fontWeight: 'bold' }}>Nein</span> <span style={{ display: 'inline-block', width: 12, height: 12, border: '1px solid #333', verticalAlign: 'middle' }} />
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

// Suppress unused variable warnings for the simple helper components
void Checkbox;
void Field;
void Row;
