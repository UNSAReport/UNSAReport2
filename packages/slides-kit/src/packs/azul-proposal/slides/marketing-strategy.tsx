import type { CSSProperties } from 'react';
import backgroundDefault from '../../../assets/azul/asset-5ff18b4e.jpg';
import photoDefault from '../../../assets/azul/asset-f8cf59af.jpg';
import washLarge from '../../../assets/azul/asset-9249942d.webp';

export interface AzulMarketingStrategyProps {
  /** URL de imagen (default: asset de la plantilla) */
  backgroundSrc?: string;
  /** URL de imagen (default: asset de la plantilla) */
  photoSrc?: string;
  /** Título principal */
  title?: string;
  /** Párrafos de introducción (dos) */
  intro?: string[];
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

const INTRO_1 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
const INTRO_2 = "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

/**
 * Estrategia de marketing y ventas con foto lateral.
 */
export function AzulMarketingStrategy({
  backgroundSrc = backgroundDefault,
  photoSrc = photoDefault,
  title = "MARKETING & SALES STRATEGY",
  intro = [INTRO_1, INTRO_2],
}: AzulMarketingStrategyProps) {
  return (
    <div style={{ ...BG }}>
      <div style={{ position: "absolute", left: "0.0px", top: "0.0px", width: "1280.0px", height: "720.0px", overflow: "hidden" }}><img src={backgroundSrc} style={{ position: "absolute", left: "-91.9px", top: "-137.3px", width: "1410.3px", height: "939.6px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "111.3px", top: "190.8px", width: "610.2px", height: "153.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -1.9, marginBottom: 0, lineHeight: "76.0px", fontSize: "70.37px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "70.37px", fontWeight: 600, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "-4.15px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "111.3px", top: "360.4px", width: "499.4px", height: "175.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{intro[0]}</span></p><p style={{ textAlign: "left", marginTop: 0, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{intro[1]}</span></p></div>
      <img src={washLarge} style={{ position: "absolute", left: "-570.7px", top: "345.5px", width: "1114.2px", height: "950.1px" }} />
      <img src={washLarge} style={{ position: "absolute", left: "789.2px", top: "-540.8px", width: "1114.2px", height: "950.1px" }} />
      <div style={{ position: "absolute", left: "746.1px", top: "72.0px", width: "437.9px", height: "576.0px", overflow: "hidden" }}><img src={photoSrc} style={{ position: "absolute", left: "-263.1px", top: "0.0px", width: "964.1px", height: "576.0px", maxWidth: "none" }} /></div>
    </div>
  );
}
