"use client";

import dynamic from "next/dynamic";

const Antigravity = dynamic(() => import("./Antigravity"), { ssr: false });

export default function AntigravityBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Antigravity
        count={1300}
        magnetRadius={6}
        ringRadius={8}
        waveSpeed={0.6}
        waveAmplitude={1.1}
        particleSize={1.5}
        lerpSpeed={0.05}
        color="#c8beef"
        autoAnimate
        particleVariance={1}
        rotationSpeed={0}
        depthFactor={1}
        pulseSpeed={3}
        particleShape="capsule"
        fieldStrength={10}
      />
    </div>
  );
}