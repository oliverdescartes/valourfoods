import {Img, interpolate, useCurrentFrame} from "remotion";
import {clamp, colors, sans, serif} from "../constants";

export const ProofCard: React.FC<{
  index: number;
  name: string;
  src: string;
  quote: string;
  objectPosition: string;
}> = ({index, name, src, quote, objectPosition}) => {
  const frame = useCurrentFrame();
  const delay = 4 + index * 5;
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], clamp);
  const y = interpolate(frame, [delay, delay + 12], [42, 0], clamp);
  const compact = quote.length > 58;

  return (
    <div
      style={{
        height: 670,
        background: "#FFFFFF",
        border: "1px solid rgba(131,26,26,.12)",
        boxShadow: "0 18px 46px rgba(67,28,20,.12)",
        opacity,
        transform: `translateY(${y}px)`,
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "398px 1fr",
      }}
    >
      <Img
        src={src}
        style={{width: "100%", height: "398px", objectFit: "cover", objectPosition}}
      />
      <div style={{padding: "24px 26px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
        <div style={{fontFamily: serif, fontSize: compact ? 29 : 33, lineHeight: 1.08, color: colors.ink}}>
          “{quote}”
        </div>
        <div style={{fontFamily: sans, fontWeight: 700, fontSize: 20, letterSpacing: 2.6, color: colors.oxblood}}>
          REAL CUSTOMER · {name} · AGARTALA
        </div>
      </div>
    </div>
  );
};
