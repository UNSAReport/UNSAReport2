import type { CSSProperties } from 'react';
import washWide from '../../../assets/cloudlet/asset-7a50af3d.webp';
import washTop from '../../../assets/cloudlet/asset-6bb10841.webp';
import washSide from '../../../assets/cloudlet/asset-05273750.webp';
import logo from '../../../assets/cloudlet/asset-b00f7859.webp';

export interface CloudletCoverProps {
  brand?: string;
  heroTitle?: string;
  subtitle?: string;
  presentedLabel?: string;
  presenter?: string;
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

/**
 * Portada pitch startup con panel degradado y foto.
 */
export function CloudletCover({
  brand = "Cloudlet Tech",
  heroTitle = "Startup",
  subtitle = "Pitch Deck Presentation",
  presentedLabel = "Presented by :",
  presenter = "Adam Fletcher",
}: CloudletCoverProps) {
  return (
    <div style={{ ...BG, background: "#d0d7dd" }}>
      <img src={washWide} style={{ position: "absolute", left: "581.1px", top: "-56.1px", width: "895.3px", height: "660.9px", opacity: 0.42 }} />
      <img src={washTop} style={{ position: "absolute", left: "-102.6px", top: "-77.3px", width: "421.2px", height: "251.9px", opacity: 0.12 }} />
      <img src={washSide} style={{ position: "absolute", left: "-64.7px", top: "363.2px", width: "330.1px", height: "437.5px", opacity: 0.02 }} />
      <div style={{ position: "absolute", left: "72.0px", top: "375.2px", width: "911.1px", height: "315.2px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 46.07, marginBottom: 0, lineHeight: "327.38px", fontSize: "233.84px" }}><span style={{ fontSize: "233.84px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-10.99px" }}>{heroTitle}</span></p></div>
      <svg style={{ position: "absolute", left: "888.6px", top: "603.8px", width: "34.9px", height: "34.9px" }} viewBox={`0 0 34.9 34.9`} preserveAspectRatio="none"><path d="M 17.4 0.0 C 7.8 0.0 0.0 7.8 0.0 17.4 C 0.0 27.1 7.8 34.9 17.4 34.9 C 27.1 34.9 34.9 27.1 34.9 17.4 C 34.9 7.8 27.1 0.0 17.4 0.0 Z" fill="#424242" /></svg>
      <svg style={{ position: "absolute", left: "73.2px", top: "103.6px", width: "1134.8px", height: "1.3px", overflow: "visible" }} viewBox={`0 0 1134.8 1.3`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="1134.8" y2="0.0" stroke="#424242" strokeWidth="1.3" /></svg>
      <img src={logo} style={{ position: "absolute", left: "66.7px", top: "45.3px", width: "45.1px", height: "45.1px" }} />
      <div style={{ position: "absolute", left: "117.3px", top: "45.5px", width: "239.8px", height: "41.2px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 6.09, marginBottom: 0, lineHeight: "43.27px", fontSize: "30.91px" }}><span style={{ fontSize: "30.91px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-1.45px" }}>{brand}</span></p></div>
      <div style={{ position: "absolute", left: "986.2px", top: "559.3px", width: "241.5px", height: "79.4px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.17, marginBottom: 0, lineHeight: "40.32px", fontSize: "32.0px" }}><span style={{ fontSize: "32.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#424242", letterSpacing: "-1.79px" }}>{subtitle}</span></p></div>
      <div style={{ position: "absolute", left: "966.5px", top: "43.6px", width: "241.5px", height: "19.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 1.58, marginBottom: 0, lineHeight: "20.16px", fontSize: "16.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-0.89px" }}>{presentedLabel}</span></p></div>
      <div style={{ position: "absolute", left: "966.5px", top: "64.4px", width: "241.5px", height: "22.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 1.76, marginBottom: 0, lineHeight: "22.4px", fontSize: "17.78px" }}><span style={{ fontSize: "17.78px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 400, color: "#424242", letterSpacing: "-1.0px" }}>{presenter}</span></p></div>
    </div>
  );
}
