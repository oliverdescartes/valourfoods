import {Video} from "@remotion/media";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {assets, clamp, COLORS, safeX, sans, serif} from "../constants";
import {TextReveal} from "../components/TextReveal";

const steps = [
  {label: "ADD CHICKEN. FRY.", src: assets.fry, trimBefore: 28, accent: "01"},
  {label: "POUR.", src: assets.pour, trimBefore: 45, accent: "02"},
  {label: "SIMMER.", src: assets.simmer, trimBefore: 20, accent: "03"},
];

const Step: React.FC<(typeof steps)[number]> = ({label, src, trimBefore, accent}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 30], [1.02, 1.09], clamp);
  return (
    <AbsoluteFill style={{overflow: "hidden", background: COLORS.ink}}>
      <Video src={src} trimBefore={trimBefore} muted objectFit="cover" style={{width: "100%", height: "100%", transform: `scale(${scale})`}} />
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(20,7,7,.18), rgba(20,7,7,.02) 45%, rgba(20,7,7,.86) 100%)"}} />
      <div style={{position: "absolute", left: safeX, right: safeX, top: 110, display: "flex", alignItems: "center", gap: 22}}>
        <div style={{width: 74, height: 74, borderRadius: 40, background: COLORS.gold, display: "grid", placeItems: "center", fontFamily: sans, fontSize: 28, fontWeight: 700, color: COLORS.oxblood}}>{accent}</div>
        <div style={{fontFamily: sans, fontSize: 28, fontWeight: 700, letterSpacing: 5, color: COLORS.cream}}>HOW IT WORKS</div>
      </div>
      <div style={{position: "absolute", left: safeX, right: safeX, bottom: 250}}>
        <TextReveal duration={7}>
          <div style={{fontFamily: serif, fontWeight: 600, fontSize: 96, lineHeight: 0.98, color: COLORS.cream, textShadow: "0 5px 22px rgba(0,0,0,.5)"}}>{label}</div>
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

export const MechanismScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: COLORS.ink}}>
      {steps.map((step, index) => (
        <Sequence key={step.label} from={index * 30} durationInFrames={30} premountFor={12}>
          <Step {...step} />
        </Sequence>
      ))}
      <div style={{position: "absolute", left: safeX, right: safeX, bottom: 105, height: 84, background: COLORS.cream, borderRadius: 42, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 38px", zIndex: 5, boxShadow: "0 12px 30px rgba(20,7,7,.28)"}}>
        <div style={{fontFamily: sans, fontSize: 30, fontWeight: 700, color: COLORS.oxblood}}>15 MINUTES</div>
        <div style={{height: 34, width: 2, background: "rgba(131,26,26,.25)"}} />
        <div style={{fontFamily: sans, fontSize: 27, fontWeight: 700, color: COLORS.ink}}>ONE JAR · 1 KG CHICKEN</div>
      </div>
      <div style={{position: "absolute", left: safeX, bottom: 210, width: interpolate(frame, [0, 90], [0, 900], clamp), height: 5, background: COLORS.gold, zIndex: 6}} />
    </AbsoluteFill>
  );
};
