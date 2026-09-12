import React from "react";
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {AnimatedPhoto} from "../components/AnimatedPhoto";
import {RevealLine} from "../components/EditorialText";
import {clamp, palette, SAFE_X, sans} from "../theme";

export const OutcomeScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: palette.ink}}>
    <AnimatedPhoto src="customers/subham.png" objectPosition="50% 57%" startScale={1.03} endScale={1.08} dim={0.35} translateFrom="0px 8px" translateTo="0px -10px" />
    <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(35,8,7,.2) 0%, rgba(35,8,7,.22) 34%, rgba(35,8,7,.96) 100%)"}} />
    <div style={{position: "absolute", width: 420, height: 540, right: 35, top: 315, backgroundColor: "rgba(255,248,239,.94)", borderBottom: `12px solid ${palette.gold}`, opacity: interpolate(frame, [14, 27], [0, 1], clamp), translate: interpolate(frame, [14, 34], ["35px 0px", "0px 0px"], {...clamp, easing: Easing.out(Easing.cubic)})}} />
    <Img src={staticFile("product/velvety-butter-chicken.png")} style={{position: "absolute", width: 380, height: 500, objectFit: "contain", right: 55, top: 335,
      opacity: interpolate(frame, [18, 31], [0, 1], clamp), scale: interpolate(frame, [18, 45, 119], [.92, 1, 1.025], {...clamp, easing: Easing.out(Easing.cubic), output: "perceptual-scale"}), translate: interpolate(frame, [18, 38], ["30px 22px", "0px 0px"], {...clamp, easing: Easing.out(Easing.cubic)})}} />
    <AbsoluteFill style={{padding: `145px ${SAFE_X}px 145px`, justifyContent: "space-between"}}>
      <div style={{width: 320, height: 140, padding: "16px 22px", backgroundColor: palette.cream, opacity: interpolate(frame, [5, 17], [0, 1], clamp)}}>
        <Img src={staticFile("brand/valourblacklogo.webp")} style={{width: "100%", height: "100%", objectFit: "contain", objectPosition: "center"}} />
      </div>
      <div>
        <RevealLine size={87} from={2}>Restaurant-style<br /><span style={{color: palette.gold, fontStyle: "italic"}}>Butter Chicken.</span><br />Made at home.</RevealLine>
        <div style={{fontFamily: sans, fontSize: 27, lineHeight: 1.25, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: palette.gold, marginTop: 38, opacity: interpolate(frame, [34, 45], [0, 1], clamp)}}>Cook the dishes you love,<br />more simply.</div>
        <div style={{height: 2, width: "100%", backgroundColor: "rgba(255,248,239,.34)", margin: "35px 0 28px"}} />
        <div style={{alignItems: "center", backgroundColor: palette.cream, color: palette.oxblood, display: "flex", fontFamily: sans, fontSize: 31, fontWeight: 800, justifyContent: "space-between", marginTop: 34, padding: "27px 30px 25px",
          opacity: interpolate(frame, [56, 68], [0, 1], clamp), translate: interpolate(frame, [56, 74], ["0px 22px", "0px 0px"], {...clamp, easing: Easing.out(Easing.cubic)})}}><span>See how it works</span><span style={{fontSize: 40}}>→</span></div>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>;
};
