import type { CSSProperties } from 'react';
import washBand from '../../../assets/cloudlet/asset-e83353b0.webp';
import logo from '../../../assets/cloudlet/asset-54672936.webp';
import defaultGraphic from '../../../assets/cloudlet/asset-88f73f3f.webp';

export interface CloudletMarketSizeProps {
  brand?: string;
  title?: string;
  description?: string;
  highlightValue?: string;
  highlightCaption?: string;
  metricValue?: string;
  metricCaption?: string;
  graphicSrc?: string;
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

/**
 * Tamaño de mercado con métricas destacadas.
 */
export function CloudletMarketSize({
  brand = "Cloudlet Tech",
  title = "Size of Market",
  description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  highlightValue = "150 K",
  highlightCaption = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  metricValue = "10%",
  metricCaption = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  graphicSrc = defaultGraphic,
}: CloudletMarketSizeProps) {
  return (
    <div style={{ ...BG, background: "#424242" }}>
      <svg style={{ position: "absolute", left: "702.6px", top: "55.0px", width: "593.0px", height: "593.0px" }} viewBox={`0 0 593.0 593.0`} preserveAspectRatio="none"><linearGradient id="g7_0" x1="0.000" y1="0.500" x2="1.000" y2="0.500"><stop offset="0.000" stop-color="rgb(160,206,253)" stop-opacity="0.5" /><stop offset="1.000" stop-color="rgb(228,242,255)" stop-opacity="0.5" /></linearGradient><path d="M 296.5 0.0 C 132.7 0.0 0.0 132.7 0.0 296.5 C 0.0 460.3 132.7 593.0 296.5 593.0 C 460.3 593.0 593.0 460.3 593.0 296.5 C 593.0 132.7 460.3 0.0 296.5 0.0 Z" fill="url(#g7_0)" stroke="rgba(255,255,255,0.498)" stroke-width="2.7" /></svg>
      <img src={washBand} style={{ position: "absolute", left: "4.5px", top: "252.2px", width: "1283.6px", height: "658.1px", opacity: 0.16 }} />
      <img src={logo} style={{ position: "absolute", left: "66.7px", top: "45.3px", width: "45.1px", height: "45.1px" }} />
      <img src={graphicSrc} style={{ position: "absolute", left: "558.2px", top: "393.5px", width: "269.2px", height: "269.2px" }} />
      <div style={{ position: "absolute", left: "72.0px", top: "164.4px", width: "442.4px", height: "210.2px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -13.55, marginBottom: 0, lineHeight: "101.94px", fontSize: "108.44px" }}><span style={{ fontSize: "108.44px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#ffffff", letterSpacing: "-5.09px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "446.4px", width: "380.6px", height: "197.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.75px" }}>{description}</span></p></div>
      <div style={{ position: "absolute", left: "881.8px", top: "435.8px", width: "237.5px", height: "49.1px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 3.5, marginBottom: 0, lineHeight: "24.89px", fontSize: "17.78px" }}><span style={{ fontSize: "17.78px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#ffffff", letterSpacing: "-0.84px" }}>{highlightCaption}</span></p></div>
      <div style={{ position: "absolute", left: "514.4px", top: "465.3px", width: "356.8px", height: "108.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: -13.54, marginBottom: 0, lineHeight: "101.82px", fontSize: "108.32px" }}><span style={{ fontSize: "108.32px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-5.08px" }}>{metricValue}</span></p></div>
      <div style={{ position: "absolute", left: "774.0px", top: "262.0px", width: "453.0px", height: "164.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: -20.55, marginBottom: 0, lineHeight: "154.58px", fontSize: "164.44px" }}><span style={{ fontSize: "164.44px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#ffffff", letterSpacing: "-7.72px" }}>{highlightValue}</span></p></div>
      <div style={{ position: "absolute", left: "596.5px", top: "571.9px", width: "192.7px", height: "34.2px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 2.45, marginBottom: 0, lineHeight: "17.42px", fontSize: "12.44px" }}><span style={{ fontSize: "12.44px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-0.58px" }}>{metricCaption}</span></p></div>
      <div style={{ position: "absolute", left: "117.3px", top: "45.5px", width: "390.0px", height: "41.2px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 6.09, marginBottom: 0, lineHeight: "43.27px", fontSize: "30.91px" }}><span style={{ fontSize: "30.91px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#d0d7dd", letterSpacing: "-1.45px" }}>{brand}</span></p></div>
    </div>
  );
}
