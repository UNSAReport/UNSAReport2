import type { CSSProperties } from 'react';
import backgroundDefault from '../../../assets/azul/asset-5ff18b4e.jpg';

export interface AzulProblemStatementCard {
  /** Numeral de la tarjeta (ej: "01") */
  numeral: string;
  /** Texto de la tarjeta */
  body: string;
}

export interface AzulProblemStatementProps {
  /** URL de imagen (default: asset de la plantilla) */
  backgroundSrc?: string;
  /** Título principal */
  title?: string;
  /** Párrafos de introducción (dos) */
  intro?: string[];
  /** Tarjetas numeradas 01-03 */
  cards?: AzulProblemStatementCard[];
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

const INTRO_1 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
const INTRO_2 = "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const CARD_BODY = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.";

/**
 * Planteamiento del problema con tarjetas numeradas 01-03.
 */
export function AzulProblemStatement({
  backgroundSrc = backgroundDefault,
  title = "PROBLEM STATEMENT",
  intro = [INTRO_1, INTRO_2],
  cards = [
    { numeral: "01", body: CARD_BODY },
    { numeral: "02", body: CARD_BODY },
    { numeral: "03", body: CARD_BODY },
  ],
}: AzulProblemStatementProps) {
  return (
    <div style={{ ...BG }}>
      <div style={{ position: "absolute", left: "0.0px", top: "0.0px", width: "1280.0px", height: "720.0px", overflow: "hidden" }}><img src={backgroundSrc} style={{ position: "absolute", left: "-91.9px", top: "-137.3px", width: "1410.3px", height: "939.6px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "98.7px", top: "190.8px", width: "471.6px", height: "153.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -1.9, marginBottom: 0, lineHeight: "76.0px", fontSize: "70.37px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "70.37px", fontWeight: 600, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "-4.15px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "98.7px", top: "360.4px", width: "494.7px", height: "175.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{intro[0]}</span></p><p style={{ textAlign: "left", marginTop: 0, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{intro[1]}</span></p></div>
      <svg style={{ position: "absolute", left: "704.4px", top: "142.7px", width: "97.0px", height: "97.0px" }} viewBox={`0 0 97.0 97.0`} preserveAspectRatio="none"><path d="M 48.5 0.0 C 21.7 0.0 0.0 21.7 0.0 48.5 C 0.0 75.3 21.7 97.0 48.5 97.0 C 75.3 97.0 97.0 75.3 97.0 48.5 C 97.0 21.7 75.3 0.0 48.5 0.0 L 48.5 0.0 Z" fill="#95bfd1" /></svg>
      <svg style={{ position: "absolute", left: "816.1px", top: "112.4px", width: "370.5px", height: "157.6px" }} viewBox={`0 0 370.5 157.6`} preserveAspectRatio="none"><path d="M 6.3 0.0 L 364.2 0.0 C 367.7 0.0 370.5 2.8 370.5 6.3 L 370.5 151.3 C 370.5 153.0 369.8 154.6 368.7 155.8 C 367.5 156.9 365.9 157.6 364.2 157.6 L 6.3 157.6 C 2.8 157.6 0.0 154.8 0.0 151.3 L 0.0 6.3 C 0.0 2.8 2.8 0.0 6.3 0.0 Z" fill="#95bfd1" /></svg>
      <div style={{ position: "absolute", left: "849.0px", top: "140.7px", width: "304.9px", height: "91.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 5.61, marginBottom: 0, lineHeight: "23.44px", fontSize: "13.79px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "13.79px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#fbf6f1", letterSpacing: "-0.03px" }}>{cards[0].body}</span></p></div>
      <div style={{ position: "absolute", left: "707.1px", top: "160.8px", width: "91.5px", height: "62.1px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 2.94, marginBottom: 0, lineHeight: "62.04px", fontSize: "51.71px" }}><span style={{ fontSize: "51.71px", fontWeight: 500, fontFamily: "'Open Sauce One', sans-serif", color: "#fbf6f1" }}>{cards[0].numeral}</span></p></div>
      <svg style={{ position: "absolute", left: "704.4px", top: "311.4px", width: "97.0px", height: "97.0px" }} viewBox={`0 0 97.0 97.0`} preserveAspectRatio="none"><path d="M 48.5 0.0 C 21.7 0.0 0.0 21.7 0.0 48.5 C 0.0 75.3 21.7 97.0 48.5 97.0 C 75.3 97.0 97.0 75.3 97.0 48.5 C 97.0 21.7 75.3 0.0 48.5 0.0 L 48.5 0.0 Z" fill="rgba(78,151,187,0.847)" /></svg>
      <svg style={{ position: "absolute", left: "816.1px", top: "281.1px", width: "370.5px", height: "157.6px" }} viewBox={`0 0 370.5 157.6`} preserveAspectRatio="none"><path d="M 6.3 0.0 L 364.2 0.0 C 367.7 0.0 370.5 2.8 370.5 6.3 L 370.5 151.3 C 370.5 153.0 369.8 154.6 368.7 155.8 C 367.5 156.9 365.9 157.6 364.2 157.6 L 6.3 157.6 C 2.8 157.6 0.0 154.8 0.0 151.3 L 0.0 6.3 C 0.0 2.8 2.8 0.0 6.3 0.0 Z" fill="rgba(78,151,187,0.847)" /></svg>
      <div style={{ position: "absolute", left: "849.0px", top: "311.6px", width: "304.9px", height: "91.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 5.61, marginBottom: 0, lineHeight: "23.44px", fontSize: "13.79px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "13.79px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#fbf6f1", letterSpacing: "-0.03px" }}>{cards[1].body}</span></p></div>
      <div style={{ position: "absolute", left: "705.7px", top: "329.0px", width: "91.5px", height: "62.1px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 2.94, marginBottom: 0, lineHeight: "62.04px", fontSize: "51.71px" }}><span style={{ fontSize: "51.71px", fontWeight: 500, fontFamily: "'Open Sauce One', sans-serif", color: "#fbf6f1" }}>{cards[1].numeral}</span></p></div>
      <svg style={{ position: "absolute", left: "704.4px", top: "480.3px", width: "97.0px", height: "97.0px" }} viewBox={`0 0 97.0 97.0`} preserveAspectRatio="none"><path d="M 48.5 0.0 C 21.7 0.0 0.0 21.7 0.0 48.5 C 0.0 75.3 21.7 97.0 48.5 97.0 C 75.3 97.0 97.0 75.3 97.0 48.5 C 97.0 21.7 75.3 0.0 48.5 0.0 L 48.5 0.0 Z" fill="#3885ab" /></svg>
      <svg style={{ position: "absolute", left: "816.1px", top: "450.0px", width: "370.5px", height: "157.6px" }} viewBox={`0 0 370.5 157.6`} preserveAspectRatio="none"><path d="M 6.3 0.0 L 364.2 0.0 C 367.7 0.0 370.5 2.8 370.5 6.3 L 370.5 151.3 C 370.5 153.0 369.8 154.6 368.7 155.8 C 367.5 156.9 365.9 157.6 364.2 157.6 L 6.3 157.6 C 2.8 157.6 0.0 154.8 0.0 151.3 L 0.0 6.3 C 0.0 2.8 2.8 0.0 6.3 0.0 Z" fill="#3885ab" /></svg>
      <div style={{ position: "absolute", left: "849.0px", top: "480.4px", width: "304.9px", height: "91.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 5.61, marginBottom: 0, lineHeight: "23.44px", fontSize: "13.79px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "13.79px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#fbf6f1", letterSpacing: "-0.03px" }}>{cards[2].body}</span></p></div>
      <div style={{ position: "absolute", left: "707.1px", top: "498.4px", width: "91.5px", height: "62.1px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 2.94, marginBottom: 0, lineHeight: "62.04px", fontSize: "51.71px" }}><span style={{ fontSize: "51.71px", fontWeight: 500, fontFamily: "'Open Sauce One', sans-serif", color: "#fbf6f1" }}>{cards[2].numeral}</span></p></div>
    </div>
  );
}
