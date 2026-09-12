import React from "react";
import {AbsoluteFill, Sequence, useCurrentFrame} from "remotion";
import {AnimatedPhoto} from "../components/AnimatedPhoto";
import {RevealLine} from "../components/EditorialText";
import {palette, SAFE_X, sans} from "../theme";

const flashes = [
  {src: "customers/kakoli.jpg", position: "50% 48%"},
  {src: "customers/depanki.jpeg", position: "50% 58%"},
  {src: "customers/subham.png", position: "50% 55%"},
];

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: palette.ink}}>
    {flashes.map((item, index) => <Sequence key={item.src} from={index * 12} durationInFrames={index === 2 ? 36 : 12}><AnimatedPhoto src={item.src} objectPosition={item.position} startScale={1.08} endScale={1.12} dim={0.34} /></Sequence>)}
    <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(35,8,7,.16) 0%, rgba(35,8,7,.08) 38%, rgba(35,8,7,.90) 100%)"}} />
    <AbsoluteFill style={{padding: `170px ${SAFE_X}px 190px`, justifyContent: "flex-end"}}>
      {frame < 30 ? <RevealLine size={104}>Okay, don’t take<br />our word for it.</RevealLine> : <RevealLine size={83}>Look at what people in<br /><span style={{color: palette.gold, fontStyle: "italic"}}>Agartala actually cooked.</span></RevealLine>}
      <div style={{fontFamily: sans, color: "rgba(255,248,239,.72)", fontSize: 24, letterSpacing: ".14em", textTransform: "uppercase", marginTop: 28}}>Customer proof · 01</div>
    </AbsoluteFill>
  </AbsoluteFill>;
};
