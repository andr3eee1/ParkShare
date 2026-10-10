import React from 'react';
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { I18nProvider } from "./i18n";

export const RemotionVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="ParkShareVideo"
        component={() => <I18nProvider lang="en"><MainVideo /></I18nProvider>}
        durationInFrames={1560}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ParkShareVideo-RO"
        component={() => <I18nProvider lang="ro"><MainVideo /></I18nProvider>}
        durationInFrames={1560}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
