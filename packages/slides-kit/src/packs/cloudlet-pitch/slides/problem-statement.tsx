import type { CSSProperties } from 'react';
import washTall from '../../../assets/cloudlet/asset-05273750.webp';
import logo from '../../../assets/cloudlet/asset-54672936.webp';
import washBottom from '../../../assets/cloudlet/asset-8f9c8dbd.webp';

export interface CloudletProblem {
  title: string;
  description: string;
}

export interface CloudletProblemStatementProps {
  brand?: string;
  title?: string;
  problems?: CloudletProblem[];
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

const DEFAULT_DESCRIPTION = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

/**
 * Tres problemas en tarjetas.
 */
export function CloudletProblemStatement({
  brand = "Cloudlet Tech",
  title = "Problem Statement",
  problems = [
    { title: "PROBLEM 1", description: DEFAULT_DESCRIPTION },
    { title: "PROBLEM 2", description: DEFAULT_DESCRIPTION },
    { title: "PROBLEM 3", description: DEFAULT_DESCRIPTION },
  ],
}: CloudletProblemStatementProps) {
  return (
    <div style={{ ...BG, background: "#424242" }}>
      <img src={washTall} style={{ position: "absolute", left: "802.5px", top: "-282.8px", width: "657.0px", height: "738.9px", opacity: 0.21 }} />
      <img src={logo} style={{ position: "absolute", left: "66.7px", top: "45.3px", width: "45.1px", height: "45.1px" }} />
      <img src={washBottom} style={{ position: "absolute", left: "-137.5px", top: "431.4px", width: "860.9px", height: "360.0px", opacity: 0.11 }} />
      <svg style={{ position: "absolute", left: "72.0px", top: "312.2px", width: "1145.1px", height: "347.2px" }} viewBox={`0 0 1145.1 347.2`} preserveAspectRatio="none"><path d="M 11.7 0.0 L 1133.4 0.0 C 1136.5 0.0 1139.5 1.2 1141.7 3.4 C 1143.9 5.6 1145.1 8.6 1145.1 11.7 L 1145.1 335.5 C 1145.1 338.6 1143.9 341.6 1141.7 343.8 C 1139.5 346.0 1136.5 347.2 1133.4 347.2 L 11.7 347.2 C 8.6 347.2 5.6 346.0 3.4 343.8 C 1.2 341.6 0.0 338.6 0.0 335.5 L 0.0 11.7 C 0.0 8.6 1.2 5.6 3.4 3.4 C 5.6 1.2 8.6 0.0 11.7 0.0 Z" fill="#424242" stroke="#d0d7dd" stroke-width="1.3" /></svg>
      <div style={{ position: "absolute", left: "72.0px", top: "161.7px", width: "937.1px", height: "98.4px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -12.19, marginBottom: 0, lineHeight: "91.62px", fontSize: "97.47px" }}><span style={{ fontSize: "97.47px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#ffffff", letterSpacing: "-4.58px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "168.9px", top: "360.7px", width: "246.4px", height: "26.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 1.32, marginBottom: 0, lineHeight: "27.73px", fontSize: "23.11px" }}><span style={{ fontSize: "23.11px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#ffffff", letterSpacing: "-1.08px" }}>{problems[0].title}</span></p></div>
      <div style={{ position: "absolute", left: "554.9px", top: "360.7px", width: "246.4px", height: "26.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 1.32, marginBottom: 0, lineHeight: "27.73px", fontSize: "23.11px" }}><span style={{ fontSize: "23.11px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#ffffff", letterSpacing: "-1.08px" }}>{problems[1].title}</span></p></div>
      <div style={{ position: "absolute", left: "941.6px", top: "360.7px", width: "246.4px", height: "26.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 1.32, marginBottom: 0, lineHeight: "27.73px", fontSize: "23.11px" }}><span style={{ fontSize: "23.11px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#ffffff", letterSpacing: "-1.08px" }}>{problems[2].title}</span></p></div>
      <div style={{ position: "absolute", left: "117.3px", top: "45.5px", width: "313.1px", height: "41.2px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 6.09, marginBottom: 0, lineHeight: "43.27px", fontSize: "30.91px" }}><span style={{ fontSize: "30.91px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#d0d7dd", letterSpacing: "-1.45px" }}>{brand}</span></p></div>
      <svg style={{ position: "absolute", left: "441.5px", top: "345.5px", width: "0.0px", height: "275.1px", overflow: "visible" }} viewBox={`0 0 0.0 275.1`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="0.0" y2="275.1" stroke="#d0d7dd" strokeWidth="1.3" /></svg>
      <svg style={{ position: "absolute", left: "827.5px", top: "345.5px", width: "0.0px", height: "275.1px", overflow: "visible" }} viewBox={`0 0 0.0 275.1`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="0.0" y2="275.1" stroke="#d0d7dd" strokeWidth="1.3" /></svg>
      <svg style={{ position: "absolute", left: "113.1px", top: "360.2px", width: "27.1px", height: "27.1px" }} viewBox={`0 0 27.1 27.1`} preserveAspectRatio="none"><linearGradient id="g4_9" x1="0.000" y1="0.500" x2="1.000" y2="0.500"><stop offset="0.000" stop-color="#a0cefd" /><stop offset="1.000" stop-color="#e4f2ff" /></linearGradient><path d="M 13.5 0.0 C 6.1 0.0 0.0 6.1 0.0 13.5 C 0.0 21.0 6.1 27.1 13.5 27.1 C 21.0 27.1 27.1 21.0 27.1 13.5 C 27.1 6.1 21.0 0.0 13.5 0.0 Z" fill="url(#g4_9)" stroke="#ffffff" stroke-width="0.7" /></svg>
      <svg style={{ position: "absolute", left: "499.1px", top: "360.2px", width: "27.1px", height: "27.1px" }} viewBox={`0 0 27.1 27.1`} preserveAspectRatio="none"><linearGradient id="g4_10" x1="0.000" y1="0.500" x2="1.000" y2="0.500"><stop offset="0.000" stop-color="#a0cefd" /><stop offset="1.000" stop-color="#e4f2ff" /></linearGradient><path d="M 13.5 0.0 C 6.1 0.0 0.0 6.1 0.0 13.5 C 0.0 21.0 6.1 27.1 13.5 27.1 C 21.0 27.1 27.1 21.0 27.1 13.5 C 27.1 6.1 21.0 0.0 13.5 0.0 Z" fill="url(#g4_10)" stroke="#ffffff" stroke-width="0.7" /></svg>
      <svg style={{ position: "absolute", left: "885.7px", top: "360.2px", width: "27.1px", height: "27.1px" }} viewBox={`0 0 27.1 27.1`} preserveAspectRatio="none"><linearGradient id="g4_11" x1="0.000" y1="0.500" x2="1.000" y2="0.500"><stop offset="0.000" stop-color="#a0cefd" /><stop offset="1.000" stop-color="#e4f2ff" /></linearGradient><path d="M 13.5 0.0 C 6.1 0.0 0.0 6.1 0.0 13.5 C 0.0 21.0 6.1 27.1 13.5 27.1 C 21.0 27.1 27.1 21.0 27.1 13.5 C 27.1 6.1 21.0 0.0 13.5 0.0 Z" fill="url(#g4_11)" stroke="#ffffff" stroke-width="0.7" /></svg>
      <div style={{ position: "absolute", left: "112.1px", top: "442.6px", width: "272.8px", height: "155.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.45, marginBottom: 0, lineHeight: "17.42px", fontSize: "12.44px" }}><span style={{ fontSize: "12.44px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.58px" }}>{problems[0].description}</span></p></div>
      <div style={{ position: "absolute", left: "498.1px", top: "442.6px", width: "272.8px", height: "155.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.45, marginBottom: 0, lineHeight: "17.42px", fontSize: "12.44px" }}><span style={{ fontSize: "12.44px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.58px" }}>{problems[1].description}</span></p></div>
      <div style={{ position: "absolute", left: "884.8px", top: "442.6px", width: "272.8px", height: "155.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.45, marginBottom: 0, lineHeight: "17.42px", fontSize: "12.44px" }}><span style={{ fontSize: "12.44px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.58px" }}>{problems[2].description}</span></p></div>
    </div>
  );
}
