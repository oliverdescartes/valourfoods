import type {CSSProperties} from "react";
import {Img, interpolate, useCurrentFrame} from "remotion";
import {clamp} from "../constants";

export const Photo: React.FC<{
  src: string;
  start?: number;
  end?: number;
  fromScale?: number;
  toScale?: number;
  x?: number;
  y?: number;
  style?: CSSProperties;
}> = ({src, start = 0, end = 90, fromScale = 1.04, toScale = 1.1, x = 0, y = 0, style}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [start, end], [fromScale, toScale], clamp);
  const driftX = interpolate(frame, [start, end], [0, x], clamp);
  const driftY = interpolate(frame, [start, end], [0, y], clamp);
  return (
    <Img
      src={src}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: `translate3d(${driftX}px, ${driftY}px, 0) scale(${scale})`,
        ...style,
      }}
    />
  );
};
