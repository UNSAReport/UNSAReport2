import type { CSSProperties } from 'react';
import photoImage from '../../../assets/harper/asset-69df195b.jpg';

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

export interface HarperProblemProps {
  title?: string;
  tagline?: string;
  description?: string;
  photoSrc?: string;
  pageNumber?: string;
}

/**
 * El problema con texto editorial (Harper Problem).
 */
export function HarperProblem({
  title = "The Problem",
  tagline = "FRAGMENTED TOOLS, OUTDATED SYSTEMS, SLOW PROGRESS",
  description = "Many industries still rely on legacy systems, manual processes, and disconnected tools. This results in costly inefficiencies, compliance risks, and missed opportunities to optimize operations.",
  photoSrc = photoImage,
  pageNumber = "4",
}: HarperProblemProps) {
  return (
    <div style={{ ...BG, background: "#fafafa" }}>
      <svg style={{ position: "absolute", left: "72.0px", top: "152.6px", width: "75.4px", height: "6.7px", overflow: "visible" }} viewBox={`0 0 75.4 6.7`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="75.4" y2="0.0" stroke="#ff5347" strokeWidth="6.7" /></svg>
      <div style={{ position: "absolute", left: "773.4px", top: "0.0px", width: "506.6px", height: "720.0px", overflow: "hidden" }}><img src={photoSrc} style={{ position: "absolute", left: "-479.7px", top: "0.0px", width: "1440.1px", height: "720.0px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "72.0px", top: "63.3px", width: "484.6px", height: "68.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 9.81, marginBottom: 0, lineHeight: "69.69px", fontSize: "49.78px" }}><span style={{ fontSize: "49.78px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "-1.99px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "346.7px", width: "484.6px", height: "208.4px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.91, marginBottom: 0, lineHeight: "34.84px", fontSize: "24.88px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "24.88px", fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "0.49px" }}>{description}</span></p></div>
      <div style={{ position: "absolute", left: "1165.6px", top: "612.1px", width: "42.4px", height: "35.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 10.18, marginBottom: 0, lineHeight: "38.4px", fontSize: "21.33px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#ff5347", letterSpacing: "3.41px" }}>{pageNumber}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "253.6px", width: "415.1px", height: "58.4px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.2, marginBottom: 0, lineHeight: "29.86px", fontSize: "21.33px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#ff8a80", letterSpacing: "1.71px" }}>{tagline}</span></p></div>
    </div>
  );
}
