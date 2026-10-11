import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '../../assets';

const backgroundDefault = getTemplateAssetUrl('azul-proposal', 'asset-5ff18b4e.jpg');
const photoDefault = getTemplateAssetUrl('azul-proposal', 'asset-314fe974.jpg');

export interface AzulMarketOpportunityItem {
  /** Numeral del punto (ej: "01") */
  numeral: string;
  /** Párrafo del punto */
  body: string;
}

export interface AzulMarketOpportunityProps {
  /** URL de imagen (default: asset de la plantilla) */
  backgroundSrc?: string;
  /** URL de imagen (default: asset de la plantilla) */
  photoSrc?: string;
  /** Título principal */
  title?: string;
  /** Puntos de oportunidad con numeral y párrafo */
  items?: AzulMarketOpportunityItem[];
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

const LOREM_BODY = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

/**
 * Oportunidad de mercado con numerales 01/02 y foto lateral.
 */
export function AzulMarketOpportunity({
  backgroundSrc = backgroundDefault,
  photoSrc = photoDefault,
  title = "MARKET OPPORTUNITY",
  items = [
    { numeral: "01", body: LOREM_BODY },
    { numeral: "02", body: LOREM_BODY },
  ],
}: AzulMarketOpportunityProps) {
  return (
    <div style={{ ...BG }}>
      <div style={{ position: "absolute", left: "0.0px", top: "0.0px", width: "1280.0px", height: "720.0px", overflow: "hidden" }}><img src={backgroundSrc} style={{ position: "absolute", left: "-91.9px", top: "-137.3px", width: "1410.3px", height: "939.6px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "-570.7px", top: "345.5px", width: "1114.2px", height: "950.1px", background: "radial-gradient(ellipse at center, rgba(24, 80, 121, 0.35) 0%, rgba(56, 133, 171, 0.2) 50%, rgba(251, 246, 241, 0) 75%)", filter: "blur(50px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "789.2px", top: "-540.8px", width: "1114.2px", height: "950.1px", background: "radial-gradient(ellipse at center, rgba(24, 80, 121, 0.35) 0%, rgba(56, 133, 171, 0.2) 50%, rgba(251, 246, 241, 0) 75%)", filter: "blur(50px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "746.1px", top: "72.0px", width: "437.9px", height: "576.0px", overflow: "hidden" }}><img src={photoSrc} style={{ position: "absolute", left: "-539.0px", top: "0.0px", width: "1515.9px", height: "576.0px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "98.7px", top: "147.8px", width: "471.6px", height: "153.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -1.9, marginBottom: 0, lineHeight: "76.0px", fontSize: "70.37px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "70.37px", fontWeight: 600, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "-4.15px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "98.7px", top: "351.5px", width: "109.0px", height: "59.1px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -1.44, marginBottom: 0, lineHeight: "57.6px", fontSize: "53.33px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "53.33px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "-3.15px" }}>{items[0].numeral}</span></p></div>
      <div style={{ position: "absolute", left: "98.7px", top: "498.3px", width: "109.0px", height: "59.1px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -1.44, marginBottom: 0, lineHeight: "57.6px", fontSize: "53.33px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "53.33px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "-3.15px" }}>{items[1].numeral}</span></p></div>
      <div style={{ position: "absolute", left: "228.6px", top: "330.6px", width: "404.0px", height: "109.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{items[0].body}</span></p></div>
      <div style={{ position: "absolute", left: "228.6px", top: "469.4px", width: "404.0px", height: "109.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{items[1].body}</span></p></div>
    </div>
  );
}
