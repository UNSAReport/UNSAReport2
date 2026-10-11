import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '@/packs/assets';

const defaultChart = getTemplateAssetUrl('cloudlet-pitch', 'asset-d667807b.webp');

export interface CloudletUseOfFundsProps {
  title?: string;
  description?: string;
  points?: string[];
  chartSrc?: string;
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

const DEFAULT_POINT = "•  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

/**
 * Uso de fondos con desglose.
 */
export function CloudletUseOfFunds({
  title = "Use of Funds",
  description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  points = [DEFAULT_POINT, DEFAULT_POINT, DEFAULT_POINT, DEFAULT_POINT],
  chartSrc = defaultChart,
}: CloudletUseOfFundsProps) {
  return (
    <div style={{ ...BG, background: "#424242" }}>
      <div style={{ position: "absolute", left: "444.2px", top: "-119.8px", width: "988.2px", height: "639.6px", background: "radial-gradient(ellipse at center, rgba(208, 215, 221, 0.15), transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
      <svg style={{ position: "absolute", left: "656.4px", top: "239.9px", width: "560.7px", height: "419.5px" }} viewBox={`0 0 560.7 419.5`} preserveAspectRatio="none"><path d="M 20.5 0.0 L 540.2 0.0 C 545.6 0.0 550.8 2.2 554.7 6.0 C 558.5 9.9 560.7 15.1 560.7 20.5 L 560.7 399.0 C 560.7 404.4 558.5 409.6 554.7 413.5 C 550.8 417.3 545.6 419.5 540.2 419.5 L 20.5 419.5 C 15.1 419.5 9.9 417.3 6.0 413.5 C 2.2 409.6 0.0 404.4 0.0 399.0 L 0.0 20.5 C 0.0 15.1 2.2 9.9 6.0 6.0 C 9.9 2.2 15.1 0.0 20.5 0.0 Z" fill="#424242" stroke="#d0d7dd" stroke-width="1.3" /></svg>
      <div style={{ position: "absolute", left: "72.0px", top: "73.2px", width: "1136.0px", height: "108.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: -13.55, marginBottom: 0, lineHeight: "101.94px", fontSize: "108.44px" }}><span style={{ fontSize: "108.44px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#ffffff", letterSpacing: "-5.09px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "254.0px", width: "457.3px", height: "153.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{description}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "443.8px", width: "457.3px", height: "43.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "27.2px", textIndent: "-13.6px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{points[0]}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "497.9px", width: "457.3px", height: "43.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "27.2px", textIndent: "-13.6px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{points[1]}</span></p></div>
      <img src={chartSrc} style={{ position: "absolute", left: "717.4px", top: "221.5px", width: "461.8px", height: "456.2px" }} />
      <div style={{ position: "absolute", left: "72.0px", top: "551.9px", width: "457.3px", height: "43.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "27.2px", textIndent: "-13.6px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{points[2]}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "605.9px", width: "457.3px", height: "43.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px", marginLeft: "27.2px", textIndent: "-13.6px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{points[3]}</span></p></div>
    </div>
  );
}
