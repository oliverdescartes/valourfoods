import {AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {assets, clamp, COLORS, reviews, safeX, sans, serif} from "../constants";
import {Photo} from "../components/Photo";
import {TextReveal} from "../components/TextReveal";

export const FinalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({fps, frame: frame - 5, config: {damping: 18, stiffness: 145}});
  const jarY = interpolate(enter, [0, 1], [240, 0]);
  const quoteOpacity = interpolate(frame, [0, 8, 55, 68], [0, 1, 1, 0.18], clamp);
  const cta = spring({fps, frame: frame - 52, config: {damping: 16, stiffness: 175}});

  return (
    <AbsoluteFill style={{background: COLORS.cream, overflow: "hidden"}}>
      <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 1120, overflow: "hidden"}}>
        <Photo src={assets.depanki} end={105} fromScale={1.04} toScale={1.12} x={-15} style={{objectPosition: "50% 48%"}} />
        <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(20,7,7,.05), rgba(20,7,7,.1) 45%, rgba(20,7,7,.82) 100%)"}} />
      </div>

      <div style={{position: "absolute", left: safeX, right: safeX, top: 95}}>
        <div style={{display: "inline-block", padding: "14px 24px", borderRadius: 30, background: COLORS.oxblood, fontFamily: sans, fontWeight: 700, fontSize: 25, letterSpacing: 3, color: COLORS.cream}}>
          REAL CUSTOMER · DEPANKI · AGARTALA
        </div>
      </div>

      <div style={{position: "absolute", left: safeX, right: safeX, top: 700, opacity: quoteOpacity}}>
        <TextReveal delay={4} duration={9}>
          <div style={{fontFamily: serif, fontSize: 61, lineHeight: 1.08, color: COLORS.cream, textShadow: "0 4px 20px rgba(0,0,0,.4)"}}>“{reviews.depanki}”</div>
        </TextReveal>
      </div>

      <div style={{position: "absolute", left: 0, right: 0, top: 1080, bottom: 0, background: COLORS.cream}} />
      <div style={{position: "absolute", left: safeX, top: 1135, width: 665}}>
        <TextReveal delay={20} duration={10}>
          <div style={{fontFamily: serif, fontWeight: 600, fontSize: 64, lineHeight: 0.99, color: COLORS.oxblood}}>
            RESTAURANT-STYLE
            <br />BUTTER CHICKEN.
            <br />MADE AT HOME.
          </div>
        </TextReveal>
      </div>

      <div style={{position: "absolute", right: 20, top: 980, width: 420, height: 650, transform: `translateY(${jarY}px)`, filter: "drop-shadow(0 22px 22px rgba(72,30,16,.22))"}}>
        <Img src={assets.jar} style={{width: "100%", height: "100%", objectFit: "contain"}} />
      </div>

      <Img src={assets.logo} style={{position: "absolute", left: safeX, top: 1515, width: 250, height: 126, objectFit: "contain"}} />
      <div style={{position: "absolute", left: safeX, right: safeX, top: 1640, fontFamily: sans, fontWeight: 700, fontSize: 27, letterSpacing: 3.5, color: COLORS.ink}}>
        COOK WHAT YOU USUALLY ORDER.
      </div>

      <div style={{position: "absolute", left: safeX, right: safeX, bottom: 92, height: 92, borderRadius: 46, background: COLORS.oxblood, display: "grid", placeItems: "center", transform: `scaleX(${interpolate(cta, [0, 1], [0.45, 1])})`, opacity: cta}}>
        <div style={{fontFamily: sans, fontWeight: 700, fontSize: 30, letterSpacing: 3.2, color: COLORS.cream}}>SEE HOW VALOUR WORKS</div>
      </div>
    </AbsoluteFill>
  );
};
