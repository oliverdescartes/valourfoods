import {staticFile} from "remotion";

export const COLORS = {
  oxblood: "#831A1A",
  cream: "#FFF8EF",
  gold: "#F7D46C",
  ink: "#241312",
};

export const serif = '"Playfair Display", Georgia, serif';
export const sans = '"Work Sans", Arial, sans-serif';
export const safeX = 90;
export const clamp = {extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const};

const base = "agartala-investigation";

export const assets = {
  subham: staticFile(`${base}/customers/subham-food.png`),
  kakoli: staticFile(`${base}/customers/kakoli-food.jpg`),
  depanki: staticFile(`${base}/customers/depanki-food.jpeg`),
  anshu: staticFile(`${base}/customers/anshu-food.jpg`),
  anonymousResult: staticFile(`${base}/customers/another-review-no-name.png`),
  logo: staticFile(`${base}/brand/valour-logo.webp`),
  jar: staticFile(`${base}/brand/valour-jar.webp`),
  fry: staticFile(`${base}/process/fry.mp4`),
  pour: staticFile(`${base}/process/pour.mp4`),
  simmer: staticFile(`${base}/process/simmer.mp4`),
  voiceover: staticFile(`${base}/audio/voiceover.mp3`),
  pop: staticFile(`${base}/audio/pop.wav`),
  snap: staticFile(`${base}/audio/snap.wav`),
  whoosh: staticFile(`${base}/audio/whoosh.wav`),
  bass: staticFile(`${base}/audio/bass-hit.wav`),
  sizzle: staticFile(`${base}/audio/sizzle.wav`),
  pourSfx: staticFile(`${base}/audio/pour.wav`),
  bubble: staticFile(`${base}/audio/bubble.wav`),
};

export const reviews = {
  subham: "Tasty! creamy and onek beshi quantity.",
  kakoli: "Amr ektu bhoy chilo, bhalo hobe ki na! kintu rana ta shei hoyeche",
  depanki: "The original butter chicken! please bring more recepies.",
};
