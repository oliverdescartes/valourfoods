import {Video} from "@remotion/media";
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from "remotion";
import {clamp, colors, media, safeX, sans, serif} from "../constants";
import {MaskedReveal} from "../components/MaskedReveal";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const jarOpacity = interpolate(frame, [7, 16], [0, 1], clamp);
  const jarY = interpolate(frame, [7, 20], [55, 0], clamp);

  return (
    <AbsoluteFill style={{background: colors.ink, overflow: "hidden"}}>
      <Video
        src={media.opening}
        muted
        objectFit="cover"
        style={{width: "100%", height: "100%"}}
      />
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(20,7,7,.38), transparent 42%, rgba(20,7,7,.72) 100%)"}} />

      <div style={{position: "absolute", left: safeX, right: safeX, top: 105}}>
        <MaskedReveal duration={7}>
          <div style={{fontFamily: serif, fontWeight: 600, fontSize: 118, lineHeight: 0.92, color: colors.cream, textShadow: "0 5px 24px rgba(0,0,0,.38)"}}>
            JUST
            <br />3 STEPS?
          </div>
        </MaskedReveal>
        <div style={{marginTop: 24, display: "inline-block", padding: "11px 18px", borderRadius: 24, background: colors.gold, fontFamily: sans, fontSize: 23, fontWeight: 700, letterSpacing: 2.2, color: colors.oxblood}}>
          REAL CUSTOMER RESULT
        </div>
      </div>

      <Img
        src={media.jar}
        style={{
          position: "absolute",
          right: 18,
          bottom: 78,
          width: 360,
          height: 560,
          objectFit: "contain",
          opacity: jarOpacity,
          transform: `translateY(${jarY}px)`,
          filter: "drop-shadow(0 22px 22px rgba(30,10,8,.28))",
        }}
      />
    </AbsoluteFill>
  );
};
