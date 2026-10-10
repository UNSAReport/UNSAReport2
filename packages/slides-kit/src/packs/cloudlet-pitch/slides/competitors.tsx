import type { CSSProperties } from 'react';
import washRight from '../../../assets/cloudlet/asset-6bb10841.webp';
import washLeft from '../../../assets/cloudlet/asset-6bb10841.webp';

export interface CloudletCompetitorsProps {
  directTitle?: string;
  indirectTitle?: string;
  directPoints?: string[];
  indirectPoints?: string[];
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

const DEFAULT_POINT = "•  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

/**
 * Competidores directos e indirectos.
 */
export function CloudletCompetitors({
  directTitle = "Direct Competitor",
  indirectTitle = "Indirect Competitor",
  directPoints = [DEFAULT_POINT, DEFAULT_POINT, DEFAULT_POINT],
  indirectPoints = [DEFAULT_POINT, DEFAULT_POINT, DEFAULT_POINT],
}: CloudletCompetitorsProps) {
  return (
    <div style={{ ...BG, background: "#424242" }}>
      <img src={washRight} style={{ position: "absolute", left: "472.1px", top: "-119.8px", width: "960.3px", height: "621.6px", opacity: 0.24 }} />
      <img src={washLeft} style={{ position: "absolute", left: "-417.6px", top: "233.7px", width: "960.3px", height: "621.6px", opacity: 0.24 }} />
      <svg style={{ position: "absolute", left: "62.6px", top: "60.8px", width: "1154.5px", height: "598.5px" }} viewBox={`0 0 1154.5 598.5`} preserveAspectRatio="none"><path d="M 11.6 0.0 L 1142.9 0.0 C 1146.0 0.0 1148.9 1.2 1151.1 3.4 C 1153.3 5.6 1154.5 8.5 1154.5 11.6 L 1154.5 586.9 C 1154.5 593.3 1149.3 598.5 1142.9 598.5 L 11.6 598.5 C 5.2 598.5 0.0 593.3 0.0 586.9 L 0.0 11.6 C 0.0 5.2 5.2 0.0 11.6 0.0 Z" fill="#424242" stroke="#d0d7dd" stroke-width="1.3" /></svg>
      <svg style={{ position: "absolute", left: "640.7px", top: "87.6px", width: "0.0px", height: "538.9px", overflow: "visible" }} viewBox={`0 0 0.0 538.9`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="0.0" y2="538.9" stroke="#d0d7dd" strokeWidth="1.3" /></svg>
      <svg style={{ position: "absolute", left: "101.7px", top: "307.1px", width: "478.7px", height: "1.3px", overflow: "visible" }} viewBox={`0 0 478.7 1.3`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="478.7" y2="0.0" stroke="#d0d7dd" strokeWidth="1.3" /></svg>
      <svg style={{ position: "absolute", left: "700.7px", top: "307.1px", width: "478.7px", height: "1.3px", overflow: "visible" }} viewBox={`0 0 478.7 1.3`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="478.7" y2="0.0" stroke="#d0d7dd" strokeWidth="1.3" /></svg>
      <div style={{ position: "absolute", left: "115.4px", top: "105.8px", width: "454.0px", height: "154.8px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -10.0, marginBottom: 0, lineHeight: "75.2px", fontSize: "80.0px" }}><span style={{ fontSize: "80.0px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#ffffff", letterSpacing: "-3.75px" }}>{directTitle}</span></p></div>
      <div style={{ position: "absolute", left: "700.7px", top: "105.8px", width: "454.0px", height: "154.8px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -10.0, marginBottom: 0, lineHeight: "75.2px", fontSize: "80.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "80.0px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#ffffff", letterSpacing: "-3.75px" }}>{indirectTitle}</span></p></div>
      <div style={{ position: "absolute", left: "115.4px", top: "357.4px", width: "454.0px", height: "65.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "27.2px", textIndent: "-13.6px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{directPoints[0]}</span></p></div>
      <div style={{ position: "absolute", left: "700.7px", top: "357.4px", width: "454.0px", height: "65.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "27.2px", textIndent: "-13.6px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{indirectPoints[0]}</span></p></div>
      <div style={{ position: "absolute", left: "115.4px", top: "436.3px", width: "454.0px", height: "65.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "27.2px", textIndent: "-13.6px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{directPoints[1]}</span></p></div>
      <div style={{ position: "absolute", left: "700.7px", top: "436.3px", width: "454.0px", height: "65.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "27.2px", textIndent: "-13.6px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{indirectPoints[1]}</span></p></div>
      <div style={{ position: "absolute", left: "115.4px", top: "515.2px", width: "454.0px", height: "65.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "27.2px", textIndent: "-13.6px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{directPoints[2]}</span></p></div>
      <div style={{ position: "absolute", left: "700.7px", top: "515.2px", width: "454.0px", height: "65.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "27.2px", textIndent: "-13.6px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{indirectPoints[2]}</span></p></div>
    </div>
  );
}
