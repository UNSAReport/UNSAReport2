import type { CSSProperties } from 'react';
import iconEstablished from '../../../assets/harper/asset-7f32be17.webp';
import iconClients from '../../../assets/harper/asset-58cbd8d4.webp';
import iconMembers from '../../../assets/harper/asset-3e40ae84.webp';

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

export interface HarperStatsItem {
  value: string;
  label: string;
  iconSrc: string;
}

export interface HarperStatsProps {
  title?: string;
  description?: string;
  stats?: HarperStatsItem[];
  pageNumber?: string;
}

const CIRCLE_TOPS = ["132.3px", "310.1px", "488.0px"];
const ICON_GEOMETRY = [
  { left: "876.6px", top: "155.5px", width: "53.3px", height: "53.3px" },
  { left: "873.2px", top: "334.1px", width: "60.0px", height: "53.3px" },
  { left: "875.1px", top: "509.7px", width: "56.2px", height: "56.2px" },
];
const VALUE_TOPS = ["121.3px", "299.2px", "477.0px"];
const LABEL_TOPS = ["201.1px", "378.9px", "556.8px"];

/**
 * Tres estadísticas con numerales grandes (Harper Stats).
 */
export function HarperStats({
  title = "About Us",
  description = "We build tailored digital tools that streamline operations, reduce inefficiencies, and elevate performance across vertical markets. Our approach focuses on solving industry-specific challenges with scalable software solutions.",
  stats = [
    { value: "2023", label: "ESTABLISHED", iconSrc: iconEstablished },
    { value: "150", label: "CLIENTS", iconSrc: iconClients },
    { value: "30", label: "MEMBERS", iconSrc: iconMembers },
  ],
  pageNumber = "3",
}: HarperStatsProps) {
  return (
    <div style={{ ...BG, background: "#f5f5f5" }}>
      <svg style={{ position: "absolute", left: "0.0px", top: "0.0px", width: "773.4px", height: "720.0px" }} viewBox={`0 0 773.4 720.0`} preserveAspectRatio="none"><path d="M 0.0 0.0 L 773.4 0.0 L 773.4 720.0 L 0.0 720.0 Z" fill="#fafafa" /></svg>
      <svg style={{ position: "absolute", left: "72.0px", top: "152.6px", width: "75.4px", height: "6.7px", overflow: "visible" }} viewBox={`0 0 75.4 6.7`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="75.4" y2="0.0" stroke="#ff5347" strokeWidth="6.7" /></svg>
      <div style={{ position: "absolute", left: "72.0px", top: "63.3px", width: "484.6px", height: "68.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 9.81, marginBottom: 0, lineHeight: "69.69px", fontSize: "49.78px" }}><span style={{ fontSize: "49.78px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "-1.99px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "338.0px", width: "484.6px", height: "243.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.91, marginBottom: 0, lineHeight: "34.84px", fontSize: "24.88px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "24.88px", fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "0.49px" }}>{description}</span></p></div>
      <div style={{ position: "absolute", left: "1165.6px", top: "612.1px", width: "42.4px", height: "35.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 10.18, marginBottom: 0, lineHeight: "38.4px", fontSize: "21.33px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#ff5347", letterSpacing: "3.41px" }}>{pageNumber}</span></p></div>
      {stats.map((stat, i) => (
        <div key={`stat-${i}`}>
          <svg style={{ position: "absolute", left: "853.3px", top: CIRCLE_TOPS[i], width: "99.7px", height: "99.7px" }} viewBox={`0 0 99.7 99.7`} preserveAspectRatio="none"><path d="M 49.8 0.0 C 22.3 0.0 0.0 22.3 0.0 49.8 C 0.0 77.4 22.3 99.7 49.8 99.7 C 77.4 99.7 99.7 77.4 99.7 49.8 C 99.7 22.3 77.4 0.0 49.8 0.0 Z" fill="#ff8a80" /></svg>
          <img src={stat.iconSrc} style={{ position: "absolute", left: ICON_GEOMETRY[i].left, top: ICON_GEOMETRY[i].top, width: ICON_GEOMETRY[i].width, height: ICON_GEOMETRY[i].height }} />
          <div style={{ position: "absolute", left: "991.7px", top: VALUE_TOPS[i], width: "216.3px", height: "79.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 11.65, marginBottom: 0, lineHeight: "82.8px", fontSize: "59.14px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "59.14px", fontWeight: 700, fontFamily: "'PT Serif', sans-serif", color: "rgba(0,0,0,0.698)", letterSpacing: "-2.36px" }}>{stat.value}</span></p></div>
          <div style={{ position: "absolute", left: "991.7px", top: LABEL_TOPS[i], width: "216.3px", height: "32.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.69, marginBottom: 0, lineHeight: "33.32px", fontSize: "23.8px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "23.8px", fontFamily: "'Roboto', sans-serif", color: "rgba(0,0,0,0.698)", letterSpacing: "1.42px" }}>{stat.label}</span></p></div>
        </div>
      ))}
    </div>
  );
}
