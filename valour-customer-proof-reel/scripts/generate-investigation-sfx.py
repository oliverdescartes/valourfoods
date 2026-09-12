from __future__ import annotations

import math
import wave
from pathlib import Path

import numpy as np


RATE = 44100
OUT = Path(__file__).resolve().parents[1] / "public" / "agartala-investigation" / "audio"
RNG = np.random.default_rng(831)


def write(name: str, samples: np.ndarray) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    peak = max(float(np.max(np.abs(samples))), 1e-6)
    pcm = np.int16(np.clip(samples / peak * 0.82, -1, 1) * 32767)
    with wave.open(str(OUT / name), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        handle.writeframes(pcm.tobytes())


def time(seconds: float) -> np.ndarray:
    return np.arange(int(RATE * seconds)) / RATE


def lowpass(signal: np.ndarray, amount: float) -> np.ndarray:
    out = np.empty_like(signal)
    state = 0.0
    for index, value in enumerate(signal):
        state += amount * (value - state)
        out[index] = state
    return out


t = time(0.16)
pop = (np.sin(2 * math.pi * (780 * t + 900 * t * t)) + 0.4 * np.sin(2 * math.pi * 1560 * t))
write("pop.wav", pop * np.exp(-24 * t))

t = time(0.09)
snap = RNG.normal(0, 1, len(t)) * np.exp(-55 * t)
write("snap.wav", snap - lowpass(snap, 0.025))

t = time(0.42)
noise = RNG.normal(0, 1, len(t))
whoosh = lowpass(noise, 0.075) * np.sin(np.pi * np.clip(t / 0.42, 0, 1)) ** 1.6
write("whoosh.wav", whoosh)

t = time(0.5)
bass = np.sin(2 * math.pi * (92 * t - 34 * t * t)) * np.exp(-8 * t)
write("bass-hit.wav", bass)

t = time(0.9)
noise = RNG.normal(0, 1, len(t))
sizzle = (noise - lowpass(noise, 0.018)) * (0.45 + 0.55 * np.sin(2 * math.pi * 7 * t) ** 2)
write("sizzle.wav", sizzle * np.exp(-0.55 * t))

t = time(0.8)
noise = RNG.normal(0, 1, len(t))
pour = lowpass(noise, 0.018) * (1 - np.exp(-18 * t)) * np.exp(-0.8 * t)
write("pour.wav", pour)

t = time(0.85)
bubble = np.zeros_like(t)
for centre, frequency, gain in [(0.10, 170, 0.9), (0.26, 220, 0.65), (0.43, 145, 0.75), (0.62, 205, 0.55)]:
    rel = t - centre
    envelope = np.where(rel >= 0, np.exp(-34 * rel), 0)
    bubble += np.sin(2 * math.pi * frequency * rel) * envelope * gain
write("bubble.wav", bubble)
