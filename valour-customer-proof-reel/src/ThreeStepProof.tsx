import {Audio} from "@remotion/media";
import {AbsoluteFill, Sequence} from "remotion";
import {media} from "./three-step/constants";
import {CtaScene} from "./three-step/scenes/CtaScene";
import {HookScene} from "./three-step/scenes/HookScene";
import {ProcessScene} from "./three-step/scenes/ProcessScene";
import {ProofCollageScene} from "./three-step/scenes/ProofCollageScene";
import {ResultScene} from "./three-step/scenes/ResultScene";
import {YieldScene} from "./three-step/scenes/YieldScene";

export const ThreeStepProof: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={39} premountFor={12}><HookScene /></Sequence>
    <Sequence from={39} durationInFrames={135} premountFor={12}><ProofCollageScene /></Sequence>
    <Sequence from={174} durationInFrames={90} premountFor={12}><ProcessScene /></Sequence>
    <Sequence from={264} durationInFrames={75} premountFor={12}><ResultScene /></Sequence>
    <Sequence from={339} durationInFrames={90} premountFor={12}><YieldScene /></Sequence>
    <Sequence from={429} durationInFrames={81} premountFor={12}><CtaScene /></Sequence>

    <Sequence durationInFrames={16}><Audio src={media.impact} volume={0.13} /></Sequence>
    <Sequence from={39} durationInFrames={8}><Audio src={media.pop} volume={0.12} /></Sequence>
    <Sequence from={46} durationInFrames={6}><Audio src={media.snap} volume={0.1} /></Sequence>
    <Sequence from={56} durationInFrames={6}><Audio src={media.snap} volume={0.09} /></Sequence>
    <Sequence from={174} durationInFrames={27}><Audio src={media.sizzle} volume={0.07} /></Sequence>
    <Sequence from={204} durationInFrames={24}><Audio src={media.pourSfx} volume={0.08} /></Sequence>
    <Sequence from={234} durationInFrames={26}><Audio src={media.bubble} volume={0.07} /></Sequence>
    <Sequence from={264} durationInFrames={8}><Audio src={media.pop} volume={0.08} /></Sequence>
    <Sequence from={339} durationInFrames={15}><Audio src={media.whoosh} volume={0.08} /></Sequence>
    <Sequence from={429} durationInFrames={8}><Audio src={media.snap} volume={0.09} /></Sequence>
  </AbsoluteFill>
);
