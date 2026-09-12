import {Video} from "@remotion/media";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {clamp, colors, media, safeX, sans, serif} from "../constants";
import {MaskedReveal} from "../components/MaskedReveal";

const steps = [
  {word: "FRY.", src: media.fry, trimBefore: 14},
  {word: "POUR.", src: media.pour, trimBefore: 42},
  {word: "SIMMER.", src: media.simmer, trimBefore: 76},
];

const ProcessBeat: React.FC<(typeof steps)[number] & {index: number}> = ({word, src, trimBefore, index}) => {
  const frame = useCurrentFrame();
  const shade = interpolate(frame, [0, 8], [0.5, 0.26], clamp);
  return (
    <AbsoluteFill style={{background: colors.ink, overflow: "hidden"}}>
      <Video src={src} trimBefore={trimBefore} muted objectFit="cover" style={{width: "100%", height: "100%"}} />
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(20,7,7,${shade}), rgba(20,7,7,.06) 50%, rgba(20,7,7,.82) 100%)`}} />
      <div style={{position: "absolute", left: safeX, top: 104, display: "flex", alignItems: "center", gap: 18}}>
        <div style={{width: 66, height: 66, borderRadius: 36, background: colors.gold, display: "grid", placeItems: "center", fontFamily: sans, fontWeight: 700, fontSize: 25, color: colors.oxblood}}>0{index + 1}</div>
        <div style={{fontFamily: sans, fontSize: 24, fontWeight: 700, letterSpacing: 4, color: colors.cream}}>THE 3-STEP PROOF</div>
      </div>
      <div style={{position: "absolute", left: safeX, right: safeX, bottom: 145}}>
        <MaskedReveal duration={7}>
          <div style={{fontFamily: serif, fontWeight: 600, fontSize: 132, color: colors.cream, textShadow: "0 5px 24px rgba(0,0,0,.38)"}}>{word}</div>
        </MaskedReveal>
      </div>
    </AbsoluteFill>
  );
};

export const ProcessScene: React.FC = () => (
  <AbsoluteFill>
    {steps.map((step, index) => (
      <Sequence key={step.word} from={index * 30} durationInFrames={30} premountFor={10}>
        <ProcessBeat {...step} index={index} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
