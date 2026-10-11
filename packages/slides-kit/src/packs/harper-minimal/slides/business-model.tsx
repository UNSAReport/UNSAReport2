import type { CSSProperties } from 'react';

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

export interface HarperBusinessModelColumn {
  heading: string;
  body: string;
}

export interface HarperBusinessModelProps {
  title?: string;
  intro?: string;
  columns?: HarperBusinessModelColumn[];
  pageNumber?: string;
}

const COLUMN_LEFTS = ["72.0px", "496.2px", "920.5px"];
const HEADING_HEIGHTS = ["58.4px", "29.1px", "58.4px"];

/**
 * Modelo de negocio (Harper Business Model).
 */
export function HarperBusinessModel({
  title = "Business Model",
  intro = "Our recurring revenue model is complemented by optional services tailored to enterprise needs.",
  columns = [
    { heading: "SUBSCRIPTION-BASED LICENSING", body: "Pricing tiers are based on usage scope, number of users, or industry-specific modules." },
    { heading: "MODULAR ADD-ONS", body: "In addition to the core platform, we offer optional feature sets tailored to specific operational needs." },
    { heading: "INTEGRATION SUPPORT PACKAGES", body: "Clients will experience minimal disruption while achieving a faster return on investment." },
  ],
  pageNumber = "10",
}: HarperBusinessModelProps) {
  return (
    <div style={{ ...BG, background: "#fafafa" }}>
      <svg style={{ position: "absolute", left: "72.0px", top: "152.6px", width: "75.4px", height: "6.7px", overflow: "visible" }} viewBox={`0 0 75.4 6.7`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="75.4" y2="0.0" stroke="#ff5347" strokeWidth="6.7" /></svg>
      <div style={{ position: "absolute", left: "72.0px", top: "63.3px", width: "484.6px", height: "68.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 9.81, marginBottom: 0, lineHeight: "69.69px", fontSize: "49.78px" }}><span style={{ fontSize: "49.78px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "-1.99px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "1165.6px", top: "612.1px", width: "42.4px", height: "35.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 10.18, marginBottom: 0, lineHeight: "38.4px", fontSize: "21.33px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#ff5347", letterSpacing: "3.41px" }}>{pageNumber}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "198.6px", width: "609.7px", height: "69.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.91, marginBottom: 0, lineHeight: "34.84px", fontSize: "24.88px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "24.88px", fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "0.49px" }}>{intro}</span></p></div>
      {columns.map((column, i) => (
        <div key={`col-${i}`}>
          <div style={{ position: "absolute", left: COLUMN_LEFTS[i], top: "348.3px", width: "287.5px", height: HEADING_HEIGHTS[i], background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.2, marginBottom: 0, lineHeight: "29.86px", fontSize: "21.33px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#ff8a80", letterSpacing: "1.71px" }}>{column.heading}</span></p></div>
          <div style={{ position: "absolute", left: COLUMN_LEFTS[i], top: "426.5px", width: "287.5px", height: "117.1px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.2, marginBottom: 0, lineHeight: "29.86px", fontSize: "21.33px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "21.33px", fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "0.43px" }}>{column.body}</span></p></div>
        </div>
      ))}
    </div>
  );
}
