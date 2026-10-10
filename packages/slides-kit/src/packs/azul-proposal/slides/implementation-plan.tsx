import type { CSSProperties } from 'react';
import backgroundDefault from '../../../assets/azul/asset-5ff18b4e.jpg';
import photoDefault from '../../../assets/azul/asset-77383254.jpg';
import washLarge from '../../../assets/azul/asset-9249942d.webp';

export interface AzulImplementationPlanProps {
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
 * Plan de implementación centrado.
 */
export function AzulImplementationPlan({
  backgroundSrc = backgroundDefault,
  photoSrc = photoDefault,
  title = "IMPLEMENTATION PLAN",
  intro = [INTRO_1, INTRO_2],
}: AzulImplementationPlanProps) {
  return (
    <div style={{ ...BG }}>
      <div style={{ position: "absolute", left: "0.0px", top: "0.0px", width: "1280.0px", height: "720.0px", overflow: "hidden" }}><img src={backgroundSrc} style={{ position: "absolute", left: "-91.9px", top: "-137.3px", width: "1410.3px", height: "939.6px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "233.6px", top: "105.3px", width: "812.9px", height: "77.8px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: -1.9, marginBottom: 0, lineHeight: "76.0px", fontSize: "70.37px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "70.37px", fontWeight: 600, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "-4.15px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "258.3px", top: "196.7px", width: "763.3px", height: "131.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{intro[0]}</span></p><p style={{ textAlign: "center", marginTop: 0, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{intro[1]}</span></p></div>
      <img src={washLarge} style={{ position: "absolute", left: "-570.7px", top: "-566.4px", width: "1114.2px", height: "950.1px" }} />
      <img src={washLarge} style={{ position: "absolute", left: "789.2px", top: "328.2px", width: "1114.2px", height: "950.1px" }} />
      <div style={{ position: "absolute", left: "84.0px", top: "409.4px", width: "1112.0px", height: "238.6px", overflow: "hidden" }}><img src={photoSrc} style={{ position: "absolute", left: "0.0px", top: "-250.7px", width: "1112.0px", height: "739.9px", maxWidth: "none" }} /></div>
    </div>
  );
}
