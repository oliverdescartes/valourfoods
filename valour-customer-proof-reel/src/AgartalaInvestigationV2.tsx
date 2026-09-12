import {Audio} from "@remotion/media";
import {AbsoluteFill, Sequence} from "remotion";
import {assets} from "./investigation/constants";
import {ConnectionScene} from "./investigation/scenes/ConnectionScene";
import {DiscoveryScene} from "./investigation/scenes/DiscoveryScene";
import {FinalScene} from "./investigation/scenes/FinalScene";
import {MechanismScene} from "./investigation/scenes/MechanismScene";
import {PatternScene} from "./investigation/scenes/PatternScene";

export const AgartalaInvestigationV2: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={60} premountFor={15}>
      <DiscoveryScene expanded />
    </Sequence>
    <Sequence from={60} durationInFrames={90} premountFor={15}>
      <PatternScene />
    </Sequence>
    <Sequence from={150} durationInFrames={90} premountFor={15}>
      <ConnectionScene expanded />
    </Sequence>
    <Sequence from={240} durationInFrames={90} premountFor={15}>
      <MechanismScene />
    </Sequence>
    <Sequence from={330} durationInFrames={105} premountFor={15}>
      <FinalScene />
    </Sequence>

    <Sequence durationInFrames={8}><Audio src={assets.pop} volume={0.16} /></Sequence>
    <Sequence from={6} durationInFrames={6}><Audio src={assets.snap} volume={0.11} /></Sequence>
    <Sequence from={12} durationInFrames={6}><Audio src={assets.snap} volume={0.11} /></Sequence>
    <Sequence from={18} durationInFrames={6}><Audio src={assets.snap} volume={0.1} /></Sequence>
    <Sequence from={24} durationInFrames={6}><Audio src={assets.snap} volume={0.1} /></Sequence>
    <Sequence from={30} durationInFrames={15}><Audio src={assets.whoosh} volume={0.1} /></Sequence>
    <Sequence from={176} durationInFrames={16}><Audio src={assets.bass} volume={0.13} /></Sequence>
    <Sequence from={240} durationInFrames={27}><Audio src={assets.sizzle} volume={0.07} /></Sequence>
    <Sequence from={270} durationInFrames={24}><Audio src={assets.pourSfx} volume={0.08} /></Sequence>
    <Sequence from={300} durationInFrames={26}><Audio src={assets.bubble} volume={0.07} /></Sequence>
  </AbsoluteFill>
);
