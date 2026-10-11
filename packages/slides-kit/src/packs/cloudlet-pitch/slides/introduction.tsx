import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '@/packs/assets';

const defaultPhoto = getTemplateAssetUrl('cloudlet-pitch', 'asset-6a656244.jpg');

export interface CloudletIntroductionProps {
  title?: string;
  bodyLeft?: string;
  bodyRight?: string;
  photoSrc?: string;
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

/**
 * Introducción de la empresa con foto.
 */
export function CloudletIntroduction({
  title = "Introduction",
  bodyLeft = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  bodyRight = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  photoSrc = defaultPhoto,
}: CloudletIntroductionProps) {
  return (
    <div style={{ ...BG, background: "#424242" }}>
      <div style={{ position: "absolute", left: "4.5px", top: "252.2px", width: "1283.6px", height: "658.1px", background: "radial-gradient(ellipse at center, rgba(208, 215, 221, 0.15), transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "-14.3px", top: "-14.5px", width: "1308.5px", height: "332.1px", overflow: "hidden" }}><img src={photoSrc} style={{ position: "absolute", left: "0.0px", top: "-560.8px", width: "1308.5px", height: "1869.6px", maxWidth: "none" }} /></div>
      <svg style={{ position: "absolute", left: "62.6px", top: "191.0px", width: "1154.5px", height: "468.4px" }} viewBox={`0 0 1154.5 468.4`} preserveAspectRatio="none"><path d="M 11.6 0.0 L 1142.9 0.0 C 1146.0 0.0 1148.9 1.2 1151.1 3.4 C 1153.3 5.6 1154.5 8.5 1154.5 11.6 L 1154.5 456.8 C 1154.5 463.2 1149.3 468.4 1142.9 468.4 L 11.6 468.4 C 8.5 468.4 5.6 467.2 3.4 465.0 C 1.2 462.8 0.0 459.9 0.0 456.8 L 0.0 11.6 C 0.0 5.2 5.2 0.0 11.6 0.0 Z" fill="#424242" stroke="#d0d7dd" stroke-width="1.3" /></svg>
      <svg style={{ position: "absolute", left: "1153.9px", top: "218.5px", width: "33.6px", height: "33.6px" }} viewBox={`0 0 33.6 33.6`} preserveAspectRatio="none"><linearGradient id="g3_3" x1="0.000" y1="0.500" x2="1.000" y2="0.500"><stop offset="0.000" stop-color="#a0cefd" /><stop offset="1.000" stop-color="#e4f2ff" /></linearGradient><path d="M 16.8 0.0 C 7.5 0.0 0.0 7.5 0.0 16.8 C 0.0 26.1 7.5 33.6 16.8 33.6 C 26.1 33.6 33.6 26.1 33.6 16.8 C 33.6 7.5 26.1 0.0 16.8 0.0 Z" fill="url(#g3_3)" stroke="#ffffff" stroke-width="0.7" /></svg>
      <div style={{ position: "absolute", left: "112.1px", top: "254.1px", width: "710.9px", height: "109.1px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -13.56, marginBottom: 0, lineHeight: "101.9px", fontSize: "108.41px" }}><span style={{ fontSize: "108.41px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#ffffff", letterSpacing: "-5.09px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "112.1px", top: "446.4px", width: "458.4px", height: "153.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{bodyLeft}</span></p></div>
      <div style={{ position: "absolute", left: "658.1px", top: "446.4px", width: "458.4px", height: "153.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{bodyRight}</span></p></div>
    </div>
  );
}
