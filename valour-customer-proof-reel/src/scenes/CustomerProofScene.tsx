import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {AnimatedPhoto} from "../components/AnimatedPhoto";
import {ProofLabel} from "../components/ProofLabel";
import {RevealLine} from "../components/EditorialText";
import {palette, SAFE_X, sans} from "../theme";

const customers = [
  {src: "customers/subham.png", position: "50% 54%", name: "Subham · Banamalipur", quote: "Tasty! creamy and onek beshi quantity."},
  {src: "customers/kakoli.jpg", position: "50% 48%", name: "Kakoli · Hapania", quote: "Amr ektu  bhoy chilo, bhalo hobe ki na! kintu rana ta shei hoyeche"},
  {src: "customers/depanki.jpeg", position: "50% 60%", name: "Depanki · Agartala", quote: "The original butter chicken! please bring more recepies."},
];

const Customer: React.FC<(typeof customers)[number]> = ({src, position, name, quote}) => <AbsoluteFill style={{backgroundColor: palette.ink}}>
  <AnimatedPhoto src={src} objectPosition={position} startScale={1.03} endScale={1.088} translateFrom="8px 8px" translateTo="-8px -8px" dim={0.28} />
  <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(28,7,6,.12) 0%, rgba(28,7,6,.16) 46%, rgba(28,7,6,.94) 100%)"}} />
  <AbsoluteFill style={{padding: `150px ${SAFE_X}px 175px`, justifyContent: "space-between"}}>
    <div><ProofLabel /><div style={{fontFamily: sans, fontSize: 23, fontWeight: 700, letterSpacing: ".08em", color: palette.cream, marginTop: 17, textTransform: "uppercase"}}>{name}</div></div>
    <div><div style={{fontFamily: "Georgia, serif", color: palette.gold, fontSize: 90, height: 65, lineHeight: 1}}>“</div><RevealLine size={quote.length > 60 ? 69 : 79} from={7}>{quote}</RevealLine><div style={{width: 116, height: 5, backgroundColor: palette.gold, marginTop: 30}} /></div>
  </AbsoluteFill>
</AbsoluteFill>;

export const CustomerProofScene: React.FC = () => <AbsoluteFill>{customers.map((customer, index) => <Sequence key={customer.name} from={index * 60} durationInFrames={60}><Customer {...customer} /></Sequence>)}</AbsoluteFill>;
