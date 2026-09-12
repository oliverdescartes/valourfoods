import {AbsoluteFill, Img, interpolate, useCurrentFrame} from "remotion";
import {clamp, colors, media, safeX, sans, serif} from "../constants";
import {MaskedReveal} from "../components/MaskedReveal";

export const YieldScene: React.FC = () => {
  const frame = useCurrentFrame();
  const jarOpacity = interpolate(frame, [5, 16], [0, 1], clamp);
  const jarX = interpolate(frame, [5, 18], [70, 0], clamp);
  return (
    <AbsoluteFill style={{background: colors.ink, overflow: "hidden"}}>
      <Img src={media.subham} style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 47%"}} />
      <AbsoluteFill style={{background: "linear-gradient(90deg, rgba(20,7,7,.88) 0%, rgba(20,7,7,.62) 48%, rgba(20,7,7,.18) 100%)"}} />
      <div style={{position: "absolute", left: safeX, top: 115, fontFamily: sans, fontWeight: 700, fontSize: 23, letterSpacing: 3.6, color: colors.gold}}>REAL CUSTOMER RESULT</div>
      <div style={{position: "absolute", left: safeX, top: 410, width: 620}}>
        <MaskedReveal duration={10}>
          <div style={{fontFamily: serif, fontWeight: 600, fontSize: 96, lineHeight: 0.96, color: colors.cream}}>One jar.<br />A full table.</div>
        </MaskedReveal>
        <div style={{marginTop: 48, display: "flex", flexDirection: "column", gap: 18, fontFamily: sans, fontWeight: 700, color: colors.cream}}>
          <div style={{fontSize: 35, letterSpacing: 3}}>1 JAR</div>
          <div style={{width: 330, height: 2, background: colors.gold}} />
          <div style={{fontSize: 35, letterSpacing: 3}}>1 KG CHICKEN</div>
          <div style={{width: 330, height: 2, background: colors.gold}} />
          <div style={{fontSize: 35, letterSpacing: 3}}>AROUND 15 MIN</div>
        </div>
      </div>
      <Img src={media.jar} style={{position: "absolute", right: -28, bottom: 55, width: 510, height: 840, objectFit: "contain", opacity: jarOpacity, transform: `translateX(${jarX}px)`, filter: "drop-shadow(0 24px 24px rgba(20,7,7,.28))"}} />
    </AbsoluteFill>
  );
};
