import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {clamp, palette, serif} from "../theme";

export const RevealLine: React.FC<{children: React.ReactNode; from?: number; size?: number; color?: string; weight?: number; lineHeight?: number; align?: "left" | "center" | "right"}> = ({children, from = 0, size = 94, color = palette.cream, weight = 600, lineHeight = 0.98, align = "left"}) => {
  const frame = useCurrentFrame();
  return <div style={{overflow: "hidden", textAlign: align}}><div style={{color, fontFamily: serif, fontSize: size, fontWeight: weight, letterSpacing: "-0.035em", lineHeight,
    opacity: interpolate(frame, [from, from + 5], [0, 1], clamp),
    translate: interpolate(frame, [from, from + 12], ["0em 1.08em", "0em 0em"], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)})}}>{children}</div></div>;
};
