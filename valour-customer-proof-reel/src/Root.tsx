import "./index.css";
import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/700.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/600-italic.css";
import {Composition} from "remotion";
import {ValourCustomerProof} from "./ValourCustomerProof";
import {AgartalaInvestigation} from "./AgartalaInvestigation";
import {AgartalaInvestigationV2} from "./AgartalaInvestigationV2";
import {ThreeStepProof} from "./ThreeStepProof";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ValourCustomerProof"
      component={ValourCustomerProof}
      durationInFrames={540}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="ValourAgartalaInvestigation"
      component={AgartalaInvestigation}
      durationInFrames={435}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="ValourAgartalaInvestigationV2"
      component={AgartalaInvestigationV2}
      durationInFrames={435}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="ValourThreeStepProof"
      component={ThreeStepProof}
      durationInFrames={510}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
