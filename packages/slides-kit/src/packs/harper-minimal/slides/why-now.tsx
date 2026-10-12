import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '../../assets';

const stripPhoto = getTemplateAssetUrl('harper-minimal', 'asset-52a381c8.jpg');

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

export interface HarperWhyNowProps {
  title?: string;
  heading?: string;
  description?: string;
  stripSrc?: string;
  pageNumber?: string;
}

/**
 * Por qué ahora con razones temporales (Harper Why Now).
 */
export function HarperWhyNow({
  title = "Why Now",
  heading = "Timing Aligns with Digital Readiness",
  description = "Advancements in cloud infrastructure, mobile access, and remote work adoption have made the market more receptive to niche software that solves focused, operational pain points.",
  stripSrc = stripPhoto,
  pageNumber = "7",
}: HarperWhyNowProps) {
  return (
    <div style={{ ...BG, background: "#fafafa" }}>
      <div style={{ position: "absolute", left: "72.0px", top: "152.6px", width: "75.4px", height: "6.7px", backgroundColor: "#ff5347" }} />
      <div style={{ position: "absolute", left: "72.0px", top: "63.3px", width: "484.6px", height: "68.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 9.81, marginBottom: 0, lineHeight: "69.69px", fontSize: "49.78px" }}><span style={{ fontSize: "49.78px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "-1.99px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "511.7px", top: "214.7px", width: "696.3px", height: "139.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.91, marginBottom: 0, lineHeight: "34.84px", fontSize: "24.88px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "24.88px", fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "0.49px" }}>{description}</span></p></div>
      <div style={{ position: "absolute", left: "0.0px", top: "427.3px", width: "1280.0px", height: "292.7px", overflow: "hidden" }}><img src={stripSrc} style={{ position: "absolute", left: "0.0px", top: "-333.6px", width: "1280.0px", height: "959.9px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "1165.6px", top: "612.1px", width: "42.4px", height: "35.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 10.18, marginBottom: 0, lineHeight: "38.4px", fontSize: "21.33px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#ff5347", letterSpacing: "3.41px" }}>{pageNumber}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "212.0px", width: "381.9px", height: "101.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 7.36, marginBottom: 0, lineHeight: "52.27px", fontSize: "37.33px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "37.33px", fontFamily: "'PT Serif', sans-serif", color: "#000000", letterSpacing: "0.75px" }}>{heading}</span></p></div>
    </div>
  );
}
