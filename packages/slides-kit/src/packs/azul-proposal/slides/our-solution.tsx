import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '../../assets';

const backgroundDefault = getTemplateAssetUrl('azul-proposal', 'asset-5ff18b4e.jpg');

export interface AzulOurSolutionStep {
  /** Numeral del paso (ej: "01") */
  numeral: string;
  /** Texto del paso */
  body: string;
}

export interface AzulOurSolutionProps {
  /** URL de imagen (default: asset de la plantilla) */
  backgroundSrc?: string;
  /** Título principal */
  title?: string;
  /** Párrafos de introducción (dos) */
  intro?: string[];
  /** Pasos de la línea de tiempo vertical 01-03 */
  steps?: AzulOurSolutionStep[];
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

const INTRO_1 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
const INTRO_2 = "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const STEP_BODY = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.";

/**
 * Nuestra solución con línea de tiempo vertical 01-03.
 */
export function AzulOurSolution({
  backgroundSrc = backgroundDefault,
  title = "OUR SOLUTION",
  intro = [INTRO_1, INTRO_2],
  steps = [
    { numeral: "01", body: STEP_BODY },
    { numeral: "02", body: STEP_BODY },
    { numeral: "03", body: STEP_BODY },
  ],
}: AzulOurSolutionProps) {
  return (
    <div style={{ ...BG }}>
      <div style={{ position: "absolute", left: "0.0px", top: "0.0px", width: "1280.0px", height: "720.0px", overflow: "hidden" }}><img src={backgroundSrc} style={{ position: "absolute", left: "-91.9px", top: "-137.3px", width: "1410.3px", height: "939.6px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "54.3px", top: "53.0px", width: "1171.4px", height: "613.9px", backgroundColor: "#bbd6e1", borderRadius: "4px" }} />
      <div style={{ position: "absolute", left: "762.0px", top: "53.0px", width: "2.7px", height: "613.9px", backgroundColor: "#185079" }} />
      <div style={{ position: "absolute", left: "755.6px", top: "138.6px", width: "12.8px", height: "12.8px", borderRadius: "50%", backgroundColor: "#185079" }} />
      <div style={{ position: "absolute", left: "804.9px", top: "120.1px", width: "331.9px", height: "50.4px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.15, marginBottom: 0, lineHeight: "51.26px", fontSize: "43.08px" }}><span style={{ fontSize: "43.08px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "1.16px" }}>{steps[0].numeral}</span></p></div>
      <div style={{ position: "absolute", left: "804.9px", top: "175.6px", width: "353.3px", height: "82.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.95, marginBottom: 0, lineHeight: "20.95px", fontSize: "14.96px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "14.96px", fontWeight: 500, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "0.9px" }}>{steps[0].body}</span></p></div>
      <div style={{ position: "absolute", left: "804.9px", top: "291.8px", width: "331.9px", height: "50.4px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.15, marginBottom: 0, lineHeight: "51.26px", fontSize: "43.08px" }}><span style={{ fontSize: "43.08px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "1.16px" }}>{steps[1].numeral}</span></p></div>
      <div style={{ position: "absolute", left: "804.9px", top: "347.3px", width: "353.3px", height: "82.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.95, marginBottom: 0, lineHeight: "20.95px", fontSize: "14.96px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "14.96px", fontWeight: 500, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "0.9px" }}>{steps[1].body}</span></p></div>
      <div style={{ position: "absolute", left: "804.9px", top: "463.7px", width: "331.9px", height: "50.4px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.15, marginBottom: 0, lineHeight: "51.26px", fontSize: "43.08px" }}><span style={{ fontSize: "43.08px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "1.16px" }}>{steps[2].numeral}</span></p></div>
      <div style={{ position: "absolute", left: "804.9px", top: "519.3px", width: "353.3px", height: "82.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.95, marginBottom: 0, lineHeight: "20.95px", fontSize: "14.96px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "14.96px", fontWeight: 500, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "0.9px" }}>{steps[2].body}</span></p></div>
      <div style={{ position: "absolute", left: "755.6px", top: "310.3px", width: "12.8px", height: "12.8px", borderRadius: "50%", backgroundColor: "#185079" }} />
      <div style={{ position: "absolute", left: "755.6px", top: "482.2px", width: "12.8px", height: "12.8px", borderRadius: "50%", backgroundColor: "#185079" }} />
      <div style={{ position: "absolute", left: "145.3px", top: "190.8px", width: "471.6px", height: "153.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -1.9, marginBottom: 0, lineHeight: "76.0px", fontSize: "70.37px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "70.37px", fontWeight: 600, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "-4.15px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "145.3px", top: "360.4px", width: "494.7px", height: "175.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{intro[0]}</span></p><p style={{ textAlign: "left", marginTop: 0, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{intro[1]}</span></p></div>
    </div>
  );
}
