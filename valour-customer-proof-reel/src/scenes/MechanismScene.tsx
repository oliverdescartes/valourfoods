import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {clamp, palette, SAFE_X, sans, serif} from "../theme";

const steps = [{label: "ADD CHICKEN.", from: 3}, {label: "FRY → POUR → SIMMER.", from: 22}, {label: "15 MINUTES.", from: 43}];

export const MechanismScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: palette.cream, color: palette.oxblood, overflow: "hidden"}}>
    <div style={{position: "absolute", width: 980, height: 980, borderRadius: "50%", right: -420, top: 430, backgroundColor: palette.gold, opacity: .38}} />
    <div style={{position: "absolute", left: SAFE_X, top: 155, fontFamily: sans, fontSize: 23, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase"}}>How the jar becomes dinner</div>
    <Img src={staticFile("brand/valourblacklogo.webp")} style={{position: "absolute", right: 78, top: 92, width: 245, height: 124, objectFit: "contain", opacity: interpolate(frame, [0, 10], [0, 1], clamp)}} />
    <div style={{position: "absolute", left: SAFE_X, top: 250, width: 820}}>{steps.map((step) => <div key={step.label} style={{fontFamily: step.from === 43 ? serif : sans, fontSize: step.from === 43 ? 126 : 62, fontStyle: step.from === 43 ? "italic" : "normal", fontWeight: step.from === 43 ? 600 : 800, letterSpacing: step.from === 43 ? "-.045em" : "-.02em", lineHeight: 1, marginBottom: step.from === 43 ? 24 : 30,
      opacity: interpolate(frame, [step.from, step.from + 6], [0, 1], clamp), translate: interpolate(frame, [step.from, step.from + 12], ["-30px 0px", "0px 0px"], {...clamp, easing: Easing.out(Easing.cubic)})}}>{step.label}</div>)}
      <div style={{fontFamily: sans, fontSize: 29, fontWeight: 700, letterSpacing: ".11em", textTransform: "uppercase", borderTop: "2px solid rgba(131,26,26,.22)", paddingTop: 22, opacity: interpolate(frame, [62, 72], [0, 1], clamp)}}>One jar. 1 kg chicken.</div>
    </div>
    <Img src={staticFile("product/velvety-butter-chicken.png")} style={{position: "absolute", width: 610, height: 610, objectFit: "contain", right: -35, bottom: 115,
      opacity: interpolate(frame, [8, 20], [0, 1], clamp), scale: interpolate(frame, [8, 36, 89], [0.93, 1, 1.025], {...clamp, easing: Easing.out(Easing.cubic), output: "perceptual-scale"}), translate: interpolate(frame, [8, 30], ["40px 20px", "0px 0px"], {...clamp, easing: Easing.out(Easing.cubic)})}} />
  </AbsoluteFill>;
};
