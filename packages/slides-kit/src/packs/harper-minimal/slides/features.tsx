import type { CSSProperties } from 'react';
import iconAutomation from '../../../assets/harper/asset-56010f13.webp';
import iconCompliance from '../../../assets/harper/asset-75cfbe2c.webp';
import iconRealtime from '../../../assets/harper/asset-7caad1a8.webp';
import iconMobile from '../../../assets/harper/asset-df584510.webp';
import iconWorkflow from '../../../assets/harper/asset-f89547e3.webp';

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

export interface HarperFeaturesItem {
  label: string;
  iconSrc: string;
}

export interface HarperFeaturesProps {
  title?: string;
  intro?: string;
  features?: HarperFeaturesItem[];
  pageNumber?: string;
}

const CARD_GEOMETRY = [
  { left: "510.9px", top: "197.3px" },
  { left: "744.2px", top: "197.3px" },
  { left: "977.6px", top: "197.3px" },
  { left: "510.9px", top: "425.1px" },
  { left: "744.2px", top: "425.1px" },
];
const ICON_GEOMETRY = [
  { left: "567.9px", top: "224.9px", width: "76.9px", height: "74.9px" },
  { left: "800.6px", top: "224.9px", width: "77.0px", height: "74.9px" },
  { left: "1036.4px", top: "224.9px", width: "73.3px", height: "74.9px" },
  { left: "584.0px", top: "452.8px", width: "44.7px", height: "74.9px" },
  { left: "799.9px", top: "457.9px", width: "79.6px", height: "64.6px" },
];
const LABEL_GEOMETRY = [
  { left: "529.3px", top: "314.6px" },
  { left: "762.7px", top: "314.6px" },
  { left: "996.0px", top: "314.6px" },
  { left: "529.3px", top: "542.4px" },
  { left: "762.7px", top: "542.4px" },
];

/**
 * Características clave en tarjetas (Harper Features).
 */
export function HarperFeatures({
  title = "Key Features",
  intro = "Each feature is purpose-built to reflect the real working environment and user needs.",
  features = [
    { label: "Workflow Automation", iconSrc: iconAutomation },
    { label: "Compliance Monitoring", iconSrc: iconCompliance },
    { label: "Real-Time Data Access", iconSrc: iconRealtime },
    { label: "Mobile-Friendly Interface", iconSrc: iconMobile },
    { label: "Workflow Automation", iconSrc: iconWorkflow },
  ],
  pageNumber = "9",
}: HarperFeaturesProps) {
  return (
    <div style={{ ...BG, background: "#fafafa" }}>
      <svg style={{ position: "absolute", left: "72.0px", top: "152.6px", width: "75.4px", height: "6.7px", overflow: "visible" }} viewBox={`0 0 75.4 6.7`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="75.4" y2="0.0" stroke="#ff5347" strokeWidth="6.7" /></svg>
      {features.map((feature, i) => (
        <div key={`card-${i}`}>
          <svg style={{ position: "absolute", left: CARD_GEOMETRY[i].left, top: CARD_GEOMETRY[i].top, width: "191.0px", height: "191.0px" }} viewBox={`0 0 191.0 191.0`} preserveAspectRatio="none"><path d="M 6.7 0.0 L 184.3 0.0 C 186.1 0.0 187.8 0.7 189.0 2.0 C 190.3 3.2 191.0 4.9 191.0 6.7 L 191.0 184.3 C 191.0 186.1 190.3 187.8 189.0 189.0 C 187.8 190.3 186.1 191.0 184.3 191.0 L 6.7 191.0 C 4.9 191.0 3.2 190.3 2.0 189.0 C 0.7 187.8 0.0 186.1 0.0 184.3 L 0.0 6.7 C 0.0 4.9 0.7 3.2 2.0 2.0 C 3.2 0.7 4.9 0.0 6.7 0.0 Z" fill="#f5f5f5" /></svg>
          <img src={feature.iconSrc} style={{ position: "absolute", left: ICON_GEOMETRY[i].left, top: ICON_GEOMETRY[i].top, width: ICON_GEOMETRY[i].width, height: ICON_GEOMETRY[i].height }} />
          <div style={{ position: "absolute", left: LABEL_GEOMETRY[i].left, top: LABEL_GEOMETRY[i].top, width: "154.1px", height: "51.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 3.67, marginBottom: 0, lineHeight: "26.13px", fontSize: "18.67px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "18.67px", fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "0.37px" }}>{feature.label}</span></p></div>
        </div>
      ))}
      <div style={{ position: "absolute", left: "72.0px", top: "63.3px", width: "484.6px", height: "68.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 9.81, marginBottom: 0, lineHeight: "69.69px", fontSize: "49.78px" }}><span style={{ fontSize: "49.78px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "-1.99px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "1165.6px", top: "612.1px", width: "42.4px", height: "35.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 10.18, marginBottom: 0, lineHeight: "38.4px", fontSize: "21.33px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#ff5347", letterSpacing: "3.41px" }}>{pageNumber}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "198.6px", width: "344.8px", height: "104.4px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.91, marginBottom: 0, lineHeight: "34.84px", fontSize: "24.88px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "24.88px", fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "0.49px" }}>{intro}</span></p></div>
    </div>
  );
}
