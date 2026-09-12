import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {assets, clamp, COLORS, reviews, safeX, sans, serif} from "../constants";
import {Photo} from "../components/Photo";
import {TextReveal} from "../components/TextReveal";

const proof = [
  {src: assets.subham, name: "SUBHAM · BANAMALIPUR", quote: reviews.subham, objectPosition: "50% 42%"},
  {src: assets.kakoli, name: "KAKOLI · HAPANIA", quote: reviews.kakoli, objectPosition: "45% 50%"},
];

export const PatternScene: React.FC = () => {
  const frame = useCurrentFrame();
  const active = frame < 45 ? 0 : 1;
  const local = frame % 45;
  const item = proof[active];
  const slide = interpolate(local, [0, 9], [80, 0], {...clamp, easing: Easing.out(Easing.cubic)});

  return (
    <AbsoluteFill style={{background: COLORS.ink, overflow: "hidden"}}>
      <div style={{position: "absolute", inset: 0, transform: `translateX(${active === 0 ? -slide : slide}px)`}}>
        <Photo src={item.src} start={0} end={45} fromScale={1.05} toScale={1.1} style={{objectPosition: item.objectPosition}} />
      </div>
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(20,7,7,.18), rgba(20,7,7,.08) 42%, rgba(20,7,7,.93) 100%)"}} />

      <div style={{position: "absolute", left: safeX, right: safeX, top: 105}}>
        <div style={{fontFamily: sans, color: COLORS.gold, fontWeight: 700, fontSize: 31, letterSpacing: 5}}>
          {active === 0 ? "DIFFERENT PEOPLE." : "SAME SHORTCUT."}
        </div>
      </div>

      <div style={{position: "absolute", left: safeX, right: safeX, bottom: 150}}>
        <TextReveal delay={active * 45 + 5 - active * 45} duration={9}>
          <div style={{fontFamily: serif, fontSize: active === 0 ? 64 : 56, lineHeight: 1.08, color: COLORS.cream, textShadow: "0 4px 20px rgba(0,0,0,.45)"}}>
            “{item.quote}”
          </div>
        </TextReveal>
        <div style={{marginTop: 30, fontFamily: sans, fontWeight: 700, fontSize: 27, letterSpacing: 3, color: COLORS.gold}}>
          REAL CUSTOMER · {item.name}
        </div>
      </div>
    </AbsoluteFill>
  );
};
