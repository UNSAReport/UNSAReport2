import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '@/packs/assets';

const logo = getTemplateAssetUrl('cloudlet-pitch', 'asset-b00f7859.webp');
const iconPhone = getTemplateAssetUrl('cloudlet-pitch', 'asset-c066a954.webp');
const iconWeb = getTemplateAssetUrl('cloudlet-pitch', 'asset-0b46f5d7.webp');
const iconMail = getTemplateAssetUrl('cloudlet-pitch', 'asset-fda9ff09.webp');
const iconPin = getTemplateAssetUrl('cloudlet-pitch', 'asset-e0e616bd.webp');

export interface CloudletThankYouProps {
  brand?: string;
  presentedLabel?: string;
  presenter?: string;
  title?: string;
  subtitle?: string;
  contacts?: string[];
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

/**
 * Cierre de agradecimiento.
 */
export function CloudletThankYou({
  brand = "Cloudlet Tech",
  presentedLabel = "Presented by :",
  presenter = "Adam Fletcher",
  title = "Thank You",
  subtitle = "for your time and attention",
  contacts = [
    "+123-456-7890",
    "www.reallygreatsite.com",
    "hello@reallygreatsite.com",
    "123 Anywhere St., Any City, ST 12345",
  ],
}: CloudletThankYouProps) {
  return (
    <div style={{ ...BG, background: "#d0d7dd" }}>
      <div style={{ position: "absolute", left: "581.1px", top: "-56.1px", width: "895.3px", height: "660.9px", background: "radial-gradient(ellipse at center, rgba(66, 66, 66, 0.25), transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "-102.6px", top: "-77.3px", width: "421.2px", height: "251.9px", background: "radial-gradient(ellipse at center, rgba(66, 66, 66, 0.15), transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "-64.7px", top: "363.2px", width: "330.1px", height: "437.5px", background: "radial-gradient(ellipse at center, rgba(66, 66, 66, 0.1), transparent 70%)", filter: "blur(20px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "72.0px", top: "258.4px", width: "677.0px", height: "423.8px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -27.3, marginBottom: 0, lineHeight: "205.29px", fontSize: "218.39px" }}><span style={{ fontSize: "218.39px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-10.26px" }}>{title}</span></p></div>
      <svg style={{ position: "absolute", left: "73.2px", top: "103.6px", width: "1134.8px", height: "1.3px", overflow: "visible" }} viewBox={`0 0 1134.8 1.3`} preserveAspectRatio="none"><line x1="0.0" y1="0.0" x2="1134.8" y2="0.0" stroke="#424242" strokeWidth="1.3" /></svg>
      <img src={logo} style={{ position: "absolute", left: "66.7px", top: "45.3px", width: "45.1px", height: "45.1px" }} />
      <img src={iconPhone} style={{ position: "absolute", left: "901.0px", top: "417.7px", width: "24.9px", height: "24.9px" }} />
      <img src={iconWeb} style={{ position: "absolute", left: "900.8px", top: "479.3px", width: "25.1px", height: "25.1px" }} />
      <img src={iconMail} style={{ position: "absolute", left: "900.8px", top: "541.0px", width: "25.1px", height: "25.1px" }} />
      <img src={iconPin} style={{ position: "absolute", left: "901.0px", top: "600.7px", width: "24.9px", height: "24.9px" }} />
      <div style={{ position: "absolute", left: "117.3px", top: "45.5px", width: "279.0px", height: "41.2px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 6.09, marginBottom: 0, lineHeight: "43.27px", fontSize: "30.91px" }}><span style={{ fontSize: "30.91px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-1.45px" }}>{brand}</span></p></div>
      <div style={{ position: "absolute", left: "966.5px", top: "43.6px", width: "241.5px", height: "19.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 1.58, marginBottom: 0, lineHeight: "20.16px", fontSize: "16.0px" }}><span style={{ fontSize: "16.0px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-0.89px" }}>{presentedLabel}</span></p></div>
      <div style={{ position: "absolute", left: "966.5px", top: "64.4px", width: "241.5px", height: "22.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "right", marginTop: 1.76, marginBottom: 0, lineHeight: "22.4px", fontSize: "17.78px" }}><span style={{ fontSize: "17.78px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 400, color: "#424242", letterSpacing: "-1.0px" }}>{presenter}</span></p></div>
      <div style={{ position: "absolute", left: "504.0px", top: "549.3px", width: "245.0px", height: "86.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.46, marginBottom: 0, lineHeight: "43.92px", fontSize: "34.85px" }}><span style={{ fontSize: "34.85px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#424242", letterSpacing: "-1.95px" }}>{subtitle}</span></p></div>
      <div style={{ position: "absolute", left: "941.0px", top: "418.1px", width: "281.6px", height: "21.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "justify", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 400, color: "#393939", letterSpacing: "-0.64px" }}>{contacts[0]}</span></p></div>
      <div style={{ position: "absolute", left: "941.0px", top: "479.8px", width: "281.6px", height: "21.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "justify", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 400, color: "#393939", letterSpacing: "-0.64px" }}>{contacts[1]}</span></p></div>
      <div style={{ position: "absolute", left: "941.0px", top: "541.5px", width: "281.6px", height: "21.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "justify", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 400, color: "#393939", letterSpacing: "-0.64px" }}>{contacts[2]}</span></p></div>
      <div style={{ position: "absolute", left: "941.0px", top: "603.0px", width: "281.6px", height: "21.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "justify", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 400, color: "#393939", letterSpacing: "-0.64px" }}>{contacts[3]}</span></p></div>
    </div>
  );
}
