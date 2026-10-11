import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '../../assets';

const backgroundPhoto = getTemplateAssetUrl('harper-minimal', 'asset-5cb530b7.jpg');

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

export interface HarperProductOverviewProps {
  tag?: string;
  description?: string;
  backgroundSrc?: string;
  pageNumber?: string;
}

/**
 * Resumen de producto con visual (Harper Product Overview).
 */
export function HarperProductOverview({
  tag = "PRODUCT OVERVIEW",
  description = "Intuitive, customizable, and support daily tasks with minimal training",
  backgroundSrc = backgroundPhoto,
  pageNumber = "8",
}: HarperProductOverviewProps) {
  return (
    <div style={{ ...BG, background: "#fafafa" }}>
      <div style={{ position: "absolute", left: "0.0px", top: "0.0px", width: "1280.0px", height: "720.0px", overflow: "hidden" }}><img src={backgroundSrc} style={{ position: "absolute", left: "0.0px", top: "-98.7px", width: "1280.0px", height: "854.1px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: 0, top: 0, width: "834.4px", height: "720.0px", background: "linear-gradient(to right, #000000 0%, rgba(0,0,0,0) 100%)" }} />
      <div style={{ position: "absolute", left: "72.0px", top: "509.4px", width: "75.4px", height: "6.7px", backgroundColor: "#ff5347" }} />
      <div style={{ position: "absolute", left: "72.0px", top: "546.8px", width: "616.1px", height: "87.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 6.3, marginBottom: 0, lineHeight: "44.8px", fontSize: "32.0px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "32.0px", fontWeight: 700, fontFamily: "'PT Serif', sans-serif", color: "#fafafa", letterSpacing: "0.64px" }}>{description}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "450.4px", width: "373.7px", height: "29.1px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.2, marginBottom: 0, lineHeight: "29.86px", fontSize: "21.33px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#fafafa", letterSpacing: "1.71px" }}>{tag}</span></p></div>
      <div style={{ position: "absolute", left: "1165.6px", top: "612.1px", width: "42.4px", height: "35.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 10.18, marginBottom: 0, lineHeight: "38.4px", fontSize: "21.33px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#ff5347", letterSpacing: "3.41px" }}>{pageNumber}</span></p></div>
    </div>
  );
}
