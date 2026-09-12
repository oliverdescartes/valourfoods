import {AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {colors, media, safeX, sans, serif} from "../constants";
import {MaskedReveal} from "../components/MaskedReveal";

export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({fps, frame, config: {damping: 18, stiffness: 135}});
  return (
    <AbsoluteFill style={{background: colors.cream, overflow: "hidden"}}>
      <div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: 26, background: colors.oxblood}} />
      <div style={{position: "absolute", left: safeX, top: 100, width: 260}}>
        <Img src={media.logo} style={{width: "100%", height: 132, objectFit: "contain"}} />
      </div>
      <div style={{position: "absolute", left: safeX, right: safeX, top: 360}}>
        <MaskedReveal duration={10}>
          <div style={{fontFamily: serif, fontWeight: 600, fontSize: 126, lineHeight: 0.92, color: colors.oxblood}}>YOUR<br />TURN.</div>
        </MaskedReveal>
        <div style={{marginTop: 38, fontFamily: sans, fontWeight: 700, fontSize: 29, letterSpacing: 3.2, color: colors.ink}}>COOK WHAT YOU USUALLY ORDER.</div>
      </div>
      <Img src={media.jar} style={{position: "absolute", right: 5, top: 270, width: 525, height: 900, objectFit: "contain", transform: `translateY(${(1 - enter) * 90}px)`, filter: "drop-shadow(0 24px 24px rgba(67,28,20,.22))"}} />
      <div style={{position: "absolute", left: safeX, right: safeX, bottom: 230, height: 106, borderRadius: 53, background: colors.oxblood, display: "grid", placeItems: "center"}}>
        <div style={{fontFamily: sans, fontSize: 32, fontWeight: 700, letterSpacing: 3.2, color: colors.cream}}>SHOP NOW</div>
      </div>
      <div style={{position: "absolute", left: safeX, right: safeX, bottom: 135, textAlign: "center", fontFamily: sans, fontSize: 31, fontWeight: 700, letterSpacing: 2.8, color: colors.oxblood}}>
        LIQUIDSPICE.IN
      </div>
    </AbsoluteFill>
  );
};
