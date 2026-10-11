import type { CSSProperties } from 'react';

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

export interface HarperContentsItem {
  label: string;
  page: string;
}

export interface HarperContentsProps {
  title?: string;
  items?: HarperContentsItem[];
}

const LEFT_LABEL_TOPS = ["300.5px", "356.0px", "411.5px", "466.9px", "522.4px"];
const LEFT_PAGE_TOPS = ["298.1px", "353.6px", "409.0px", "464.5px", "520.0px"];
const RIGHT_LABEL_TOPS = ["300.5px", "356.0px", "411.5px", "466.9px"];
const RIGHT_PAGE_TOPS = ["298.1px", "353.6px", "409.0px", "464.5px"];

/**
 * Tabla de contenidos con numerales fantasma (Harper Contents).
 */
export function HarperContents({
  title = "Table of Contents",
  items = [
    { label: "About Us", page: "3" },
    { label: "The Problem", page: "4" },
    { label: "Our Solution", page: "5" },
    { label: "Market Opportunity", page: "6" },
    { label: "Why Now", page: "7" },
    { label: "Product Overview", page: "8" },
    { label: "Key Features", page: "9" },
    { label: "Business Model", page: "10" },
    { label: "Roadmap", page: "11" },
  ],
}: HarperContentsProps) {
  const left = items.slice(0, 5);
  const right = items.slice(5, 9);
  return (
    <div style={{ ...BG, background: "#fafafa" }}>
      <svg style={{ position: "absolute", left: "72.0px", top: "152.6px", width: "75.4px", height: "6.7px", overflow: "visible" }} viewBox={`0 0 75.4 6.7`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="75.4" y2="0.0" stroke="#ff5347" strokeWidth="6.7" /></svg>
      <div style={{ position: "absolute", left: "72.0px", top: "63.3px", width: "681.1px", height: "68.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 9.81, marginBottom: 0, lineHeight: "69.69px", fontSize: "49.78px" }}><span style={{ fontSize: "49.78px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "-1.99px" }}>{title}</span></p></div>
      {left.map((item, i) => (
        <div key={`l-${i}`}>
          <div style={{ position: "absolute", left: "442.2px", top: LEFT_LABEL_TOPS[i], width: "239.1px", height: "37.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 5.61, marginBottom: 0, lineHeight: "39.82px", fontSize: "28.44px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "28.44px", fontFamily: "'PT Serif', sans-serif", color: "rgba(0,0,0,0.698)", letterSpacing: "-1.14px" }}>{item.label}</span></p></div>
          <div style={{ position: "absolute", left: "693.7px", top: LEFT_PAGE_TOPS[i], width: "42.4px", height: "35.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 10.18, marginBottom: 0, lineHeight: "38.4px", fontSize: "21.33px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#ff5347", letterSpacing: "3.41px" }}>{item.page}</span></p></div>
        </div>
      ))}
      {right.map((item, i) => (
        <div key={`r-${i}`}>
          <div style={{ position: "absolute", left: "874.0px", top: RIGHT_LABEL_TOPS[i], width: "239.1px", height: "37.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 5.61, marginBottom: 0, lineHeight: "39.82px", fontSize: "28.44px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "28.44px", fontFamily: "'PT Serif', sans-serif", color: "rgba(0,0,0,0.698)", letterSpacing: "-1.14px" }}>{item.label}</span></p></div>
          <div style={{ position: "absolute", left: "1125.6px", top: RIGHT_PAGE_TOPS[i], width: "42.4px", height: "35.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 10.18, marginBottom: 0, lineHeight: "38.4px", fontSize: "21.33px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#ff5347", letterSpacing: "3.41px" }}>{item.page}</span></p></div>
        </div>
      ))}
    </div>
  );
}
