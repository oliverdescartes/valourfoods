import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {clamp, palette, sans} from "../theme";

export const ProofLabel: React.FC<{from?: number}> = ({from = 0}) => {
  const frame = useCurrentFrame();
  return <div style={{alignItems: "center", backgroundColor: palette.gold, color: palette.oxblood, display: "inline-flex", fontFamily: sans, fontSize: 23, fontWeight: 800, letterSpacing: "0.12em", padding: "14px 20px 12px", textTransform: "uppercase",
    opacity: interpolate(frame, [from, from + 7], [0, 1], clamp),
    translate: interpolate(frame, [from, from + 9], ["-22px 0px", "0px 0px"], {...clamp, easing: Easing.out(Easing.cubic)})}}>Real customer · Agartala</div>;
};
