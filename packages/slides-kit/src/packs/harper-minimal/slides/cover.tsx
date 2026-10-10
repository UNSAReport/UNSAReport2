import type { CSSProperties } from 'react';
import grainTexture from '../../../assets/harper/asset-56d4e034.webp';

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

export interface HarperCoverProps {
  title?: string;
  subtitle?: string;
  brand?: string;
}

/**
 * Portada minimalista con textura de grano coral (Harper Cover).
 */
export function HarperCover({
  title = "Pitch Deck",
  subtitle = "Ingoude Company",
  brand = "HARPER RUSSO",
}: HarperCoverProps) {
  return (
    <div style={{ ...BG, background: "#fafafa" }}>
      <svg style={{ position: "absolute", left: "112.0px", top: "443.6px", width: "75.4px", height: "6.7px", overflow: "visible" }} viewBox={`0 0 75.4 6.7`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="75.4" y2="0.0" stroke="#ff5347" strokeWidth="6.7" /></svg>
      <div style={{ position: "absolute", left: "817.1px", top: "0.0px", width: "462.9px", height: "720.0px", overflow: "hidden" }}><img src={grainTexture} style={{ position: "absolute", left: "-462.9px", top: "-102.9px", width: "925.8px", height: "925.8px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "112.0px", top: "177.9px", width: "528.0px", height: "144.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 21.01, marginBottom: 0, lineHeight: "149.33px", fontSize: "106.67px" }}><span style={{ fontSize: "106.67px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "-4.27px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "112.0px", top: "538.0px", width: "303.6px", height: "19.8px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 2.8, marginBottom: 0, lineHeight: "19.9px", fontSize: "14.21px" }}><span style={{ fontSize: "14.21px", fontFamily: "'Roboto', sans-serif", color: "rgba(0,0,0,0.698)", letterSpacing: "1.41px" }}>{brand}</span></p></div>
      <div style={{ position: "absolute", left: "112.0px", top: "494.1px", width: "303.6px", height: "37.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 5.61, marginBottom: 0, lineHeight: "39.82px", fontSize: "28.44px" }}><span style={{ fontSize: "28.44px", fontFamily: "'PT Serif', sans-serif", color: "rgba(0,0,0,0.698)", letterSpacing: "-1.14px" }}>{subtitle}</span></p></div>
    </div>
  );
}
