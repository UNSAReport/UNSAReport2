import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '@/packs/assets';

const logo = getTemplateAssetUrl('cloudlet-pitch', 'asset-b00f7859.webp');
const iconSolution1 = getTemplateAssetUrl('cloudlet-pitch', 'asset-2fc608df.webp');
const iconSolution2 = getTemplateAssetUrl('cloudlet-pitch', 'asset-bf5c208c.webp');
const iconSolution3 = getTemplateAssetUrl('cloudlet-pitch', 'asset-64af8525.webp');

export interface CloudletSolution {
  title: string;
  description: string;
}

export interface CloudletInnovativeSolutionsProps {
  brand?: string;
  title?: string;
  solutions?: CloudletSolution[];
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

const DEFAULT_DESCRIPTION = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

/**
 * Tres soluciones innovadoras en tarjetas.
 */
export function CloudletInnovativeSolutions({
  brand = "Cloudlet Tech",
  title = "Our Innovative Solutions",
  solutions = [
    { title: "Solution 01", description: DEFAULT_DESCRIPTION },
    { title: "Solution 02", description: DEFAULT_DESCRIPTION },
    { title: "Solution 03", description: DEFAULT_DESCRIPTION },
  ],
}: CloudletInnovativeSolutionsProps) {
  return (
    <div style={{ ...BG, background: "#d0d7dd" }}>
      <div style={{ position: "absolute", left: "-147.6px", top: "353.2px", width: "650.3px", height: "480.0px", background: "radial-gradient(ellipse at center, rgba(66, 66, 66, 0.2), transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
      <img src={logo} style={{ position: "absolute", left: "66.7px", top: "45.3px", width: "45.1px", height: "45.1px" }} />
      <svg style={{ position: "absolute", left: "601.4px", top: "67.9px", width: "615.8px", height: "586.9px" }} viewBox={`0 0 615.8 586.9`} preserveAspectRatio="none"><path d="M 21.8 0.0 L 594.0 0.0 C 606.1 0.0 615.8 9.7 615.8 21.7 L 615.8 565.2 C 615.8 577.2 606.1 586.9 594.0 586.9 L 21.8 586.9 C 9.7 586.9 0.0 577.2 0.0 565.2 L 0.0 21.7 C 0.0 9.7 9.7 0.0 21.8 0.0 Z" fill="#d0d7dd" stroke="#424242" stroke-width="1.3" /></svg>
      <img src={iconSolution1} style={{ position: "absolute", left: "657.2px", top: "300.8px", width: "115.9px", height: "112.5px" }} />
      <img src={iconSolution2} style={{ position: "absolute", left: "662.4px", top: "108.9px", width: "110.8px", height: "120.6px" }} />
      <img src={iconSolution3} style={{ position: "absolute", left: "662.4px", top: "484.7px", width: "110.8px", height: "110.8px" }} />
      <div style={{ position: "absolute", left: "72.0px", top: "404.8px", width: "481.6px", height: "249.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -10.89, marginBottom: 0, lineHeight: "81.88px", fontSize: "87.11px" }}><span style={{ fontSize: "87.11px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-4.09px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "117.3px", top: "45.5px", width: "324.3px", height: "41.2px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 6.09, marginBottom: 0, lineHeight: "43.27px", fontSize: "30.91px" }}><span style={{ fontSize: "30.91px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-1.45px" }}>{brand}</span></p></div>
      <div style={{ position: "absolute", left: "822.9px", top: "103.7px", width: "359.8px", height: "26.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 1.32, marginBottom: 0, lineHeight: "27.73px", fontSize: "23.11px" }}><span style={{ fontSize: "23.11px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-1.08px" }}>{solutions[0].title}</span></p></div>
      <div style={{ position: "absolute", left: "822.9px", top: "290.4px", width: "359.8px", height: "26.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 1.32, marginBottom: 0, lineHeight: "27.73px", fontSize: "23.11px" }}><span style={{ fontSize: "23.11px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-1.08px" }}>{solutions[1].title}</span></p></div>
      <div style={{ position: "absolute", left: "822.9px", top: "157.8px", width: "348.9px", height: "68.8px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.45, marginBottom: 0, lineHeight: "17.42px", fontSize: "12.44px" }}><span style={{ fontSize: "12.44px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#424242", letterSpacing: "-0.58px" }}>{solutions[0].description}</span></p></div>
      <div style={{ position: "absolute", left: "822.9px", top: "344.5px", width: "348.9px", height: "68.8px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.45, marginBottom: 0, lineHeight: "17.42px", fontSize: "12.44px" }}><span style={{ fontSize: "12.44px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#424242", letterSpacing: "-0.58px" }}>{solutions[1].description}</span></p></div>
      <div style={{ position: "absolute", left: "822.9px", top: "477.1px", width: "359.8px", height: "26.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 1.32, marginBottom: 0, lineHeight: "27.73px", fontSize: "23.11px" }}><span style={{ fontSize: "23.11px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-1.08px" }}>{solutions[2].title}</span></p></div>
      <div style={{ position: "absolute", left: "822.9px", top: "531.2px", width: "348.9px", height: "68.8px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.45, marginBottom: 0, lineHeight: "17.42px", fontSize: "12.44px" }}><span style={{ fontSize: "12.44px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#424242", letterSpacing: "-0.58px" }}>{solutions[2].description}</span></p></div>
    </div>
  );
}
