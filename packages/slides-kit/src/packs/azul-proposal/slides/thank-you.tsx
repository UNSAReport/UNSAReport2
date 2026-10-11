import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '../../assets';

const backgroundDefault = getTemplateAssetUrl('azul-proposal', 'asset-5ff18b4e.jpg');
const logoDefault = getTemplateAssetUrl('azul-proposal', 'asset-ab709e88.webp');

export interface AzulThankYouProps {
  /** URL de imagen (default: asset de la plantilla) */
  backgroundSrc?: string;
  /** URL de imagen (default: asset de la plantilla) */
  logoSrc?: string;
  /** Línea superior del titular */
  titleTop?: string;
  /** Línea inferior del titular */
  titleBottom?: string;
  /** URL del sitio en la franja de pie */
  siteUrl?: string;
  /** Etiqueta de compañía junto al logo */
  companyLabel?: string;
}

const BG: CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };

/**
 * Cierre de agradecimiento espejo de portada.
 */
export function AzulThankYou({
  backgroundSrc = backgroundDefault,
  logoSrc = logoDefault,
  titleTop = "THANK YOU",
  titleBottom = "VERY MUCH",
  siteUrl = "WWW.REALLYGREATSITE.COM",
  companyLabel = "COMPANY",
}: AzulThankYouProps) {
  return (
    <div style={{ ...BG }}>
      <div style={{ position: "absolute", left: "0.0px", top: "0.0px", width: "1280.0px", height: "720.0px", overflow: "hidden" }}><img src={backgroundSrc} style={{ position: "absolute", left: "-91.9px", top: "-137.3px", width: "1410.3px", height: "939.6px", maxWidth: "none" }} /></div>
      <div style={{ position: "absolute", left: "72.0px", top: "223.5px", width: "710.8px", height: "137.6px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -3.36, marginBottom: 0, lineHeight: "134.4px", fontSize: "124.44px" }}><span style={{ fontSize: "124.44px", fontFamily: "'Open Sauce One', sans-serif", fontWeight: 400, color: "#185079", letterSpacing: "-7.34px" }}>{titleTop}</span></p></div>
      <div style={{ position: "absolute", left: "392.5px", top: "-302.1px", width: "1553.0px", height: "1324.3px", background: "radial-gradient(ellipse at center, rgba(56, 133, 171, 0.45) 0%, rgba(187, 214, 225, 0.3) 50%, rgba(251, 246, 241, 0) 75%)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "72.0px", top: "350.1px", width: "953.0px", height: "157.7px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -3.84, marginBottom: 0, lineHeight: "153.59px", fontSize: "142.21px", marginLeft: "0.0px", textIndent: "0.0px" }}><span style={{ fontSize: "142.21px", fontWeight: 600, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "-8.38px" }}>{titleBottom}</span></p></div>
      <div style={{ position: "absolute", left: "72.0px", top: "615.1px", width: "710.8px", height: "32.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -0.79, marginBottom: 0, lineHeight: "31.68px", fontSize: "29.33px" }}><span style={{ fontSize: "29.33px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "-1.05px" }}>{siteUrl}</span></p></div>
      <img src={logoSrc} style={{ position: "absolute", left: "72.0px", top: "72.0px", width: "66.1px", height: "39.8px" }} />
      <div style={{ position: "absolute", left: "169.5px", top: "78.9px", width: "191.7px", height: "32.9px", background: "transparent", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "0.0px 0.0px 0.0px 0.0px", overflow: "visible" }}><p style={{ textAlign: "left", marginTop: -0.79, marginBottom: 0, lineHeight: "31.68px", fontSize: "29.33px" }}><span style={{ fontSize: "29.33px", fontWeight: 700, fontFamily: "'Open Sauce One', sans-serif", color: "#185079", letterSpacing: "-1.05px" }}>{companyLabel}</span></p></div>
    </div>
  );
}
