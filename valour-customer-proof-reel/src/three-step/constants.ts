import {staticFile} from "remotion";

export const colors = {
  oxblood: "#831A1A",
  cream: "#FFF8EF",
  gold: "#F7D46C",
  ink: "#241312",
};

export const serif = '"Playfair Display", Georgia, serif';
export const sans = '"Work Sans", Arial, sans-serif';
export const safeX = 90;
export const clamp = {extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const};

const base = "three-step-proof";

export const media = {
  opening: staticFile(`${base}/customers/opening-customer-clip.mov`),
  subham: staticFile(`${base}/customers/subham-food.png`),
  anshu: staticFile(`${base}/customers/anshu-food.jpg`),
  kakoli: staticFile(`${base}/customers/kakoli-food.jpg`),
  rahul: staticFile(`${base}/customers/rahul-food.jpeg`),
  fry: staticFile(`${base}/process/fry.mp4`),
  pour: staticFile(`${base}/process/pour.mp4`),
  simmer: staticFile(`${base}/process/simmer.mp4`),
  jar: staticFile(`${base}/brand/valour-jar.webp`),
  logo: staticFile(`${base}/brand/valour-logo.webp`),
  impact: staticFile(`${base}/audio/impact.wav`),
  pop: staticFile(`${base}/audio/pop.wav`),
  snap: staticFile(`${base}/audio/snap.wav`),
  whoosh: staticFile(`${base}/audio/whoosh.wav`),
  sizzle: staticFile(`${base}/audio/sizzle.wav`),
  pourSfx: staticFile(`${base}/audio/pour.wav`),
  bubble: staticFile(`${base}/audio/bubble.wav`),
};

export const customerProof = [
  {
    name: "SUBHAM",
    src: media.subham,
    quote: "Tasty! creamy and onek beshi quantity.",
    objectPosition: "50% 47%",
  },
  {
    name: "ANSHU",
    src: media.anshu,
    quote: "The original butter chicken! please bring more recepies.",
    objectPosition: "50% 49%",
  },
  {
    name: "KAKOLI",
    src: media.kakoli,
    quote: "Amr ektu bhoy chilo, bhalo hobe ki na! kintu rana ta shei hoyeche",
    objectPosition: "45% 50%",
  },
  {
    name: "RAHUL",
    src: media.rahul,
    quote: "Onek tasty! pura family bhalo peyeche. keep it up!",
    objectPosition: "50% 55%",
  },
];
