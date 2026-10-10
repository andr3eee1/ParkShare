import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AestheticBackground } from "./components/AestheticBackground";
import { ProgressBar } from "./components/ProgressBar";
import { Scene1Problem } from "./scenes/Scene1Problem";
import { Scene2Supply } from "./scenes/Scene2Supply";
import { Scene3Reveal } from "./scenes/Scene3Reveal";
import { Scene4Find } from "./scenes/Scene4Find";
import { Scene5Book } from "./scenes/Scene5Book";
import { ScenePark } from "./scenes/ScenePark";
import { SceneWallet } from "./scenes/SceneWallet";
import { SceneHost } from "./scenes/SceneHost";
import { Scene6Earn } from "./scenes/Scene6Earn";
import { SceneTrust } from "./scenes/SceneTrust";
import { Scene7Outro } from "./scenes/Scene7Outro";
import { theme } from "./theme";

const TRANSITION = 12;

const ScalingScene: React.FC<{ children: React.ReactNode; duration: number }> = ({ children, duration }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, duration], [1.0, 1.05], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: theme.typography.fontFamily }}>
      <AestheticBackground />
      <TransitionSeries>

        <TransitionSeries.Sequence durationInFrames={90}>
          <ScalingScene duration={90}><Scene1Problem /></ScalingScene>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />

        <TransitionSeries.Sequence durationInFrames={90}>
          <ScalingScene duration={90}><Scene2Supply /></ScalingScene>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />

        <TransitionSeries.Sequence durationInFrames={90}>
          <ScalingScene duration={90}><Scene3Reveal /></ScalingScene>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <ScalingScene duration={150}><Scene4Find /></ScalingScene>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <ScalingScene duration={150}><Scene5Book /></ScalingScene>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <ScalingScene duration={180}><ScenePark /></ScalingScene>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <ScalingScene duration={180}><SceneWallet /></ScalingScene>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <ScalingScene duration={180}><SceneHost /></ScalingScene>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />

        <TransitionSeries.Sequence durationInFrames={150}>
          <ScalingScene duration={150}><Scene6Earn /></ScalingScene>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <ScalingScene duration={180}><SceneTrust /></ScalingScene>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />

        <TransitionSeries.Sequence durationInFrames={240}>
          <ScalingScene duration={240}><Scene7Outro /></ScalingScene>
        </TransitionSeries.Sequence>

      </TransitionSeries>

      <ProgressBar />
    </AbsoluteFill>
  );
};
