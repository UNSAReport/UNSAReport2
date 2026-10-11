import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '../../assets';

const backgroundDefault = getTemplateAssetUrl('azul-proposal', 'asset-5ff18b4e.jpg');

export interface AzulConclusionNextStepsProps {
  /** URL de imagen (default: asset de la plantilla) */
  backgroundSrc?: string;
  /** Título principal */
  title?: string;
  /** Párrafos de cuerpo (dos) */
  paragraphs?: string[];
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

const BODY = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

/**
 * Conclusión y próximos pasos.
 */
export function AzulConclusionNextSteps({
  backgroundSrc = backgroundDefault,
  title = "CONCLUSION & NEXT STEPS",
  paragraphs = [BODY, BODY],
}: AzulConclusionNextStepsProps) {
  return (
    <div style={{ ...BG }}>
      <div style={{ position: "absolute", left: "0.0px", top: "0.0px", width: "1280.0px", height: "720.0px", overflow: "hidden" }}><img src={backgroundSrc} style={{ position: "absolute", left: "-91.9px", top: "-137.3px", width: "1410.3px", height: "939.6px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "54.3px", top: "53.0px", width: "1171.4px", height: "613.9px", backgroundColor: "#bbd6e1", borderRadius: "4px" }} />
      <div style={{ position: "absolute", left: "329.5px", top: "166.6px", width: "620.9px", height: "153.8px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: -1.9, marginBottom: 0, lineHeight: "76.0px", fontSize: "70.37px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "70.37px", fontWeight: 600, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "-4.15px" }}>{title}</span></p></div>
      <div style={{ position: "absolute", left: "262.0px", top: "333.6px", width: "756.0px", height: "102.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 2.98, marginBottom: 0, lineHeight: "21.16px", fontSize: "15.11px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "15.11px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{paragraphs[0]}</span></p></div>
      <div style={{ position: "absolute", left: "262.0px", top: "457.7px", width: "756.0px", height: "102.3px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "center", marginTop: 2.98, marginBottom: 0, lineHeight: "21.16px", fontSize: "15.11px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "15.11px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079" }}>{paragraphs[1]}</span></p></div>
    </div>
  );
}
