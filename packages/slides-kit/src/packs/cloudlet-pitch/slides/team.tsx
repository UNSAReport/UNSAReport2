import type { CSSProperties } from 'react';
import washSide from '../../../assets/cloudlet/asset-05273750.webp';
import washTall from '../../../assets/cloudlet/asset-05273750.webp';
import logo from '../../../assets/cloudlet/asset-b00f7859.webp';
import washStrip from '../../../assets/cloudlet/asset-59d84272.webp';
import photoDaniel from '../../../assets/cloudlet/asset-d8f3ff84.jpg';
import photoLewis from '../../../assets/cloudlet/asset-4eea6d91.jpg';
import photoSarah from '../../../assets/cloudlet/asset-994b1fc5.jpg';
import photoNaomi from '../../../assets/cloudlet/asset-381bd85d.jpg';

export interface CloudletTeamMember {
  name: string;
  photo: string;
}

export interface CloudletTeamProps {
  brand?: string;
  title?: string;
  description?: string;
  members?: CloudletTeamMember[];
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

/**
 * Equipo con fotos y roles.
 */
export function CloudletTeam({
  brand = "Cloudlet Tech",
  title = "Meet Our Team",
  description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
  members = [
    { name: "DANIEL MORTON", photo: photoDaniel },
    { name: "LEWIS GRANT", photo: photoLewis },
    { name: "SARAH WHITFIELD", photo: photoSarah },
    { name: "NAOMI MENSAH", photo: photoNaomi },
  ],
}: CloudletTeamProps) {
  return (
    <div style={{ ...BG, background: "#d0d7dd" }}>
      <img src={washSide} style={{ position: "absolute", left: "-64.7px", top: "363.2px", width: "330.1px", height: "437.5px", opacity: 0.02 }} />
      <img src={washTall} style={{ position: "absolute", left: "-163.1px", top: "186.0px", width: "657.0px", height: "738.9px", opacity: 0.25 }} />
      <img src={logo} style={{ position: "absolute", left: "66.7px", top: "45.3px", width: "45.1px", height: "45.1px" }} />
      <img src={washStrip} style={{ position: "absolute", left: "723.9px", top: "-100.6px", width: "900.0px", height: "345.3px", opacity: 0.25 }} />
      <svg style={{ position: "absolute", left: "600.3px", top: "35.6px", width: "286.7px", height: "303.2px" }} viewBox={`0 0 286.7 303.2`} preserveAspectRatio="none"><path d="M 35.7 0.0 L 251.0 0.0 C 260.5 0.0 269.6 3.8 276.3 10.4 C 282.9 17.1 286.7 26.2 286.7 35.7 L 286.7 267.5 C 286.7 287.2 270.7 303.2 251.0 303.2 L 35.7 303.2 C 26.2 303.2 17.1 299.4 10.4 292.8 C 3.8 286.1 0.0 277.0 0.0 267.5 L 0.0 35.7 C 0.0 26.2 3.8 17.1 10.4 10.4 C 17.1 3.8 26.2 0.0 35.7 0.0 Z" fill="#d0d7dd" stroke="#424242" stroke-width="1.3" /></svg>
      <svg style={{ position: "absolute", left: "600.3px", top: "374.8px", width: "286.7px", height: "303.2px" }} viewBox={`0 0 286.7 303.2`} preserveAspectRatio="none"><path d="M 35.7 0.0 L 251.0 0.0 C 260.5 0.0 269.6 3.8 276.3 10.4 C 282.9 17.1 286.7 26.2 286.7 35.7 L 286.7 267.5 C 286.7 287.2 270.7 303.2 251.0 303.2 L 35.7 303.2 C 26.2 303.2 17.1 299.4 10.4 292.8 C 3.8 286.1 0.0 277.0 0.0 267.5 L 0.0 35.7 C 0.0 26.2 3.8 17.1 10.4 10.4 C 17.1 3.8 26.2 0.0 35.7 0.0 Z" fill="#d0d7dd" stroke="#424242" stroke-width="1.3" /></svg>
      <svg style={{ position: "absolute", left: "921.3px", top: "35.6px", width: "286.7px", height: "303.2px" }} viewBox={`0 0 286.7 303.2`} preserveAspectRatio="none"><path d="M 35.7 0.0 L 251.0 0.0 C 260.5 0.0 269.6 3.8 276.3 10.4 C 282.9 17.1 286.7 26.2 286.7 35.7 L 286.7 267.5 C 286.7 287.2 270.7 303.2 251.0 303.2 L 35.7 303.2 C 26.2 303.2 17.1 299.4 10.4 292.8 C 3.8 286.1 0.0 277.0 0.0 267.5 L 0.0 35.7 C 0.0 26.2 3.8 17.1 10.4 10.4 C 17.1 3.8 26.2 0.0 35.7 0.0 Z" fill="#d0d7dd" stroke="#424242" stroke-width="1.3" /></svg>
      <svg style={{ position: "absolute", left: "921.3px", top: "374.8px", width: "286.7px", height: "303.2px" }} viewBox={`0 0 286.7 303.2`} preserveAspectRatio="none"><path d="M 35.7 0.0 L 251.0 0.0 C 260.5 0.0 269.6 3.8 276.3 10.4 C 282.9 17.1 286.7 26.2 286.7 35.7 L 286.7 267.5 C 286.7 287.2 270.7 303.2 251.0 303.2 L 35.7 303.2 C 26.2 303.2 17.1 299.4 10.4 292.8 C 3.8 286.1 0.0 277.0 0.0 267.5 L 0.0 35.7 C 0.0 26.2 3.8 17.1 10.4 10.4 C 17.1 3.8 26.2 0.0 35.7 0.0 Z" fill="#d0d7dd" stroke="#424242" stroke-width="1.3" /></svg>
      <div style={{ position: "absolute", left: "619.0px", top: "51.9px", width: "249.3px", height: "191.8px", overflow: "hidden" }}><img src={members[0].photo} style={{ position: "absolute", left: "-78.5px", top: "-38.6px", width: "418.2px", height: "627.8px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "619.0px", top: "391.1px", width: "249.3px", height: "191.8px", overflow: "hidden" }}><img src={members[1].photo} style={{ position: "absolute", left: "-86.8px", top: "0.0px", width: "411.8px", height: "274.8px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "940.0px", top: "51.9px", width: "249.3px", height: "191.8px", overflow: "hidden" }}><img src={members[2].photo} style={{ position: "absolute", left: "-82.4px", top: "-85.9px", width: "397.6px", height: "596.8px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "940.0px", top: "391.1px", width: "249.3px", height: "191.8px", overflow: "hidden" }}><img src={members[3].photo} style={{ position: "absolute", left: "-177.5px", top: "-17.3px", width: "588.9px", height: "392.4px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "72.0px", top: "192.1px", width: "444.5px", height: "312.2px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -13.56, marginBottom: 0, lineHeight: "101.9px", fontSize: "108.41px" }}><span style={{ fontSize: "108.41px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-5.09px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "117.3px", top: "45.5px", width: "376.0px", height: "41.2px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 6.09, marginBottom: 0, lineHeight: "43.27px", fontSize: "30.91px" }}><span style={{ fontSize: "30.91px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-1.45px" }}>{brand}</span></p></div>
      <div style={{ position: "absolute", left: "600.3px", top: "270.8px", width: "286.7px", height: "18.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: -2.22, marginBottom: 0, lineHeight: "16.71px", fontSize: "17.78px" }}><span style={{ fontSize: "17.78px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-0.84px" }}>{members[0].name}</span></p></div>
      <div style={{ position: "absolute", left: "600.3px", top: "610.0px", width: "286.7px", height: "18.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: -2.22, marginBottom: 0, lineHeight: "16.71px", fontSize: "17.78px" }}><span style={{ fontSize: "17.78px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-0.84px" }}>{members[1].name}</span></p></div>
      <div style={{ position: "absolute", left: "921.3px", top: "270.8px", width: "286.7px", height: "18.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: -2.22, marginBottom: 0, lineHeight: "16.71px", fontSize: "17.78px" }}><span style={{ fontSize: "17.78px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-0.84px" }}>{members[2].name}</span></p></div>
      <div style={{ position: "absolute", left: "921.3px", top: "610.0px", width: "286.7px", height: "18.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: -2.22, marginBottom: 0, lineHeight: "16.71px", fontSize: "17.78px" }}><span style={{ fontSize: "17.78px", fontWeight: 900, fontFamily: "'Open Sauce One', sans-serif", color: "#424242", letterSpacing: "-0.84px" }}>{members[3].name}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "582.5px", width: "369.0px", height: "65.5px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 3.15, marginBottom: 0, lineHeight: "22.4px", fontSize: "16.0px" }}><span style={{ fontSize: "16.0px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 300, color: "#424242", letterSpacing: "-0.75px" }}>{description}</span></p></div>
    </div>
  );
}
