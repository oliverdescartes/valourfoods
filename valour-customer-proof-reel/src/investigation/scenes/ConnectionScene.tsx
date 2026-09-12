import {AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {assets, clamp, COLORS, safeX, sans, serif} from "../constants";
import {Photo} from "../components/Photo";
import {TextReveal} from "../components/TextReveal";

type EvidenceCard = {
  src: string;
  left: number;
  top: number;
  rotate: number;
  width: number;
  height: number;
  label?: string;
};

const originalEvidence: EvidenceCard[] = [
  {src: assets.subham, left: -80, top: 330, rotate: -7, width: 440, height: 430},
  {src: assets.kakoli, left: 690, top: 270, rotate: 6, width: 440, height: 430},
  {src: assets.depanki, left: -25, top: 1160, rotate: 5, width: 440, height: 430},
];

const expandedEvidence: EvidenceCard[] = [
  {src: assets.subham, left: -75, top: 345, rotate: -7, width: 380, height: 330},
  {src: assets.kakoli, left: 770, top: 335, rotate: 6, width: 380, height: 330},
  {src: assets.anonymousResult, left: -35, top: 760, rotate: -3, width: 310, height: 480},
  {src: assets.depanki, left: -75, top: 1260, rotate: 5, width: 370, height: 330},
  {src: assets.anshu, left: 785, top: 1210, rotate: -5, width: 370, height: 350, label: "ANSHU"},
];

const originalPaths = [
  "M 320 740 Q 430 850 540 970",
  "M 760 700 Q 650 820 540 970",
  "M 320 1360 Q 430 1170 540 970",
];

const expandedPaths = [
  "M 120 510 Q 355 690 540 970",
  "M 960 500 Q 720 690 540 970",
  "M 140 1000 Q 350 980 540 970",
  "M 115 1410 Q 360 1180 540 970",
  "M 965 1370 Q 745 1160 540 970",
];

export const ConnectionScene: React.FC<{expanded?: boolean}> = ({expanded = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const jarProgress = spring({fps, frame: frame - 28, config: {damping: 15, stiffness: 145, mass: 0.9}});
  const jarScale = interpolate(jarProgress, [0, 1], [0.55, 1]);
  const jarOpacity = interpolate(frame, [24, 34], [0, 1], clamp);
  const lineProgress = interpolate(frame, [5, 35], [0, 1], clamp);
  const evidence = expanded ? expandedEvidence : originalEvidence;
  const paths = expanded ? expandedPaths : originalPaths;

  return (
    <AbsoluteFill style={{background: COLORS.oxblood, overflow: "hidden"}}>
      <div style={{position: "absolute", inset: 0, opacity: 0.09, backgroundImage: "radial-gradient(#F7D46C 1.5px, transparent 1.5px)", backgroundSize: "34px 34px"}} />
      <div style={{position: "absolute", left: safeX, right: safeX, top: 110, zIndex: 8}}>
        <TextReveal duration={8}>
          <div style={{fontFamily: serif, fontSize: 78, lineHeight: 1, color: COLORS.cream}}>What connected them?</div>
        </TextReveal>
      </div>

      {evidence.map((card, index) => {
        const enter = spring({fps, frame: frame - index * 5, config: {damping: 18, stiffness: 180}});
        const x = interpolate(enter, [0, 1], [index === 1 ? 350 : -350, 0]);
        return (
          <div key={card.src} style={{position: "absolute", left: card.left, top: card.top, width: card.width, height: card.height, padding: 11, background: COLORS.cream, boxShadow: "0 22px 50px rgba(20,7,7,.32)", transform: `translateX(${x}px) rotate(${card.rotate}deg)`, zIndex: 2}}>
            <Photo src={card.src} end={90} />
            {card.label ? (
              <div style={{position: "absolute", right: 18, bottom: 18, padding: "8px 14px", borderRadius: 20, background: COLORS.gold, fontFamily: sans, fontWeight: 700, fontSize: 19, letterSpacing: 2, color: COLORS.oxblood}}>
                REAL CUSTOMER · {card.label}
              </div>
            ) : null}
          </div>
        );
      })}

      <svg width="1080" height="1920" style={{position: "absolute", inset: 0, zIndex: 3}}>
        {paths.map((path) => (
          <path key={path} d={path} fill="none" stroke={COLORS.gold} strokeWidth={6} strokeLinecap="round" strokeDasharray="800" strokeDashoffset={800 * (1 - lineProgress)} />
        ))}
        <circle cx="540" cy="970" r={16 + lineProgress * 10} fill={COLORS.gold} />
      </svg>

      <div style={{position: "absolute", left: 300, top: 600, width: 480, height: 690, zIndex: 5, opacity: jarOpacity, transform: `scale(${jarScale})`, transformOrigin: "50% 55%", filter: "drop-shadow(0 30px 28px rgba(24,8,5,.35))"}}>
        <Img src={assets.jar} style={{width: "100%", height: "100%", objectFit: "contain"}} />
      </div>

      <div style={{position: "absolute", left: safeX, right: safeX, bottom: 130, textAlign: "center", zIndex: 8}}>
        <TextReveal delay={43} duration={9}>
          <div style={{fontFamily: sans, fontWeight: 700, fontSize: 31, letterSpacing: 6, color: COLORS.gold}}>THE COMMON LINK</div>
          <div style={{fontFamily: serif, fontWeight: 600, fontSize: 105, lineHeight: 1, color: COLORS.cream, marginTop: 12}}>VALOUR.</div>
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};
