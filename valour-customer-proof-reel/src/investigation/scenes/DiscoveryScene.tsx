import {AbsoluteFill, Easing, Img, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {assets, clamp, COLORS, safeX, sans, serif} from "../constants";
import {Photo} from "../components/Photo";
import {TextReveal} from "../components/TextReveal";

const originalStack = [
  {src: assets.depanki, delay: 0, rotate: -5, x: -245, y: 85},
  {src: assets.subham, delay: 9, rotate: 4, x: 160, y: 410},
  {src: assets.kakoli, delay: 18, rotate: -2, x: 310, y: 110},
];

const expandedStack = [
  {src: assets.depanki, delay: 0, rotate: -5, x: -115, y: 105},
  {src: assets.anshu, delay: 5, rotate: 4, x: 485, y: 115},
  {src: assets.subham, delay: 10, rotate: 3, x: -35, y: 610},
  {src: assets.anonymousResult, delay: 15, rotate: -3, x: 565, y: 625},
];

export const DiscoveryScene: React.FC<{expanded?: boolean}> = ({expanded = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const flashSources = expanded
    ? [assets.depanki, assets.anonymousResult, assets.subham, assets.anshu, assets.kakoli]
    : [assets.depanki, assets.subham, assets.kakoli];
  const flashLength = expanded ? 6 : 10;
  const flashIndex = Math.min(flashSources.length - 1, Math.floor(frame / flashLength));
  const flashScale = interpolate(frame % flashLength, [0, flashLength - 1], [1.02, 1.12], {...clamp, easing: Easing.out(Easing.quad)});
  const stackOpacity = interpolate(frame, [27, 32], [0, 1], clamp);
  const darken = frame < 28 ? 0.32 : 0;
  const stack = expanded ? expandedStack : originalStack;
  const cardWidth = expanded ? 430 : 510;
  const cardHeight = expanded ? 580 : 690;

  return (
    <AbsoluteFill style={{background: COLORS.cream, overflow: "hidden"}}>
      {frame < 30 ? (
        <>
          <Img
            src={flashSources[flashIndex]}
            style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${flashScale})`}}
          />
          <AbsoluteFill style={{background: `rgba(20,7,7,${darken})`}} />
        </>
      ) : null}

      <AbsoluteFill style={{opacity: stackOpacity}}>
        <div style={{position: "absolute", inset: 0, background: COLORS.cream}} />
        {stack.map((card, index) => {
          const progress = spring({fps, frame: frame - 28 - card.delay, config: {damping: 16, stiffness: 210}});
          const enterY = interpolate(progress, [0, 1], [720, 0]);
          return (
            <div
              key={card.src}
              style={{
                position: "absolute",
                width: cardWidth,
                height: cardHeight,
                left: card.x,
                top: card.y,
                padding: 14,
                background: "white",
                boxShadow: "0 26px 60px rgba(47,17,13,.24)",
                transform: `translateY(${enterY}px) rotate(${card.rotate}deg)`,
                zIndex: index + 1,
              }}
            >
              <Photo src={card.src} end={60} x={index === 1 ? -12 : 10} />
            </div>
          );
        })}
      </AbsoluteFill>

      <div style={{position: "absolute", left: safeX, right: safeX, top: 104, zIndex: 10}}>
        <div style={{fontFamily: sans, fontSize: 28, fontWeight: 700, letterSpacing: 5, color: frame < 30 ? COLORS.cream : COLORS.oxblood}}>
          AGARTALA · CUSTOMER PROOF
        </div>
      </div>
      <div style={{position: "absolute", left: safeX, right: safeX, bottom: 150, zIndex: 10}}>
        <TextReveal delay={1} duration={8}>
          <div style={{fontFamily: serif, fontWeight: 600, fontSize: 102, lineHeight: 0.94, color: COLORS.cream, textShadow: "0 5px 24px rgba(0,0,0,.5)"}}>
            OK… I SPOTTED
            <br />A PATTERN.
          </div>
        </TextReveal>
      </div>
      {frame >= 30 ? <AbsoluteFill style={{background: "linear-gradient(180deg, transparent 55%, rgba(131,26,26,.82) 100%)", zIndex: 8}} /> : null}
    </AbsoluteFill>
  );
};
