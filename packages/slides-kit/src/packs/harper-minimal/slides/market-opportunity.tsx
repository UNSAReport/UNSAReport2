import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '../../assets';

const visualSegments = getTemplateAssetUrl('harper-minimal', 'asset-e6aefbe6.webp');
const visualDemand = getTemplateAssetUrl('harper-minimal', 'asset-c3142c76.webp');
const visualPenetration = getTemplateAssetUrl('harper-minimal', 'asset-3a20ea07.webp');

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

export interface HarperMarketOpportunityItem {
  caption: string;
  imageSrc: string;
}

export interface HarperMarketOpportunityProps {
  title?: string;
  items?: HarperMarketOpportunityItem[];
  pageNumber?: string;
}

const IMAGE_GEOMETRY = [
  { left: "227.0px", top: "280.2px", width: "130.1px", height: "130.1px" },
  { left: "546.7px", top: "280.2px", width: "186.6px", height: "130.1px" },
  { left: "905.1px", top: "280.2px", width: "165.6px", height: "130.1px" },
];
const CAPTION_LEFTS = ["170.9px", "518.8px", "866.8px"];

/**
 * Oportunidad de mercado con visual (Harper Market Opportunity).
 */
export function HarperMarketOpportunity({
  title = "Market Opportunity",
  items = [
    { caption: "FOCUSED INDUSTRY SEGMENTS", imageSrc: visualSegments },
    { caption: "HIGH SWITCHING DEMAND", imageSrc: visualDemand },
    { caption: "LOW DIGITAL PENETRATION", imageSrc: visualPenetration },
  ],
  pageNumber = "6",
}: HarperMarketOpportunityProps) {
  return (
    <div style={{ ...BG, background: "#fafafa" }}>
      <div style={{ position: "absolute", left: "72.0px", top: "152.6px", width: "75.4px", height: "6.7px", backgroundColor: "#ff5347" }} />
      {items.map((item, i) => (
        <img key={`img-${i}`} src={item.imageSrc} style={{ position: "absolute", left: IMAGE_GEOMETRY[i].left, top: IMAGE_GEOMETRY[i].top, width: IMAGE_GEOMETRY[i].width, height: IMAGE_GEOMETRY[i].height }} />
      ))}
      <div style={{ position: "absolute", left: "72.0px", top: "63.3px", width: "484.6px", height: "68.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 9.81, marginBottom: 0, lineHeight: "69.69px", fontSize: "49.78px" }}><span style={{ fontSize: "49.78px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "-1.99px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "1165.6px", top: "612.1px", width: "42.4px", height: "35.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 10.18, marginBottom: 0, lineHeight: "38.4px", fontSize: "21.33px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#ff5347", letterSpacing: "3.41px" }}>{pageNumber}</span></p></div>
      {items.map((item, i) => (
        <div key={`cap-${i}`} style={{ position: "absolute", left: CAPTION_LEFTS[i], top: "457.3px", width: "242.3px", height: "58.4px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 4.2, marginBottom: 0, lineHeight: "29.86px", fontSize: "21.33px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "21.33px", fontWeight: 700, fontFamily: "'Roboto', sans-serif", color: "#000000", letterSpacing: "1.71px" }}>{item.caption}</span></p></div>
      ))}
    </div>
  );
}
