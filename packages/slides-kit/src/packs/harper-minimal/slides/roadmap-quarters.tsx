import type { CSSProperties } from 'react';

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

export interface HarperRoadmapQuartersQuarter {
  quarter: string;
  bullets: string[];
}

export interface HarperRoadmapQuartersProps {
  title?: string;
  quarters?: HarperRoadmapQuartersQuarter[];
  pageNumber?: string;
}

const CARD_LEFTS = ["72.5px", "365.4px", "658.3px", "951.2px"];
const CARD_FILLS = ["rgba(255,138,128,0.196)", "rgba(255,138,128,0.498)", "rgba(255,138,128,0.698)", "rgba(255,138,128,0.898)"];
const QUARTER_LEFTS = ["96.5px", "388.9px", "681.4px", "973.9px"];
const QUARTER_WIDTHS = ["122.4px", "122.6px", "122.6px", "122.6px"];
const BULLETS_LEFTS = ["90.0px", "382.5px", "674.9px", "967.4px"];
const DIVIDER_LEFTS = ["89.5px", "382.5px", "675.4px", "968.3px"];

/**
 * Hoja de ruta por trimestres (Harper Roadmap Quarters).
 */
export function HarperRoadmapQuarters({
  title = "Roadmap",
  quarters = [
    { quarter: "Q1", bullets: ["•  Platform foundation with essential features", "•  Early deployment with pilot customers"] },
    { quarter: "Q2", bullets: ["•  Release of optional feature add-ons", "•  System improvements for speed and scalability"] },
    { quarter: "Q3", bullets: ["•  Support for integration with business systems", "•  Streamlined data sync and automation"] },
    { quarter: "Q4", bullets: ["•  Team workspace tools and sharing controls", "•  Enhanced reporting and scenario planning"] },
  ],
  pageNumber = "11",
}: HarperRoadmapQuartersProps) {
  return (
    <div style={{ ...BG, background: "#fafafa" }}>
      <svg style={{ position: "absolute", left: "72.0px", top: "152.6px", width: "75.4px", height: "6.7px", overflow: "visible" }} viewBox={`0 0 75.4 6.7`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="75.4" y2="0.0" stroke="#ff5347" strokeWidth="6.7" /></svg>
      <div style={{ position: "absolute", left: "72.0px", top: "63.3px", width: "484.6px", height: "68.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 9.81, marginBottom: 0, lineHeight: "69.69px", fontSize: "49.78px" }}><span style={{ fontSize: "49.78px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "-1.99px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "1165.6px", top: "612.1px", width: "42.4px", height: "35.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 10.18, marginBottom: 0, lineHeight: "38.4px", fontSize: "21.33px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#ff5347", letterSpacing: "3.41px" }}>{pageNumber}</span></p></div>
      {quarters.map((item, i) => (
        <div key={`q-${i}`}>
          <svg style={{ position: "absolute", left: CARD_LEFTS[i], top: "217.9px", width: "256.8px", height: "371.4px" }} viewBox={`0 0 256.8 371.4`} preserveAspectRatio="none"><path d="M 5.4 0.0 L 251.4 0.0 C 254.4 0.0 256.8 2.4 256.8 5.4 L 256.8 366.0 C 256.8 369.0 254.4 371.4 251.4 371.4 L 5.4 371.4 C 2.4 371.4 0.0 369.0 0.0 366.0 L 0.0 5.4 C 0.0 2.4 2.4 0.0 5.4 0.0 Z" fill={CARD_FILLS[i]} /></svg>
          <div style={{ position: "absolute", left: QUARTER_LEFTS[i], top: "225.7px", width: QUARTER_WIDTHS[i], height: "102.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 14.92, marginBottom: 0, lineHeight: "106.04px", fontSize: "75.74px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "75.74px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "1.51px" }}>{item.quarter}</span></p></div>
          <div style={{ position: "absolute", left: BULLETS_LEFTS[i], top: "383.2px", width: "222.6px", height: "170.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}>{item.bullets.map((bullet, j) => (
            <p key={`qb-${j}`} style={{ textAlign: "left", marginTop: j === 0 ? 4.08 : 0, marginBottom: 0, lineHeight: "28.92px", fontSize: "20.65px", marginLeft: "35.1px", textIndent: "-17.6px" }}><span style={{ fontSize: "20.65px", fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "0.41px" }}>{bullet}</span></p>
          ))}</div>
          <svg style={{ position: "absolute", left: DIVIDER_LEFTS[i], top: "358.7px", width: "222.6px", height: "2.7px", overflow: "visible" }} viewBox={`0 0 222.6 2.7`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="222.6" y2="0.0" stroke="#ff5347" strokeWidth="2.7" /></svg>
        </div>
      ))}
    </div>
  );
}
