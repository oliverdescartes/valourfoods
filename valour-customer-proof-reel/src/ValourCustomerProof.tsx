import React from "react";
import {AbsoluteFill, Audio, Sequence, staticFile} from "remotion";
import {HookScene} from "./scenes/HookScene";
import {ContrastScene} from "./scenes/ContrastScene";
import {CustomerProofScene} from "./scenes/CustomerProofScene";
import {MechanismScene} from "./scenes/MechanismScene";
import {OutcomeScene} from "./scenes/OutcomeScene";

export const ValourCustomerProof: React.FC = () => <AbsoluteFill>
  <Audio src={staticFile("audio/valour-original-bed.wav")} volume={1} />
  <Sequence durationInFrames={60} name="01 Hook"><HookScene /></Sequence>
  <Sequence from={60} durationInFrames={90} name="02 Contrast"><ContrastScene /></Sequence>
  <Sequence from={150} durationInFrames={180} name="03 Customer proof"><CustomerProofScene /></Sequence>
  <Sequence from={330} durationInFrames={90} name="04 Product mechanism"><MechanismScene /></Sequence>
  <Sequence from={420} durationInFrames={120} name="05 Outcome and CTA"><OutcomeScene /></Sequence>
</AbsoluteFill>;
