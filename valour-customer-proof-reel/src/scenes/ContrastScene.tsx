import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {AnimatedPhoto} from "../components/AnimatedPhoto";
import {RevealLine} from "../components/EditorialText";
import {clamp, palette, SAFE_X, sans} from "../theme";

export const ContrastScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: palette.ink}}>
    <AnimatedPhoto src="customers/depanki.jpeg" objectPosition="50% 62%" startScale={1.03} endScale={1.09} translateFrom="0px 12px" translateTo="-10px -10px" dim={0.25} />
    <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(29,6,5,.58) 0%, rgba(29,6,5,.12) 45%, rgba(29,6,5,.88) 100%)"}} />
    <AbsoluteFill style={{padding: `175px ${SAFE_X}px 190px`, justifyContent: "space-between"}}>
      <div style={{fontFamily: sans, fontSize: 23, color: palette.gold, textTransform: "uppercase", fontWeight: 800, letterSpacing: ".15em"}}>The usual choice</div>
      <div>
        {frame < 34 && <RevealLine size={80}>Usually this means<br /><em>ordering in…</em></RevealLine>}
        {frame >= 30 && frame < 63 && <RevealLine size={76} from={30}>or spending ages<br />on the masala.</RevealLine>}
        {frame >= 59 && <div style={{borderLeft: `9px solid ${palette.gold}`, paddingLeft: 28, opacity: interpolate(frame, [59, 66], [0, 1], clamp), scale: interpolate(frame, [59, 75], [0.96, 1], {...clamp, easing: Easing.out(Easing.cubic), output: "perceptual-scale"})}}><RevealLine size={118} from={59}>They did<br /><span style={{color: palette.gold}}>neither.</span></RevealLine></div>}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;
};
