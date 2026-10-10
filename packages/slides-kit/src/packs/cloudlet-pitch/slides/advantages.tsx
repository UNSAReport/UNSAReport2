import type { CSSProperties } from 'react';
import washLeft from '../../../assets/cloudlet/asset-6bb10841.webp';
import defaultPhoto from '../../../assets/cloudlet/asset-3c8de72b.jpg';

export interface CloudletAdvantage {
  title: string;
  description: string;
}

export interface CloudletAdvantagesProps {
  title?: string;
  advantages?: CloudletAdvantage[];
  photoSrc?: string;
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

const DEFAULT_DESCRIPTION = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";

/**
 * Ventajas competitivas clave.
 */
export function CloudletAdvantages({
  title = "Key Competitive Advantages",
  advantages = [
    { title: "Advantage 01", description: DEFAULT_DESCRIPTION },
    { title: "Advantage 02", description: DEFAULT_DESCRIPTION },
    { title: "Advantage 03", description: DEFAULT_DESCRIPTION },
  ],
  photoSrc = defaultPhoto,
}: CloudletAdvantagesProps) {
  return (
    <div style={{ ...BG, background: "#d0d7dd" }}>
      <img src={washLeft} style={{ position: "absolute", left: "-101.1px", top: "346.1px", width: "857.3px", height: "554.9px", opacity: 0.4 }} />
      <div style={{ position: "absolute", left: "702.0px", top: "-14.5px", width: "592.3px", height: "746.1px", overflow: "hidden" }}><img src={photoSrc} style={{ position: "absolute", left: "-262.8px", top: "0.0px", width: "1117.8px", height: "746.1px", maxWidth: "none" }} /></div>
      <svg style={{ position: "absolute", left: "63.6px", top: "380.7px", width: "1154.2px", height: "284.6px" }} viewBox={`0 0 1154.2 284.6`} preserveAspectRatio="none"><path d="M 8.2 0.0 L 1146.0 0.0 C 1148.1 0.0 1150.2 0.9 1151.8 2.4 C 1153.3 4.0 1154.2 6.1 1154.2 8.2 L 1154.2 276.4 C 1154.2 278.5 1153.3 280.6 1151.8 282.2 C 1150.2 283.7 1148.1 284.6 1146.0 284.6 L 8.2 284.6 C 6.1 284.6 4.0 283.7 2.4 282.2 C 0.9 280.6 0.0 278.5 0.0 276.4 L 0.0 8.2 C 0.0 6.1 0.9 4.0 2.4 2.4 C 4.0 0.9 6.1 0.0 8.2 0.0 Z" fill="#d0d7dd" stroke="#424242" stroke-width="1.3" /></svg>
      <div style={{ position: "absolute", left: "72.0px", top: "69.5px", width: "519.3px", height: "249.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -10.89, marginBottom: 0, lineHeight: "81.88px", fontSize: "87.11px" }}><span style={{ fontSize: "87.11px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-4.09px" }}>{title}</span></p></div>
      <svg style={{ position: "absolute", left: "438.6px", top: "405.6px", width: "0.0px", height: "230.5px", overflow: "visible" }} viewBox={`0 0 0.0 230.5`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="0.0" y2="230.5" stroke="#424242" strokeWidth="1.3" /></svg>
      <svg style={{ position: "absolute", left: "827.7px", top: "405.6px", width: "0.0px", height: "230.5px", overflow: "visible" }} viewBox={`0 0 0.0 230.5`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="0.0" y2="230.5" stroke="#424242" strokeWidth="1.3" /></svg>
      <div style={{ position: "absolute", left: "104.4px", top: "429.2px", width: "254.8px", height: "31.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -4.01, marginBottom: 0, lineHeight: "30.07px", fontSize: "32.0px" }}><span style={{ fontSize: "32.0px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-1.5px" }}>{advantages[0].title}</span></p></div>
      <div style={{ position: "absolute", left: "490.5px", top: "429.2px", width: "254.8px", height: "31.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -4.01, marginBottom: 0, lineHeight: "30.07px", fontSize: "32.0px" }}><span style={{ fontSize: "32.0px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-1.5px" }}>{advantages[1].title}</span></p></div>
      <div style={{ position: "absolute", left: "104.4px", top: "497.3px", width: "291.0px", height: "120.8px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.45, marginBottom: 0, lineHeight: "17.42px", fontSize: "12.44px" }}><span style={{ fontSize: "12.44px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#424242", letterSpacing: "-0.58px" }}>{advantages[0].description}</span></p></div>
      <div style={{ position: "absolute", left: "490.5px", top: "497.3px", width: "291.0px", height: "120.8px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.45, marginBottom: 0, lineHeight: "17.42px", fontSize: "12.44px" }}><span style={{ fontSize: "12.44px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#424242", letterSpacing: "-0.58px" }}>{advantages[1].description}</span></p></div>
      <div style={{ position: "absolute", left: "879.6px", top: "429.2px", width: "254.8px", height: "31.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -4.01, marginBottom: 0, lineHeight: "30.07px", fontSize: "32.0px" }}><span style={{ fontSize: "32.0px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-1.5px" }}>{advantages[2].title}</span></p></div>
      <div style={{ position: "absolute", left: "879.6px", top: "497.3px", width: "291.0px", height: "120.8px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.45, marginBottom: 0, lineHeight: "17.42px", fontSize: "12.44px" }}><span style={{ fontSize: "12.44px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#424242", letterSpacing: "-0.58px" }}>{advantages[2].description}</span></p></div>
    </div>
  );
}
