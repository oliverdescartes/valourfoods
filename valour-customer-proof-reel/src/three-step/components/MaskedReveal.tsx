import type {CSSProperties, ReactNode} from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {clamp} from "../constants";

export const MaskedReveal: React.FC<{
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: CSSProperties;
}> = ({children, delay = 0, duration = 10, style}) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [delay, delay + duration], [105, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(frame, [delay, delay + 6], [0, 1], clamp);

  return (
    <div style={{overflow: "hidden", ...style}}>
      <div style={{opacity, transform: `translateY(${y}%)`}}>{children}</div>
    </div>
  );
};
