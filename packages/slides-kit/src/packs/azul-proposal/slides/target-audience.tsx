import type { CSSProperties } from 'react';
import backgroundDefault from '../../../assets/azul/asset-5ff18b4e.jpg';

export interface AzulTargetAudienceSegment {
  /** Numeral del segmento (ej: "01") */
  numeral: string;
  /** Texto del segmento */
  body: string;
}

export interface AzulTargetAudienceProps {
  /** URL de imagen (default: asset de la plantilla) */
  backgroundSrc?: string;
  /** Título principal */
  title?: string;
  /** Párrafos de introducción (dos) */
  intro?: string[];
  /** Cuatro tarjetas de segmentos de audiencia */
  segments?: AzulTargetAudienceSegment[];
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

const INTRO_1 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
const INTRO_2 = "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const SEGMENT_BODY = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.";

/**
 * Audiencia objetivo con 4 tarjetas de segmentos.
 */
export function AzulTargetAudience({
  backgroundSrc = backgroundDefault,
  title = "TARGET AUDIENCE",
  intro = [INTRO_1, INTRO_2],
  segments = [
    { numeral: "01", body: SEGMENT_BODY },
    { numeral: "02", body: SEGMENT_BODY },
    { numeral: "03", body: SEGMENT_BODY },
    { numeral: "04", body: SEGMENT_BODY },
  ],
}: AzulTargetAudienceProps) {
  return (
    <div style={{ ...BG }}>
      <div style={{ position: "absolute", left: "0.0px", top: "0.0px", width: "1280.0px", height: "720.0px", overflow: "hidden" }}><img src={backgroundSrc} style={{ position: "absolute", left: "-91.9px", top: "-137.3px", width: "1410.3px", height: "939.6px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "111.3px", top: "190.8px", width: "471.6px", height: "153.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -1.9, marginBottom: 0, lineHeight: "76.0px", fontSize: "70.37px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "70.37px", fontWeight: 600, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "-4.15px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "111.3px", top: "360.4px", width: "437.3px", height: "197.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{intro[0]}</span></p><p style={{ textAlign: "left", marginTop: 0, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{intro[1]}</span></p></div>
      <svg style={{ position: "absolute", left: "626.7px", top: "116.9px", width: "273.8px", height: "234.2px" }} viewBox={`0 0 273.8 234.2`} preserveAspectRatio="none"><path d="M 13.9 0.0 L 259.9 0.0 C 267.6 0.0 273.8 6.2 273.8 13.9 L 273.8 220.3 C 273.8 224.0 272.3 227.5 269.7 230.1 C 267.1 232.7 263.6 234.2 259.9 234.2 L 13.9 234.2 C 10.2 234.2 6.7 232.7 4.1 230.1 C 1.5 227.5 0.0 224.0 0.0 220.3 L 0.0 13.9 C 0.0 10.2 1.5 6.7 4.1 4.1 C 6.7 1.5 10.2 0.0 13.9 0.0 Z" fill="#bbd6e1" /></svg>
      <svg style={{ position: "absolute", left: "920.9px", top: "116.9px", width: "273.8px", height: "234.2px" }} viewBox={`0 0 273.8 234.2`} preserveAspectRatio="none"><path d="M 13.9 0.0 L 259.9 0.0 C 267.6 0.0 273.8 6.2 273.8 13.9 L 273.8 220.3 C 273.8 224.0 272.3 227.5 269.7 230.1 C 267.1 232.7 263.6 234.2 259.9 234.2 L 13.9 234.2 C 10.2 234.2 6.7 232.7 4.1 230.1 C 1.5 227.5 0.0 224.0 0.0 220.3 L 0.0 13.9 C 0.0 10.2 1.5 6.7 4.1 4.1 C 6.7 1.5 10.2 0.0 13.9 0.0 Z" fill="#95bfd1" /></svg>
      <svg style={{ position: "absolute", left: "626.7px", top: "368.9px", width: "273.8px", height: "234.2px" }} viewBox={`0 0 273.8 234.2`} preserveAspectRatio="none"><path d="M 13.9 0.0 L 259.9 0.0 C 267.6 0.0 273.8 6.2 273.8 13.9 L 273.8 220.3 C 273.8 224.0 272.3 227.5 269.7 230.1 C 267.1 232.7 263.6 234.2 259.9 234.2 L 13.9 234.2 C 10.2 234.2 6.7 232.7 4.1 230.1 C 1.5 227.5 0.0 224.0 0.0 220.3 L 0.0 13.9 C 0.0 10.2 1.5 6.7 4.1 4.1 C 6.7 1.5 10.2 0.0 13.9 0.0 Z" fill="#6ba1bc" /></svg>
      <svg style={{ position: "absolute", left: "920.9px", top: "368.9px", width: "273.8px", height: "234.2px" }} viewBox={`0 0 273.8 234.2`} preserveAspectRatio="none"><path d="M 13.9 0.0 L 259.9 0.0 C 267.6 0.0 273.8 6.2 273.8 13.9 L 273.8 220.3 C 273.8 224.0 272.3 227.5 269.7 230.1 C 267.1 232.7 263.6 234.2 259.9 234.2 L 13.9 234.2 C 10.2 234.2 6.7 232.7 4.1 230.1 C 1.5 227.5 0.0 224.0 0.0 220.3 L 0.0 13.9 C 0.0 10.2 1.5 6.7 4.1 4.1 C 6.7 1.5 10.2 0.0 13.9 0.0 Z" fill="#3885ab" /></svg>
      <div style={{ position: "absolute", left: "663.2px", top: "201.1px", width: "200.7px", height: "111.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 2.7, marginBottom: 0, lineHeight: "19.13px", fontSize: "13.66px" }}><span style={{ fontSize: "13.66px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 400, color: "#185079" }}>{segments[0].body}</span></p></div>
      <div style={{ position: "absolute", left: "648.5px", top: "144.1px", width: "230.1px", height: "47.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 7.0, marginBottom: 0, lineHeight: "49.77px", fontSize: "35.55px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "35.55px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "0.2px" }}>{segments[0].numeral}</span></p></div>
      <div style={{ position: "absolute", left: "957.5px", top: "201.1px", width: "200.7px", height: "111.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 2.7, marginBottom: 0, lineHeight: "19.13px", fontSize: "13.66px" }}><span style={{ fontSize: "13.66px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 400, color: "#185079" }}>{segments[1].body}</span></p></div>
      <div style={{ position: "absolute", left: "942.8px", top: "144.1px", width: "230.1px", height: "47.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 7.0, marginBottom: 0, lineHeight: "49.77px", fontSize: "35.55px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "35.55px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "0.2px" }}>{segments[1].numeral}</span></p></div>
      <div style={{ position: "absolute", left: "663.2px", top: "453.1px", width: "200.7px", height: "111.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 2.7, marginBottom: 0, lineHeight: "19.13px", fontSize: "13.66px" }}><span style={{ fontSize: "13.66px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 400, color: "#fbf6f1" }}>{segments[2].body}</span></p></div>
      <div style={{ position: "absolute", left: "648.5px", top: "396.2px", width: "230.1px", height: "47.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 7.0, marginBottom: 0, lineHeight: "49.77px", fontSize: "35.55px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "35.55px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#fbf6f1", letterSpacing: "0.2px" }}>{segments[2].numeral}</span></p></div>
      <div style={{ position: "absolute", left: "957.5px", top: "453.1px", width: "200.7px", height: "111.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 2.7, marginBottom: 0, lineHeight: "19.13px", fontSize: "13.66px" }}><span style={{ fontSize: "13.66px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 400, color: "#fbf6f1" }}>{segments[3].body}</span></p></div>
      <div style={{ position: "absolute", left: "942.8px", top: "396.2px", width: "230.1px", height: "47.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 7.0, marginBottom: 0, lineHeight: "49.77px", fontSize: "35.55px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "35.55px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#fbf6f1", letterSpacing: "0.2px" }}>{segments[3].numeral}</span></p></div>
    </div>
  );
}
