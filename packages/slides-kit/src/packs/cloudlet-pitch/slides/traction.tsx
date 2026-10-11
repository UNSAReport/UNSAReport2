import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '@/packs/assets';

const defaultChart = getTemplateAssetUrl('cloudlet-pitch', 'asset-8eab7374.webp');

export interface CloudletTractionProps {
  title?: string;
  description?: string;
  metrics?: string[];
  chartSrc?: string;
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

/**
 * Tracción con métricas de crecimiento.
 */
export function CloudletTraction({
  title = "Traction",
  description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  metrics = [
    "20% annual revenue growth",
    "90% maintain customer satisfaction ratings",
    "15% market share in key segments",
  ],
  chartSrc = defaultChart,
}: CloudletTractionProps) {
  return (
    <div style={{ ...BG, background: "#d0d7dd" }}>
      <div style={{ position: "absolute", left: "581.1px", top: "-56.1px", width: "895.3px", height: "660.9px", background: "radial-gradient(ellipse at center, rgba(66, 66, 66, 0.2), transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "72.0px", top: "76.9px", width: "518.0px", height: "108.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -13.55, marginBottom: 0, lineHeight: "101.94px", fontSize: "108.44px" }}><span style={{ fontSize: "108.44px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-5.09px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "246.4px", width: "480.7px", height: "153.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#424242", letterSpacing: "-0.75px" }}>{description}</span></p></div>
      <svg style={{ position: "absolute", left: "62.3px", top: "450.3px", width: "490.4px", height: "52.5px" }} viewBox={`0 0 490.4 52.5`} preserveAspectRatio="none"><path d="M 19.4 0.0 L 471.0 0.0 C 476.2 0.0 481.1 2.0 484.7 5.7 C 488.4 9.3 490.4 14.2 490.4 19.4 L 490.4 33.1 C 490.4 38.3 488.4 43.2 484.7 46.8 C 481.1 50.5 476.2 52.5 471.0 52.5 L 19.4 52.5 C 14.2 52.5 9.3 50.5 5.7 46.8 C 2.0 43.2 0.0 38.3 0.0 33.1 L 0.0 19.4 C 0.0 14.2 2.0 9.3 5.7 5.7 C 9.3 2.0 14.2 0.0 19.4 0.0 Z" fill="#d0d7dd" stroke="#424242" stroke-width="1.3" /></svg>
      <svg style={{ position: "absolute", left: "62.3px", top: "523.0px", width: "490.4px", height: "52.5px" }} viewBox={`0 0 490.4 52.5`} preserveAspectRatio="none"><linearGradient id="g10_4" x1="0.000" y1="0.500" x2="1.000" y2="0.500"><stop offset="0.000" stop-color="#a0cefd" /><stop offset="1.000" stop-color="#e4f2ff" /></linearGradient><path d="M 19.4 0.0 L 471.0 0.0 C 476.2 0.0 481.1 2.0 484.7 5.7 C 488.4 9.3 490.4 14.2 490.4 19.4 L 490.4 33.1 C 490.4 38.3 488.4 43.2 484.7 46.8 C 481.1 50.5 476.2 52.5 471.0 52.5 L 19.4 52.5 C 14.2 52.5 9.3 50.5 5.7 46.8 C 2.0 43.2 0.0 38.3 0.0 33.1 L 0.0 19.4 C 0.0 14.2 2.0 9.3 5.7 5.7 C 9.3 2.0 14.2 0.0 19.4 0.0 Z" fill="url(#g10_4)" stroke="#424242" stroke-width="1.3" /></svg>
      <div style={{ position: "absolute", left: "62.3px", top: "460.5px", width: "490.4px", height: "26.1px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 3.85, marginBottom: 0, lineHeight: "27.37px", fontSize: "19.55px" }}><span style={{ fontSize: "19.55px", fontWeight: 600, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-0.92px" }}>{metrics[0]}</span></p></div>
      <div style={{ position: "absolute", left: "62.3px", top: "534.9px", width: "490.4px", height: "26.1px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 3.85, marginBottom: 0, lineHeight: "27.37px", fontSize: "19.55px" }}><span style={{ fontSize: "19.55px", fontWeight: 600, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-0.92px" }}>{metrics[1]}</span></p></div>
      <svg style={{ position: "absolute", left: "62.3px", top: "595.6px", width: "490.4px", height: "52.5px" }} viewBox={`0 0 490.4 52.5`} preserveAspectRatio="none"><path d="M 19.4 0.0 L 471.0 0.0 C 476.2 0.0 481.1 2.0 484.7 5.7 C 488.4 9.3 490.4 14.2 490.4 19.4 L 490.4 33.1 C 490.4 38.3 488.4 43.2 484.7 46.8 C 481.1 50.5 476.2 52.5 471.0 52.5 L 19.4 52.5 C 14.2 52.5 9.3 50.5 5.7 46.8 C 2.0 43.2 0.0 38.3 0.0 33.1 L 0.0 19.4 C 0.0 14.2 2.0 9.3 5.7 5.7 C 9.3 2.0 14.2 0.0 19.4 0.0 Z" fill="#d0d7dd" stroke="#424242" stroke-width="1.3" /></svg>
      <div style={{ position: "absolute", left: "62.3px", top: "609.2px", width: "490.4px", height: "26.1px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 3.85, marginBottom: 0, lineHeight: "27.37px", fontSize: "19.55px" }}><span style={{ fontSize: "19.55px", fontWeight: 600, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-0.92px" }}>{metrics[2]}</span></p></div>
      <svg style={{ position: "absolute", left: "631.2px", top: "67.9px", width: "585.9px", height: "588.5px" }} viewBox={`0 0 585.9 588.5`} preserveAspectRatio="none"><path d="M 22.9 0.0 L 563.0 0.0 C 569.1 0.0 574.9 2.4 579.2 6.7 C 583.5 11.0 585.9 16.8 585.9 22.9 L 585.9 565.6 C 585.9 578.3 575.7 588.5 563.0 588.5 L 22.9 588.5 C 10.2 588.5 0.0 578.3 0.0 565.6 L 0.0 22.9 C 0.0 10.2 10.2 0.0 22.9 0.0 Z" fill="#d0d7dd" stroke="#424242" stroke-width="1.3" /></svg>
      <img src={chartSrc} style={{ position: "absolute", left: "649.4px", top: "73.6px", width: "549.5px", height: "582.3px" }} />
    </div>
  );
}
