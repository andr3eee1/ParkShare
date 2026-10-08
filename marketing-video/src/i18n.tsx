import React, { createContext, useContext, useState } from 'react';

type Lang = 'en' | 'ro';

const translations = {
  en: {
    kicker: "EVERY DAY, IN EVERY CITY",
    problemHeadline: "Drivers circle the block.",
    counterText: "min lost searching",
    supplyHeadline: "While millions of driveways sit empty.",
    tagline: "Your city's hidden parking, unlocked.",
    findTitle: "01 — FIND",
    findDesc: "See open spots near you, live.",
    searchBar: "Downtown · Now",
    mapleStreet: "Maple St. Driveway",
    ratingWalk: "★ 4.9 · 2 min walk",
    reserveBtn: "Reserve spot",
    bookTitle: "02 — BOOK",
    bookDesc: "Reserved in seconds.",
    feature1: "Pay in one tap",
    feature2: "Turn-by-turn to the spot",
    feature3: "Verified hosts & insured",
    spotReserved: "Spot reserved",
    receipt: "Maple St. Driveway · Today 18:00–20:00 · Total $4.00",
    earnTitle: "03 — EARN",
    earnHeadline: "Have a driveway? Get paid.",
    thisMonth: "This month",
    outroHeadline: "Park smarter. Share more.",
    cta: "Get ParkShare"
  },
  ro: {
    kicker: "ÎN FIECARE ZI, ÎN ORICE ORAȘ",
    problemHeadline: "Șoferii se învârt în jurul blocului.",
    counterText: "minute pierdute căutând",
    supplyHeadline: "În timp ce milioane de curți stau goale.",
    tagline: "Locurile de parcare ascunse, acum deblocate.",
    findTitle: "01 — GĂSEȘTE",
    findDesc: "Vezi locurile libere de lângă tine, live.",
    searchBar: "Centru · Acum",
    mapleStreet: "Curte str. Arțarilor",
    ratingWalk: "★ 4.9 · 2 min de mers",
    reserveBtn: "Rezervă locul",
    bookTitle: "02 — REZERVĂ",
    bookDesc: "Rezervat în câteva secunde.",
    feature1: "Plătește cu o atingere",
    feature2: "Navigație pas cu pas",
    feature3: "Gazde verificate & asigurat",
    spotReserved: "Loc rezervat",
    receipt: "Curte str. Arțarilor · Azi 18:00–20:00 · Total $4.00",
    earnTitle: "03 — CÂȘTIGĂ",
    earnHeadline: "Ai o curte? Fii plătit.",
    thisMonth: "Luna aceasta",
    outroHeadline: "Parchează inteligent. Împarte mai mult.",
    cta: "Descarcă ParkShare"
  }
};

const I18nContext = createContext<{ lang: Lang; t: typeof translations['en'] }>({ lang: 'en', t: translations['en'] });

export const I18nProvider: React.FC<{ children: React.ReactNode, lang?: Lang }> = ({ children, lang = 'en' }) => {
  return (
    <I18nContext.Provider value={{ lang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext).t;
