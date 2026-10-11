import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '../../assets';

const backgroundDefault = getTemplateAssetUrl('azul-proposal', 'asset-5ff18b4e.jpg');

export interface AzulValuePropositionMilestone {
  /** Numeral del hito (ej: "01.") */
  numeral: string;
  /** Texto del hito */
  body: string;
}

export interface AzulValuePropositionProps {
  /** URL de imagen (default: asset de la plantilla) */
  backgroundSrc?: string;
  /** Título principal */
  title?: string;
  /** Cuatro hitos sobre la línea horizontal */
  milestones?: AzulValuePropositionMilestone[];
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

const MILESTONE_BODY = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.";

/**
 * Propuesta de valor con 4 hitos sobre línea horizontal.
 */
export function AzulValueProposition({
  backgroundSrc = backgroundDefault,
  title = "VALUE PROPOSITION",
  milestones = [
    { numeral: "01.", body: MILESTONE_BODY },
    { numeral: "02.", body: MILESTONE_BODY },
    { numeral: "03.", body: MILESTONE_BODY },
    { numeral: "04.", body: MILESTONE_BODY },
  ],
}: AzulValuePropositionProps) {
  return (
    <div style={{ ...BG }}>
      <div style={{ position: "absolute", left: "0.0px", top: "0.0px", width: "1280.0px", height: "720.0px", overflow: "hidden" }}><img src={backgroundSrc} style={{ position: "absolute", left: "-91.9px", top: "-137.3px", width: "1410.3px", height: "939.6px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "-62.1px", top: "307.3px", width: "1404.1px", height: "2.0px", backgroundColor: "#185079" }} />
      <div style={{ position: "absolute", left: "140.1px", top: "294.7px", width: "25.2px", height: "25.2px", borderRadius: "50%", backgroundColor: "#185079" }} />
      <div style={{ position: "absolute", left: "140.1px", top: "345.2px", width: "153.8px", height: "47.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -2.75, marginBottom: 0, lineHeight: "45.78px", fontSize: "44.44px" }}><span style={{ fontSize: "44.44px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{milestones[0].numeral}</span></p></div>
      <div style={{ position: "absolute", left: "407.2px", top: "345.2px", width: "153.8px", height: "47.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -2.75, marginBottom: 0, lineHeight: "45.78px", fontSize: "44.44px" }}><span style={{ fontSize: "44.44px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{milestones[1].numeral}</span></p></div>
      <div style={{ position: "absolute", left: "674.0px", top: "345.2px", width: "153.8px", height: "47.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -2.75, marginBottom: 0, lineHeight: "45.78px", fontSize: "44.44px" }}><span style={{ fontSize: "44.44px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{milestones[2].numeral}</span></p></div>
      <div style={{ position: "absolute", left: "938.5px", top: "345.2px", width: "153.8px", height: "47.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -2.75, marginBottom: 0, lineHeight: "45.78px", fontSize: "44.44px" }}><span style={{ fontSize: "44.44px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{milestones[3].numeral}</span></p></div>
      <div style={{ position: "absolute", left: "405.9px", top: "404.1px", width: "215.3px", height: "162.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.16, marginBottom: 0, lineHeight: "23.83px", fontSize: "15.99px" }}><span style={{ fontSize: "15.99px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{milestones[1].body}</span></p></div>
      <div style={{ position: "absolute", left: "671.5px", top: "404.1px", width: "215.3px", height: "162.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.16, marginBottom: 0, lineHeight: "23.83px", fontSize: "15.99px" }}><span style={{ fontSize: "15.99px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{milestones[2].body}</span></p></div>
      <div style={{ position: "absolute", left: "938.5px", top: "404.1px", width: "215.3px", height: "162.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.16, marginBottom: 0, lineHeight: "23.83px", fontSize: "15.99px" }}><span style={{ fontSize: "15.99px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{milestones[3].body}</span></p></div>
      <div style={{ position: "absolute", left: "140.1px", top: "404.1px", width: "215.3px", height: "162.0px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: 4.16, marginBottom: 0, lineHeight: "23.83px", fontSize: "15.99px" }}><span style={{ fontSize: "15.99px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{milestones[0].body}</span></p></div>
      <div style={{ position: "absolute", left: "407.2px", top: "294.7px", width: "25.2px", height: "25.2px", borderRadius: "50%", backgroundColor: "#185079" }} />
      <div style={{ position: "absolute", left: "671.5px", top: "294.7px", width: "25.2px", height: "25.2px", borderRadius: "50%", backgroundColor: "#185079" }} />
      <div style={{ position: "absolute", left: "938.5px", top: "294.7px", width: "25.2px", height: "25.2px", borderRadius: "50%", backgroundColor: "#185079" }} />
      <div style={{ position: "absolute", left: "243.4px", top: "160.5px", width: "793.2px", height: "77.8px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: -1.9, marginBottom: 0, lineHeight: "76.0px", fontSize: "70.37px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "70.37px", fontWeight: 600, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "-4.15px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "-570.7px", top: "345.5px", width: "1114.2px", height: "950.1px", background: "radial-gradient(ellipse at center, rgba(24, 80, 121, 0.35) 0%, rgba(56, 133, 171, 0.2) 50%, rgba(251, 246, 241, 0) 75%)", filter: "blur(50px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "789.2px", top: "-540.8px", width: "1114.2px", height: "950.1px", background: "radial-gradient(ellipse at center, rgba(24, 80, 121, 0.35) 0%, rgba(56, 133, 171, 0.2) 50%, rgba(251, 246, 241, 0) 75%)", filter: "blur(50px)", pointerEvents: "none" }} />
    </div>
  );
}
