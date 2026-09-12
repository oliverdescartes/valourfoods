import {AbsoluteFill} from "remotion";
import {customerProof, colors, safeX, sans, serif} from "../constants";
import {MaskedReveal} from "../components/MaskedReveal";
import {ProofCard} from "../components/ProofCard";

export const ProofCollageScene: React.FC = () => (
  <AbsoluteFill style={{background: colors.cream, overflow: "hidden"}}>
    <div style={{position: "absolute", inset: 0, opacity: 0.08, backgroundImage: `radial-gradient(${colors.oxblood} 1.3px, transparent 1.3px)`, backgroundSize: "36px 36px"}} />
    <div style={{position: "absolute", left: safeX, right: safeX, top: 82}}>
      <MaskedReveal duration={9}>
        <div style={{fontFamily: serif, fontWeight: 600, fontSize: 67, lineHeight: 1, color: colors.oxblood}}>
          Agartala customers
          <br />tried it.
        </div>
      </MaskedReveal>
      <div style={{marginTop: 18, fontFamily: sans, fontWeight: 700, fontSize: 22, letterSpacing: 3.5, color: colors.ink}}>
        THEIR PHOTOS · THEIR EXACT WORDS
      </div>
    </div>

    <div style={{position: "absolute", left: safeX, right: safeX, top: 330, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34}}>
      {customerProof.map((item, index) => (
        <ProofCard key={item.name} index={index} {...item} />
      ))}
    </div>
  </AbsoluteFill>
);
