import {Video} from "@remotion/media";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {clamp, colors, media, safeX, sans, serif} from "../constants";
import {MaskedReveal} from "../components/MaskedReveal";

export const ResultScene: React.FC = () => {
  const frame = useCurrentFrame();
  const secondLineOpacity = interpolate(frame, [30, 41], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: colors.ink, overflow: "hidden"}}>
      <Video
        src={media.opening}
        trimBefore={84}
        muted
        objectFit="cover"
        style={{width: "100%", height: "100%"}}
      />
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(20,7,7,.18), transparent 42%, rgba(20,7,7,.84) 100%)"}} />
      <div style={{position: "absolute", left: safeX, right: safeX, top: 102}}>
        <div style={{fontFamily: sans, fontSize: 23, fontWeight: 700, letterSpacing: 3.4, color: colors.gold}}>REAL CUSTOMER · AGARTALA</div>
      </div>
      <div style={{position: "absolute", left: safeX, right: safeX, bottom: 140}}>
        <MaskedReveal delay={2} duration={9}>
          <div style={{fontFamily: serif, fontSize: 74, lineHeight: 0.98, color: colors.cream}}>Their kitchens.<br />Their photos.</div>
        </MaskedReveal>
        <div style={{marginTop: 22, opacity: secondLineOpacity, fontFamily: sans, fontSize: 31, fontWeight: 700, letterSpacing: 3.2, color: colors.gold}}>
          AND THEY ENJOYED IT.
        </div>
      </div>
    </AbsoluteFill>
  );
};
