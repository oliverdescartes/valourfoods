import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {clamp} from "../theme";

export const AnimatedPhoto: React.FC<{src: string; objectPosition?: string; startScale?: number; endScale?: number; translateFrom?: string; translateTo?: string; dim?: number}> = ({src, objectPosition = "50% 50%", startScale = 1.03, endScale = 1.085, translateFrom = "0px 0px", translateTo = "-8px -12px", dim = 0.2}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{overflow: "hidden", backgroundColor: "#35100E"}}>
    <Img src={staticFile(src)} style={{width: "100%", height: "100%", objectFit: "cover", objectPosition,
      scale: interpolate(frame, [0, 180], [startScale, endScale], {...clamp, easing: Easing.bezier(0.2, 0.7, 0.2, 1), output: "perceptual-scale"}),
      translate: interpolate(frame, [0, 180], [translateFrom, translateTo], {...clamp, easing: Easing.bezier(0.2, 0.7, 0.2, 1)})}} />
    <AbsoluteFill style={{backgroundColor: `rgba(28, 7, 6, ${dim})`}} />
  </AbsoluteFill>;
};
