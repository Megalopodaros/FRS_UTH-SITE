/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DayProgram, ShowDescription, ArchiveItem } from "../types";

export const WEEKLY_SCHEDULE_EN: DayProgram[] = [
  {
    day: "Mon",
    fullName: "Monday",
    shows: [
      { id: "m1", title: "Morning Mix", time: "10:00 - 12:00", host: "DJ Apollo", tags: ["#LoFi"] },
      { id: "m2", title: "Campus Voices", time: "14:00 - 16:00", host: "Student Union", tags: ["#Talk"] },
      { id: "m3", title: "Electric Avenue", time: "18:00 - 20:00", host: "DJ Nova", tags: ["#Techno"] },
      { id: "m4", title: "Deep Space", time: "21:00 - 23:00", host: "The Cosmonaut", tags: ["#Ambient"] }
    ]
  },
  {
    day: "Tue",
    fullName: "Tuesday",
    shows: [
      { id: "tu1", title: "Indie Hour", time: "11:00 - 13:00", host: "Sarah V.", tags: ["#Indie"] },
      { id: "tu2", title: "Rock Anthems", time: "16:00 - 18:00", host: "DJ George", tags: ["#Rock"] }
    ]
  },
  {
    day: "Wed",
    fullName: "Wednesday",
    shows: [
      { id: "w1", title: "Beats & Rhymes", time: "15:00 - 17:00", host: "MC Flow", tags: ["#HipHop"] },
      { id: "w2", title: "Bass Drop", time: "20:00 - 22:00", host: "DJ Chloe", tags: ["#Dubstep"] }
    ]
  },
  {
    day: "Thu",
    fullName: "Thursday",
    shows: [
      { id: "th1", title: "Jazz Fusion", time: "20:00 - 22:00", host: "The Quartet", tags: ["#Jazz"] }
    ]
  },
  {
    day: "Fri",
    fullName: "Friday",
    shows: [
      { id: "f1", title: "Club Night", time: "22:00 - 00:00", host: "DJ X", tags: ["#House"] }
    ]
  },
  {
    day: "Sat",
    fullName: "Saturday",
    shows: [
      { id: "sa1", title: "Global Grooves", time: "18:00 - 20:00", host: "World Tour", tags: ["#World"] }
    ]
  },
  {
    day: "Sun",
    fullName: "Sunday",
    shows: [
      { id: "su1", title: "Lazy Sunday", time: "12:00 - 15:00", host: "Chill Crew", tags: ["#Acoustic"] }
    ]
  }
];

export const WEEKLY_SCHEDULE_GR: DayProgram[] = [
  {
    day: "Δευ",
    fullName: "Δευτέρα",
    shows: [
      { id: "m1", title: "Morning Mix", time: "10:00 - 12:00", host: "DJ Apollo", tags: ["#LoFi"] },
      { id: "m2", title: "Campus Voices", time: "14:00 - 16:00", host: "Spokesperson", tags: ["#Talk"] },
      { id: "m3", title: "Electric Avenue", time: "18:00 - 20:00", host: "DJ Nova", tags: ["#Techno"] },
      { id: "m4", title: "Deep Space", time: "21:00 - 23:00", host: "The Cosmonaut", tags: ["#Ambient"] }
    ]
  },
  {
    day: "Τρι",
    fullName: "Τρίτη",
    shows: [
      { id: "tu1", title: "Indie Hour", time: "11:00 - 13:00", host: "Sarah V.", tags: ["#Indie"] },
      { id: "tu2", title: "Rock Anthems", time: "16:00 - 18:00", host: "DJ George", tags: ["#Rock"] }
    ]
  },
  {
    day: "Τετ",
    fullName: "Τετάρτη",
    shows: [
      { id: "w1", title: "Beats & Rhymes", time: "15:00 - 17:00", host: "MC Flow", tags: ["#HipHop"] },
      { id: "w2", title: "Bass Drop", time: "20:00 - 22:00", host: "DJ Chloe", tags: ["#Dubstep"] }
    ]
  },
  {
    day: "Πεμ",
    fullName: "Πέμπτη",
    shows: [
      { id: "th1", title: "Jazz Fusion", time: "20:00 - 22:00", host: "The Quartet", tags: ["#Jazz"] }
    ]
  },
  {
    day: "Παρ",
    fullName: "Παρασκευή",
    shows: [
      { id: "f1", title: "Club Night", time: "22:00 - 00:00", host: "DJ X", tags: ["#House"] }
    ]
  },
  {
    day: "Σαβ",
    fullName: "Σάββατο",
    shows: [
      { id: "sa1", title: "Global Grooves", time: "18:00 - 20:00", host: "World Tour", tags: ["#World"] }
    ]
  },
  {
    day: "Κυρ",
    fullName: "Κυριακή",
    shows: [
      { id: "su1", title: "Lazy Sunday", time: "12:00 - 15:00", host: "Chill Crew", tags: ["#Acoustic"] }
    ]
  }
];

export const SHOWS_DESCRIPTIONS_EN: ShowDescription[] = [
  // ── Weekly Schedule Shows (unique per schedule slot) ──────────────
  {
    id: "m1",
    title: "Morning Mix",
    host: "DJ Apollo",
    description: "Start your week right with DJ Apollo's hand-picked lo-fi beats, mellow grooves, and smooth transitions. From chilled-out instrumentals to downtempo hip-hop — the perfect companion for Monday morning coffee and campus commutes.",
    tags: ["#LoFi", "#Chill"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRkpMEta5giWfYIsHvpJYy05_hwPOzPQGslC2l0SCEDX_kENK4eVFGmh0ipNzFe1QqFC2YhEtmmF32xLaVbRvxtW466Zfm5yiDJa4F1a78hM0Tz9TRu2WidkdmFr0Za4ji37tH05CETkvXjRpdRALaRfdGgMgr-EQRU7LtsK_lMhgYarLXe4ptZQ7K136bSRGacJRh1zUp3C8bHRNjsWtEoZTk9X8vxIPA8JCiEyjfCmvFDyHmg3y3ZLjRQEMW_AvOZ_0cMeYPA30"
  },
  {
    id: "m2",
    title: "Campus Voices",
    host: "Student Union",
    description: "The official voice of the student body. Campus Voices brings you in-depth discussions, interviews with faculty and fellow students, university news updates, and debates on the issues that matter most to campus life.",
    tags: ["#Talk", "#Campus"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtwaupN4mfG9Z1lNq4C4u84FUu0IJ0XXtQks5rdEBzwtIsaJJFbSpJLTmJCAW49qt9zwXjK_d9brhS46LYjnaYjPTszt-qpN453kJ-MVWUatUvcFW8lEXPLD2peAR3y-ZKsULVgz4KRQ3gcf4TxwwbSVJPri4daxAz5XNcOjjIaOc3jy5bVwtR_yoMWX2TYHSjXXE-9K3hq1fGju0_lX_H_CegogyoZsgOY_i19UvnjlP86ZlFK8_80JZepqdQPRU17B5l2KfME2E"
  },
  {
    id: "m3",
    title: "Electric Avenue",
    host: "DJ Nova",
    description: "DJ Nova takes you on an electrifying ride through the best of techno, electro, and synth-driven soundscapes. From pulsing basslines to shimmering arpeggios, Electric Avenue is where the voltage never drops.",
    tags: ["#Techno", "#Electro"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfQcIPRCRZHMyP7lgBeoLWCNigZYS9HGX0Hx1vBCA9KepoZ8uiIHHITJXTIR0pQJDjK63klAJZkUWrD5mFchtDjbBvLGeO1LVchmNBvTC5ZfI94R99GPqt1VuLok94oJFLDEM5R7wwVGve1vdCntt5D0SnL3yQZaSv7xTHVccNp36B0f_ZRPsPJJ-ZXXpk_YbQPQmKjapmI7YdDgQpFqzYecIAMHCUMOvnd9OnCz7QZ7EMUTYjXreqnIfPMS9qDdPNgP2oFJ3thrk"
  },
  {
    id: "m4",
    title: "Deep Space",
    host: "The Cosmonaut",
    description: "Drift into the cosmos with The Cosmonaut's curated selection of ambient textures, space-age synthesizers, and hypnotic drones. Ideal for late-night studying, meditation, or simply floating through the void.",
    tags: ["#Ambient", "#Space"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOyr-WN3KcT0lRg0vNmyOBCVGOvz_e3cFthHbRh8RltRJZiRKQb3HcW7VdKOX5XN7ahB9N2JRuS2k4WVauCctDdhxI7-7ojAKJ1lVQLSOdleouqDnBCFhrjM6WCP7XpURAsUqydWzVe1LsCQRk9KwkEGWq_K05kxJZ_mTTElSRort6T3hloo5b8-8AlwN1K2Ky2vdKiIyBv6jInDv4h0qjTZ5rx_fSERqiA07_ieD2IDWeI-m8OtT2oPu-9rWYixVTwjp8C264nzQ"
  },
  {
    id: "tu1",
    title: "Indie Hour",
    host: "Sarah V.",
    description: "Sarah V. digs through the underground to bring you the freshest indie rock, dream pop, and lo-fi bedroom recordings. Featuring exclusive premieres, vinyl picks, and the occasional live in-studio session from local artists.",
    tags: ["#Indie", "#DreamPop"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtwaupN4mfG9Z1lNq4C4u84FUu0IJ0XXtQks5rdEBzwtIsaJJFbSpJLTmJCAW49qt9zwXjK_d9brhS46LYjnaYjPTszt-qpN453kJ-MVWUatUvcFW8lEXPLD2peAR3y-ZKsULVgz4KRQ3gcf4TxwwbSVJPri4daxAz5XNcOjjIaOc3jy5bVwtR_yoMWX2TYHSjXXE-9K3hq1fGju0_lX_H_CegogyoZsgOY_i19UvnjlP86ZlFK8_80JZepqdQPRU17B5l2KfME2E"
  },
  {
    id: "tu2",
    title: "Rock Anthems",
    host: "DJ George",
    description: "DJ George cranks the amp to eleven with a hard-hitting selection of classic rock, grunge, and modern alternative anthems. From stadium sing-alongs to raw garage riffs — this is the show that rocks the airwaves every Tuesday.",
    tags: ["#Rock", "#Alternative"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdZ0k3ULoZ64vtIC7_Ck6XhJ5mzeQ9650TzbVQr5PX4jm7E874bBfebRKsUhxFMKoEvwXHkxbXZcr0d1HmH0AVFoDtpmoDkRBLO0iyl1FO2Aa9OTkSGz7IkeDuQ7D9FRaA9c89ieiPby8B257N_aZ0haVRBqcSDS62DOTAO_mlCV-8OC50vLryTPkf6Uvfu5sOwwhsPtlvbTvXTxCqh69bjSE77AukiT95yx6NanxvvNo_xPbDpFRfApPJ2SbpvfxdNgPmIeY2iGU"
  },
  {
    id: "w1",
    title: "Beats & Rhymes",
    host: "MC Flow",
    description: "MC Flow delivers a powerhouse blend of golden-age hip-hop, contemporary rap, and freestyle sessions. Expect deep crate-digging, exclusive freestyles from local MCs, and breakdowns of the culture that moves us.",
    tags: ["#HipHop", "#Rap"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdZ0k3ULoZ64vtIC7_Ck6XhJ5mzeQ9650TzbVQr5PX4jm7E874bBfebRKsUhxFMKoEvwXHkxbXZcr0d1HmH0AVFoDtpmoDkRBLO0iyl1FO2Aa9OTkSGz7IkeDuQ7D9FRaA9c89ieiPby8B257N_aZ0haVRBqcSDS62DOTAO_mlCV-8OC50vLryTPkf6Uvfu5sOwwhsPtlvbTvXTxCqh69bjSE77AukiT95yx6NanxvvNo_xPbDpFRfApPJ2SbpvfxdNgPmIeY2iGU"
  },
  {
    id: "w2",
    title: "Bass Drop",
    host: "DJ Chloe",
    description: "DJ Chloe unleashes bone-rattling dubstep, bass house, and heavy electronic cuts that will shake your speakers. Expect filthy drops, wobbling sub-bass, and the kind of energy that turns any Wednesday night into a festival.",
    tags: ["#Dubstep", "#Bass"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfQcIPRCRZHMyP7lgBeoLWCNigZYS9HGX0Hx1vBCA9KepoZ8uiIHHITJXTIR0pQJDjK63klAJZkUWrD5mFchtDjbBvLGeO1LVchmNBvTC5ZfI94R99GPqt1VuLok94oJFLDEM5R7wwVGve1vdCntt5D0SnL3yQZaSv7xTHVccNp36B0f_ZRPsPJJ-ZXXpk_YbQPQmKjapmI7YdDgQpFqzYecIAMHCUMOvnd9OnCz7QZ7EMUTYjXreqnIfPMS9qDdPNgP2oFJ3thrk"
  },
  {
    id: "th1",
    title: "Jazz Fusion",
    host: "The Quartet",
    description: "The Quartet blends classic jazz standards with modern fusion, funk, and improvisational experimentation. From smoky lounge vibes to high-energy solos — an evening of sophisticated musicianship every Thursday.",
    tags: ["#Jazz", "#Fusion"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAX5-ujToc_-iCliAMMGrbTc6aIAPBqphI9nfima_9_w8xwwdikTMyuuQ6SWQJEeflfIbDFj2m22m8qakP5UsXXXcPKQBds7TXsycMupTpARPsRmAwB1389gpAdJfHFOfifLaPHEYT98p5LmLqzxcLKs_Ub4TC3EktkSs0KJBlPdyfe7CG4JdQuBHs7O6y_EICvXCxi1-98hsW0olTxnX9Q6vG1WT95R31K_CBimpDle4FUVA7FoYMUqxfFYKgDuZso8HCnUq9y2T4"
  },
  {
    id: "f1",
    title: "Club Night",
    host: "DJ X",
    description: "The weekend starts here. DJ X drops the hottest house music, tech-house bangers, and dancefloor anthems to kick off your Friday night. Peak-time energy, seamless mixing, and the kind of sets that keep you moving until the lights come on.",
    tags: ["#House", "#Dance"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfQcIPRCRZHMyP7lgBeoLWCNigZYS9HGX0Hx1vBCA9KepoZ8uiIHHITJXTIR0pQJDjK63klAJZkUWrD5mFchtDjbBvLGeO1LVchmNBvTC5ZfI94R99GPqt1VuLok94oJFLDEM5R7wwVGve1vdCntt5D0SnL3yQZaSv7xTHVccNp36B0f_ZRPsPJJ-ZXXpk_YbQPQmKjapmI7YdDgQpFqzYecIAMHCUMOvnd9OnCz7QZ7EMUTYjXreqnIfPMS9qDdPNgP2oFJ3thrk"
  },
  {
    id: "sa1",
    title: "Global Grooves",
    host: "World Tour",
    description: "World Tour takes you on a sonic journey across continents — from Afrobeat rhythms and Latin percussion to Middle Eastern melodies and Asian-inspired electronic fusions. Every Saturday is a passport to a new musical destination.",
    tags: ["#World", "#Global"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAX5-ujToc_-iCliAMMGrbTc6aIAPBqphI9nfima_9_w8xwwdikTMyuuQ6SWQJEeflfIbDFj2m22m8qakP5UsXXXcPKQBds7TXsycMupTpARPsRmAwB1389gpAdJfHFOfifLaPHEYT98p5LmLqzxcLKs_Ub4TC3EktkSs0KJBlPdyfe7CG4JdQuBHs7O6y_EICvXCxi1-98hsW0olTxnX9Q6vG1WT95R31K_CBimpDle4FUVA7FoYMUqxfFYKgDuZso8HCnUq9y2T4"
  },
  {
    id: "su1",
    title: "Lazy Sunday",
    host: "Chill Crew",
    description: "Unwind with Chill Crew's laid-back selection of acoustic covers, folk melodies, and sun-drenched singer-songwriter tracks. The perfect soundtrack for slow mornings, brunch, and recharging before the new week begins.",
    tags: ["#Acoustic", "#Folk"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRkpMEta5giWfYIsHvpJYy05_hwPOzPQGslC2l0SCEDX_kENK4eVFGmh0ipNzFe1QqFC2YhEtmmF32xLaVbRvxtW466Zfm5yiDJa4F1a78hM0Tz9TRu2WidkdmFr0Za4ji37tH05CETkvXjRpdRALaRfdGgMgr-EQRU7LtsK_lMhgYarLXe4ptZQ7K136bSRGacJRh1zUp3C8bHRNjsWtEoZTk9X8vxIPA8JCiEyjfCmvFDyHmg3y3ZLjRQEMW_AvOZ_0cMeYPA30"
  },
  // ── Legacy Show Descriptions (kept for backward compatibility) ────
  {
    id: "desc1",
    title: "Midnight Sessions",
    host: "Alex Thorne",
    description: "An exploratory journey into deep house, minimal techno, and ambient soundscapes. Perfect for late-night studying or existential contemplation in the dark.",
    tags: ["#Electronic", "#Ambient"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOyr-WN3KcT0lRg0vNmyOBCVGOvz_e3cFthHbRh8RltRJZiRKQb3HcW7VdKOX5XN7ahB9N2JRuS2k4WVauCctDdhxI7-7ojAKJ1lVQLSOdleouqDnBCFhrjM6WCP7XpURAsUqydWzVe1LsCQRk9KwkEGWq_K05kxJZ_mTTElSRort6T3hloo5b8-8AlwN1K2Ky2vdKiIyBv6jInDv4h0qjTZ5rx_fSERqiA07_ieD2IDWeI-m8OtT2oPu-9rWYixVTwjp8C264nzQ"
  },
  {
    id: "desc2",
    title: "Vinyl Grooves",
    host: "Sarah Jenkins",
    description: "Dusting off the archives to bring you strictly wax selections. From rare 70s funk and soul to early hip-hop breaks, experiencing music the way it was meant to be heard.",
    tags: ["#Funk", "#Soul"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdZ0k3ULoZ64vtIC7_Ck6XhJ5mzeQ9650TzbVQr5PX4jm7E874bBfebRKsUhxFMKoEvwXHkxbXZcr0d1HmH0AVFoDtpmoDkRBLO0iyl1FO2Aa9OTkSGz7IkeDuQ7D9FRaA9c89ieiPby8B257N_aZ0haVRBqcSDS62DOTAO_mlCV-8OC50vLryTPkf6Uvfu5sOwwhsPtlvbTvXTxCqh69bjSE77AukiT95yx6NanxvvNo_xPbDpFRfApPJ2SbpvfxdNgPmIeY2iGU"
  },
  {
    id: "desc3",
    title: "Campus Indie Radar",
    host: "The FRS UTH Team",
    description: "Your weekly digest of the local scene. We're spotlighting the best up-and-coming bands on campus, featuring live studio sessions, interviews, and raw talent.",
    tags: ["#Indie", "#Local"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtwaupN4mfG9Z1lNq4C4u84FUu0IJ0XXtQks5rdEBzwtIsaJJFbSpJLTmJCAW49qt9zwXjK_d9brhS46LYjnaYjPTszt-qpN453kJ-MVWUatUvcFW8lEXPLD2peAR3y-ZKsULVgz4KRQ3gcf4TxwwbSVJPri4daxAz5XNcOjjIaOc3jy5bVwtR_yoMWX2TYHSjXXE-9K3hq1fGju0_lX_H_CegogyoZsgOY_i19UvnjlP86ZlFK8_80JZepqdQPRU17B5l2KfME2E"
  },
  {
    id: "desc4",
    title: "Electronic Avenue",
    host: "DJ Vector",
    description: "High-bpm, unapologetic electronic music. From drum and bass to hardcore techno, this is where the campus turns up the tempo and lets loose.",
    tags: ["#Techno", "#DnB"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfQcIPRCRZHMyP7lgBeoLWCNigZYS9HGX0Hx1vBCA9KepoZ8uiIHHITJXTIR0pQJDjK63klAJZkUWrD5mFchtDjbBvLGeO1LVchmNBvTC5ZfI94R99GPqt1VuLok94oJFLDEM5R7wwVGve1vdCntt5D0SnL3yQZaSv7xTHVccNp36B0f_ZRPsPJJ-ZXXpk_YbQPQmKjapmI7YdDgQpFqzYecIAMHCUMOvnd9OnCz7QZ7EMUTYjXreqnIfPMS9qDdPNgP2oFJ3thrk"
  },
  {
    id: "desc5",
    title: "Morning Mix",
    host: "Ben & Chloe",
    description: "Wake up right with a curated blend of upbeat indie pop, campus news, and caffeine-fueled banter. The essential soundtrack for your 8 AM commute.",
    tags: ["#Pop", "#Talk"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRkpMEta5giWfYIsHvpJYy05_hwPOzPQGslC2l0SCEDX_kENK4eVFGmh0ipNzFe1QqFC2YhEtmmF32xLaVbRvxtW466Zfm5yiDJa4F1a78hM0Tz9TRu2WidkdmFr0Za4ji37tH05CETkvXjRpdRALaRfdGgMgr-EQRU7LtsK_lMhgYarLXe4ptZQ7K136bSRGacJRh1zUp3C8bHRNjsWtEoZTk9X8vxIPA8JCiEyjfCmvFDyHmg3y3ZLjRQEMW_AvOZ_0cMeYPA30"
  },
  {
    id: "desc6",
    title: "Global Grooves",
    host: "Maya Patel",
    description: "Transcending borders with an eclectic mix of Afrobeat, Bossa Nova, and contemporary world music fusion. Expand your sonic horizons every Sunday.",
    tags: ["#World", "#Jazz"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAX5-ujToc_-iCliAMMGrbTc6aIAPBqphI9nfima_9_w8xwwdikTMyuuQ6SWQJEeflfIbDFj2m22m8qakP5UsXXXcPKQBds7TXsycMupTpARPsRmAwB1389gpAdJfHFOfifLaPHEYT98p5LmLqzxcLKs_Ub4TC3EktkSs0KJBlPdyfe7CG4JdQuBHs7O6y_EICvXCxi1-98hsW0olTxnX9Q6vG1WT95R31K_CBimpDle4FUVA7FoYMUqxfFYKgDuZso8HCnUq9y2T4"
  }
];

export const SHOWS_DESCRIPTIONS_GR: ShowDescription[] = [
  // ── Εκπομπές Εβδομαδιαίου Προγράμματος ──────────────
  {
    id: "m1",
    title: "Morning Mix",
    host: "DJ Apollo",
    description: "Ξεκίνα τη βδομάδα σου σωστά με τις χειροδιάλεκτες lo-fi επιλογές του DJ Apollo, απαλά grooves και ομαλές μεταβάσεις. Από χαλαρά instrumentals μέχρι downtempo hip-hop — ο τέλειος σύντροφος για τον πρωινό καφέ και τη μετακίνηση στο campus.",
    tags: ["#LoFi", "#Chill"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRkpMEta5giWfYIsHvpJYy05_hwPOzPQGslC2l0SCEDX_kENK4eVFGmh0ipNzFe1QqFC2YhEtmmF32xLaVbRvxtW466Zfm5yiDJa4F1a78hM0Tz9TRu2WidkdmFr0Za4ji37tH05CETkvXjRpdRALaRfdGgMgr-EQRU7LtsK_lMhgYarLXe4ptZQ7K136bSRGacJRh1zUp3C8bHRNjsWtEoZTk9X8vxIPA8JCiEyjfCmvFDyHmg3y3ZLjRQEMW_AvOZ_0cMeYPA30"
  },
  {
    id: "m2",
    title: "Campus Voices",
    host: "Εκπρόσωπος Φοιτητών",
    description: "Η επίσημη φωνή του φοιτητικού σώματος. Το Campus Voices φέρνει σε βάθος συζητήσεις, συνεντεύξεις με καθηγητές και συμφοιτητές, νέα του πανεπιστημίου και debates για τα θέματα που αφορούν τη φοιτητική ζωή.",
    tags: ["#Talk", "#Campus"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtwaupN4mfG9Z1lNq4C4u84FUu0IJ0XXtQks5rdEBzwtIsaJJFbSpJLTmJCAW49qt9zwXjK_d9brhS46LYjnaYjPTszt-qpN453kJ-MVWUatUvcFW8lEXPLD2peAR3y-ZKsULVgz4KRQ3gcf4TxwwbSVJPri4daxAz5XNcOjjIaOc3jy5bVwtR_yoMWX2TYHSjXXE-9K3hq1fGju0_lX_H_CegogyoZsgOY_i19UvnjlP86ZlFK8_80JZepqdQPRU17B5l2KfME2E"
  },
  {
    id: "m3",
    title: "Electric Avenue",
    host: "DJ Nova",
    description: "Ο DJ Nova σε παίρνει σε μια ηλεκτρισμένη βόλτα μέσα από τα καλύτερα techno, electro και synth-driven ηχοτοπία. Από pulsating basslines μέχρι arpeggios που λάμπουν, το Electric Avenue δεν ρίχνει ποτέ την τάση.",
    tags: ["#Techno", "#Electro"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfQcIPRCRZHMyP7lgBeoLWCNigZYS9HGX0Hx1vBCA9KepoZ8uiIHHITJXTIR0pQJDjK63klAJZkUWrD5mFchtDjbBvLGeO1LVchmNBvTC5ZfI94R99GPqt1VuLok94oJFLDEM5R7wwVGve1vdCntt5D0SnL3yQZaSv7xTHVccNp36B0f_ZRPsPJJ-ZXXpk_YbQPQmKjapmI7YdDgQpFqzYecIAMHCUMOvnd9OnCz7QZ7EMUTYjXreqnIfPMS9qDdPNgP2oFJ3thrk"
  },
  {
    id: "m4",
    title: "Deep Space",
    host: "The Cosmonaut",
    description: "Παρασύρσου στον κόσμο με τις επιλεγμένες ambient υφές, space-age synthesizers και υπνωτικά drones του Cosmonaut. Ιδανικό για νυχτερινό διάβασμα, διαλογισμό ή απλά για να πλανιέσαι στο κενό.",
    tags: ["#Ambient", "#Space"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOyr-WN3KcT0lRg0vNmyOBCVGOvz_e3cFthHbRh8RltRJZiRKQb3HcW7VdKOX5XN7ahB9N2JRuS2k4WVauCctDdhxI7-7ojAKJ1lVQLSOdleouqDnBCFhrjM6WCP7XpURAsUqydWzVe1LsCQRk9KwkEGWq_K05kxJZ_mTTElSRort6T3hloo5b8-8AlwN1K2Ky2vdKiIyBv6jInDv4h0qjTZ5rx_fSERqiA07_ieD2IDWeI-m8OtT2oPu-9rWYixVTwjp8C264nzQ"
  },
  {
    id: "tu1",
    title: "Indie Hour",
    host: "Sarah V.",
    description: "Η Sarah V. σκάβει στο underground για να σου φέρει το πιο φρέσκο indie rock, dream pop και lo-fi bedroom ηχογραφήσεις. Με αποκλειστικές πρεμιέρες, επιλογές βινυλίου και περιστασιακές ζωντανές sessions τοπικών καλλιτεχνών.",
    tags: ["#Indie", "#DreamPop"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtwaupN4mfG9Z1lNq4C4u84FUu0IJ0XXtQks5rdEBzwtIsaJJFbSpJLTmJCAW49qt9zwXjK_d9brhS46LYjnaYjPTszt-qpN453kJ-MVWUatUvcFW8lEXPLD2peAR3y-ZKsULVgz4KRQ3gcf4TxwwbSVJPri4daxAz5XNcOjjIaOc3jy5bVwtR_yoMWX2TYHSjXXE-9K3hq1fGju0_lX_H_CegogyoZsgOY_i19UvnjlP86ZlFK8_80JZepqdQPRU17B5l2KfME2E"
  },
  {
    id: "tu2",
    title: "Rock Anthems",
    host: "DJ George",
    description: "Ο DJ George γυρνάει τον ενισχυτή στο 11 με μια δυνατή επιλογή κλασικού rock, grunge και σύγχρονων alternative ύμνων. Από stadium sing-alongs μέχρι ωμά garage riffs — αυτή είναι η εκπομπή που ταρακουνάει κάθε Τρίτη.",
    tags: ["#Rock", "#Alternative"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdZ0k3ULoZ64vtIC7_Ck6XhJ5mzeQ9650TzbVQr5PX4jm7E874bBfebRKsUhxFMKoEvwXHkxbXZcr0d1HmH0AVFoDtpmoDkRBLO0iyl1FO2Aa9OTkSGz7IkeDuQ7D9FRaA9c89ieiPby8B257N_aZ0haVRBqcSDS62DOTAO_mlCV-8OC50vLryTPkf6Uvfu5sOwwhsPtlvbTvXTxCqh69bjSE77AukiT95yx6NanxvvNo_xPbDpFRfApPJ2SbpvfxdNgPmIeY2iGU"
  },
  {
    id: "w1",
    title: "Beats & Rhymes",
    host: "MC Flow",
    description: "Ο MC Flow παραδίδει ένα δυναμικό μείγμα golden-age hip-hop, σύγχρονου rap και freestyle sessions. Περίμενε deep crate-digging, αποκλειστικά freestyles τοπικών MCs και αναλύσεις της κουλτούρας που μας κινεί.",
    tags: ["#HipHop", "#Rap"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdZ0k3ULoZ64vtIC7_Ck6XhJ5mzeQ9650TzbVQr5PX4jm7E874bBfebRKsUhxFMKoEvwXHkxbXZcr0d1HmH0AVFoDtpmoDkRBLO0iyl1FO2Aa9OTkSGz7IkeDuQ7D9FRaA9c89ieiPby8B257N_aZ0haVRBqcSDS62DOTAO_mlCV-8OC50vLryTPkf6Uvfu5sOwwhsPtlvbTvXTxCqh69bjSE77AukiT95yx6NanxvvNo_xPbDpFRfApPJ2SbpvfxdNgPmIeY2iGU"
  },
  {
    id: "w2",
    title: "Bass Drop",
    host: "DJ Chloe",
    description: "Η DJ Chloe ξαπολύει dubstep που σπάει κόκαλα, bass house και βαριά ηλεκτρονικά κομμάτια που θα ταρακουνήσουν τα ηχεία σου. Περίμενε filthy drops, wobbling sub-bass και ενέργεια που μετατρέπει κάθε βράδυ Τετάρτης σε festival.",
    tags: ["#Dubstep", "#Bass"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfQcIPRCRZHMyP7lgBeoLWCNigZYS9HGX0Hx1vBCA9KepoZ8uiIHHITJXTIR0pQJDjK63klAJZkUWrD5mFchtDjbBvLGeO1LVchmNBvTC5ZfI94R99GPqt1VuLok94oJFLDEM5R7wwVGve1vdCntt5D0SnL3yQZaSv7xTHVccNp36B0f_ZRPsPJJ-ZXXpk_YbQPQmKjapmI7YdDgQpFqzYecIAMHCUMOvnd9OnCz7QZ7EMUTYjXreqnIfPMS9qDdPNgP2oFJ3thrk"
  },
  {
    id: "th1",
    title: "Jazz Fusion",
    host: "The Quartet",
    description: "Το Quartet συνδυάζει κλασικά jazz standards με μοντέρνα fusion, funk και αυτοσχεδιαστικό πειραματισμό. Από smoky lounge vibes μέχρι high-energy solos — ένα βράδυ εκλεπτυσμένης μουσικής κάθε Πέμπτη.",
    tags: ["#Jazz", "#Fusion"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAX5-ujToc_-iCliAMMGrbTc6aIAPBqphI9nfima_9_w8xwwdikTMyuuQ6SWQJEeflfIbDFj2m22m8qakP5UsXXXcPKQBds7TXsycMupTpARPsRmAwB1389gpAdJfHFOfifLaPHEYT98p5LmLqzxcLKs_Ub4TC3EktkSs0KJBlPdyfe7CG4JdQuBHs7O6y_EICvXCxi1-98hsW0olTxnX9Q6vG1WT95R31K_CBimpDle4FUVA7FoYMUqxfFYKgDuZso8HCnUq9y2T4"
  },
  {
    id: "f1",
    title: "Club Night",
    host: "DJ X",
    description: "Το Σαββατοκύριακο ξεκινάει εδώ. Ο DJ X ρίχνει τα πιο καυτά house κομμάτια, tech-house bangers και dancefloor anthems για να ξεκινήσεις τη Παρασκευή σου. Ενέργεια κορυφής, seamless mixing και sets που σε κρατάνε σε κίνηση.",
    tags: ["#House", "#Dance"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfQcIPRCRZHMyP7lgBeoLWCNigZYS9HGX0Hx1vBCA9KepoZ8uiIHHITJXTIR0pQJDjK63klAJZkUWrD5mFchtDjbBvLGeO1LVchmNBvTC5ZfI94R99GPqt1VuLok94oJFLDEM5R7wwVGve1vdCntt5D0SnL3yQZaSv7xTHVccNp36B0f_ZRPsPJJ-ZXXpk_YbQPQmKjapmI7YdDgQpFqzYecIAMHCUMOvnd9OnCz7QZ7EMUTYjXreqnIfPMS9qDdPNgP2oFJ3thrk"
  },
  {
    id: "sa1",
    title: "Global Grooves",
    host: "World Tour",
    description: "Το World Tour σε πηγαίνει σε ένα ηχητικό ταξίδι σε ηπείρους — από ρυθμούς Afrobeat και Latin κρουστά μέχρι μελωδίες Μέσης Ανατολής και ηλεκτρονικά fusions ασιατικής έμπνευσης. Κάθε Σάββατο είναι ένα διαβατήριο σε νέο μουσικό προορισμό.",
    tags: ["#World", "#Global"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAX5-ujToc_-iCliAMMGrbTc6aIAPBqphI9nfima_9_w8xwwdikTMyuuQ6SWQJEeflfIbDFj2m22m8qakP5UsXXXcPKQBds7TXsycMupTpARPsRmAwB1389gpAdJfHFOfifLaPHEYT98p5LmLqzxcLKs_Ub4TC3EktkSs0KJBlPdyfe7CG4JdQuBHs7O6y_EICvXCxi1-98hsW0olTxnX9Q6vG1WT95R31K_CBimpDle4FUVA7FoYMUqxfFYKgDuZso8HCnUq9y2T4"
  },
  {
    id: "su1",
    title: "Lazy Sunday",
    host: "Chill Crew",
    description: "Χαλάρωσε με τις laid-back επιλογές του Chill Crew — ακουστικά covers, folk μελωδίες και ηλιόλουστα singer-songwriter κομμάτια. Το τέλειο soundtrack για αργά πρωινά, brunch και ξεκούραση πριν αρχίσει η νέα εβδομάδα.",
    tags: ["#Acoustic", "#Folk"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRkpMEta5giWfYIsHvpJYy05_hwPOzPQGslC2l0SCEDX_kENK4eVFGmh0ipNzFe1QqFC2YhEtmmF32xLaVbRvxtW466Zfm5yiDJa4F1a78hM0Tz9TRu2WidkdmFr0Za4ji37tH05CETkvXjRpdRALaRfdGgMgr-EQRU7LtsK_lMhgYarLXe4ptZQ7K136bSRGacJRh1zUp3C8bHRNjsWtEoZTk9X8vxIPA8JCiEyjfCmvFDyHmg3y3ZLjRQEMW_AvOZ_0cMeYPA30"
  },
  // ── Παλαιότερες Περιγραφές (για συμβατότητα) ────
  {
    id: "desc1",
    title: "Midnight Sessions",
    host: "Alex Thorne",
    description: "Ένα εξερευνητικό ταξίδι στη deep house, minimal techno και ambient τοπία. Ιδανικό για διάβασμα αργά το βράδυ ή υπαρξιακή αναζήτηση στο σκοτάδι.",
    tags: ["#Electronic", "#Ambient"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOyr-WN3KcT0lRg0vNmyOBCVGOvz_e3cFthHbRh8RltRJZiRKQb3HcW7VdKOX5XN7ahB9N2JRuS2k4WVauCctDdhxI7-7ojAKJ1lVQLSOdleouqDnBCFhrjM6WCP7XpURAsUqydWzVe1LsCQRk9KwkEGWq_K05kxJZ_mTTElSRort6T3hloo5b8-8AlwN1K2Ky2vdKiIyBv6jInDv4h0qjTZ5rx_fSERqiA07_ieD2IDWeI-m8OtT2oPu-9rWYixVTwjp8C264nzQ"
  },
  {
    id: "desc2",
    title: "Vinyl Grooves",
    host: "Sarah Jenkins",
    description: "Ξεσκονίζουμε το αρχείο για να σας φέρουμε αποκλειστικά επιλογές από βινύλιο. Από σπάνια funk και soul των 70s έως early hip-hop breaks, απολαύστε τη μουσική όπως της αξίζει.",
    tags: ["#Funk", "#Soul"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdZ0k3ULoZ64vtIC7_Ck6XhJ5mzeQ9650TzbVQr5PX4jm7E874bBfebRKsUhxFMKoEvwXHkxbXZcr0d1HmH0AVFoDtpmoDkRBLO0iyl1FO2Aa9OTkSGz7IkeDuQ7D9FRaA9c89ieiPby8B257N_aZ0haVRBqcSDS62DOTAO_mlCV-8OC50vLryTPkf6Uvfu5sOwwhsPtlvbTvXTxCqh69bjSE77AukiT95yx6NanxvvNo_xPbDpFRfApPJ2SbpvfxdNgPmIeY2iGU"
  },
  {
    id: "desc3",
    title: "Campus Indie Radar",
    host: "Η Ομάδα του FRS UTH",
    description: "Η εβδομαδιαία ανασκόπηση της τοπικής σκηνής. Προβάλλουμε τις καλύτερες ανερχόμενες μπάντες στο πανεπιστήμιο με ζωντανές ηχογραφήσεις και συνεντεύξεις.",
    tags: ["#Indie", "#Local"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtwaupN4mfG9Z1lNq4C4u84FUu0IJ0XXtQks5rdEBzwtIsaJJFbSpJLTmJCAW49qt9zwXjK_d9brhS46LYjnaYjPTszt-qpN453kJ-MVWUatUvcFW8lEXPLD2peAR3y-ZKsULVgz4KRQ3gcf4TxwwbSVJPri4daxAz5XNcOjjIaOc3jy5bVwtR_yoMWX2TYHSjXXE-9K3hq1fGju0_lX_H_CegogyoZsgOY_i19UvnjlP86ZlFK8_80JZepqdQPRU17B5l2KfME2E"
  },
  {
    id: "desc4",
    title: "Electronic Avenue",
    host: "DJ Vector",
    description: "Υψηλό BPM, ασυμβίβαστη ηλεκτρονική μουσική. Από drum and bass μέχρι hardcore techno, εδώ είναι που το campus ανεβάζει την ταχύτητα και ξεσαλώνει.",
    tags: ["#Techno", "#DnB"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfQcIPRCRZHMyP7lgBeoLWCNigZYS9HGX0Hx1vBCA9KepoZ8uiIHHITJXTIR0pQJDjK63klAJZkUWrD5mFchtDjbBvLGeO1LVchmNBvTC5ZfI94R99GPqt1VuLok94oJFLDEM5R7wwVGve1vdCntt5D0SnL3yQZaSv7xTHVccNp36B0f_ZRPsPJJ-ZXXpk_YbQPQmKjapmI7YdDgQpFqzYecIAMHCUMOvnd9OnCz7QZ7EMUTYjXreqnIfPMS9qDdPNgP2oFJ3thrk"
  },
  {
    id: "desc5",
    title: "Morning Mix",
    host: "Ben & Chloe",
    description: "Ξυπνήστε σωστά με ένα επιλεγμένο μείγμα indie pop, νέα του πανεπιστημίου και κουβέντα με καφέ. Το απαραίτητο soundtrack για τη διαδρομή σας στις 8 π.μ.",
    tags: ["#Pop", "#Talk"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRkpMEta5giWfYIsHvpJYy05_hwPOzPQGslC2l0SCEDX_kENK4eVFGmh0ipNzFe1QqFC2YhEtmmF32xLaVbRvxtW466Zfm5yiDJa4F1a78hM0Tz9TRu2WidkdmFr0Za4ji37tH05CETkvXjRpdRALaRfdGgMgr-EQRU7LtsK_lMhgYarLXe4ptZQ7K136bSRGacJRh1zUp3C8bHRNjsWtEoZTk9X8vxIPA8JCiEyjfCmvFDyHmg3y3ZLjRQEMW_AvOZ_0cMeYPA30"
  },
  {
    id: "desc6",
    title: "Global Grooves",
    host: "Maya Patel",
    description: "Ξεπερνώντας τα σύνορα με μια εκλεκτική μίξη Afrobeat, Bossa Nova και σύγχρονης world fusion. Διευρύνετε τους μουσικούς σας ορίζοντες κάθε Κυριακή.",
    tags: ["#World", "#Jazz"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAX5-ujToc_-iCliAMMGrbTc6aIAPBqphI9nfima_9_w8xwwdikTMyuuQ6SWQJEeflfIbDFj2m22m8qakP5UsXXXcPKQBds7TXsycMupTpARPsRmAwB1389gpAdJfHFOfifLaPHEYT98p5LmLqzxcLKs_Ub4TC3EktkSs0KJBlPdyfe7CG4JdQuBHs7O6y_EICvXCxi1-98hsW0olTxnX9Q6vG1WT95R31K_CBimpDle4FUVA7FoYMUqxfFYKgDuZso8HCnUq9y2T4"
  }
];

export const ARCHIVE_ITEMS_EN: ArchiveItem[] = [
  {
    id: "arc1",
    title: "Midnight Circuits Vol. 4",
    date: "Oct 24, 2024",
    description: "DJ Vertex tearing through heavy industrial techno cuts and unreleased student demos.",
    tags: ["#Techno", "#Underground"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCew2lvki29-0UvxsVFeNF-kjaXUlqf4IiOhuJpu786GZDycUAr1AISsZ1gIFczB-NHo6SfTxnLmm-SYa5gKR_onEnRmKGAiSOqPg5v6QQpLOjQoJxfJ4kE8Ba6dq5iDlZgphOvT43vo2vmtAuLgdjPnLLZJ34RUSMBLWKpge9m3OGmDRxPFb4p1ikwLUO8EvOebTGJ6O_ersz16erBmBbE06P922krmrwO0Gu43L3M3V_7f1aoOrO26-I8sAIEUY0oU00vzYxNsYE"
  },
  {
    id: "arc2",
    title: "Study Session Frequencies",
    date: "Oct 18, 2024",
    description: "Two hours of uninterrupted chillhop and ambient beats to get you through finals week.",
    tags: ["#LoFi", "#Beats"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBD1tCw1ZdYSPE8sqn3COrBeM2gINnSp61A8rRSscwLAhoPR_2wHHKVMjSNnTPj3rL6JQl554N5DF5f8oTZ9q4C1fZp85yCCp-rZz5aOmBejRD9vVVQdiFq2ykLwa2w7SJVuMOLkP3zZQlLV2I9oxoCujQaQShaPN-4fz_GNh_aYAinzII14DHSPIx3uNP_7nuw_xEhrfqF6MQ6Q2g6OBX7wQI3l_NPh7qW2UCGvFC5zeSjq5UvcNapjoujVE6so8gCtnPT7Ka_GY"
  },
  {
    id: "arc3",
    title: "The Morning Debrief",
    date: "Oct 15, 2024",
    description: "Discussing the latest campus events, upcoming elections, and an interview with the Dean.",
    tags: ["#Talk", "#CampusNews"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0F5VnEb95pMmoOd7t61PWGX_MujYYBI5bFGarpZ2WMPDlBo-t6c0zYMIyCO2RvOonMCdbTTvMQ-hnVA2N0UWGsCoESpPaTJZLlsksIk6s5VlJB6BO_GWk0mkmxRZTib1a9EQNM2gLigXl0GHtYmcdE-85jLZ4DUpNgcXDfB2IuZpzQDHmB7udf6U1tiwLIEu0ful89iS4_2eECkEr5vmIf38cRnT2j0BZJIIMUMHtfLoGscoW80or4BloZNwQR1RJScM-eN08Uog"
  }
];

export const ARCHIVE_ITEMS_GR: ArchiveItem[] = [
  {
    id: "arc1",
    title: "Midnight Circuits Vol. 4",
    date: "24 Οκτ 2024",
    description: "Ο DJ Vertex σαρώνει με heavy industrial techno κομμάτια και ακυκλοφόρητα demos φοιτητών.",
    tags: ["#Techno", "#Underground"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCew2lvki29-0UvxsVFeNF-kjaXUlqf4IiOhuJpu786GZDycUAr1AISsZ1gIFczB-NHo6SfTxnLmm-SYa5gKR_onEnRmKGAiSOqPg5v6QQpLOjQoJxfJ4kE8Ba6dq5iDlZgphOvT43vo2vmtAuLgdjPnLLZJ34RUSMBLWKpge9m3OGmDRxPFb4p1ikwLUO8EvOebTGJ6O_ersz16erBmBbE06P922krmrwO0Gu43L3M3V_7f1aoOrO26-I8sAIEUY0oU00vzYxNsYE"
  },
  {
    id: "arc2",
    title: "Study Session Frequencies",
    date: "18 Οκτ 2024",
    description: "Δύο ώρες αδιάκοπου chillhop και ambient beats για να σας κρατήσουν συντροφιά στην εξεταστική.",
    tags: ["#LoFi", "#Beats"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBD1tCw1ZdYSPE8sqn3COrBeM2gINnSp61A8rRSscwLAhoPR_2wHHKVMjSNnTPj3rL6JQl554N5DF5f8oTZ9q4C1fZp85yCCp-rZz5aOmBejRD9vVVQdiFq2ykLwa2w7SJVuMOLkP3zZQlLV2I9oxoCujQaQShaPN-4fz_GNh_aYAinzII14DHSPIx3uNP_7nuw_xEhrfqF6MQ6Q2g6OBX7wQI3l_NPh7qW2UCGvFC5zeSjq5UvcNapjoujVE6so8gCtnPT7Ka_GY"
  },
  {
    id: "arc3",
    title: "The Morning Debrief",
    date: "15 Οκτ 2024",
    description: "Συζήτηση για τα τελευταία πανεπιστημιακά γεγονότα, επικείμενες εκλογές και συνέντευξη με τον Κοσμήτορα.",
    tags: ["#Talk", "#CampusNews"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0F5VnEb95pMmoOd7t61PWGX_MujYYBI5bFGarpZ2WMPDlBo-t6c0zYMIyCO2RvOonMCdbTTvMQ-hnVA2N0UWGsCoESpPaTJZLlsksIk6s5VlJB6BO_GWk0mkmxRZTib1a9EQNM2gLigXl0GHtYmcdE-85jLZ4DUpNgcXDfB2IuZpzQDHmB7udf6U1tiwLIEu0ful89iS4_2eECkEr5vmIf38cRnT2j0BZJIIMUMHtfLoGscoW80or4BloZNwQR1RJScM-eN08Uog"
  }
];

export const EXTRA_ARCHIVE_ITEMS_EN: ArchiveItem[] = [
  {
    id: "arc4",
    title: "Experimental Night",
    date: "Oct 12, 2024",
    description: "Glitch hop, IDM, and audio experiments from the media arts department.",
    tags: ["#Experimental", "#IDM"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHXG2Y29-0UvxsVFeNF-kjaXUlqf4IiOhuJpu786GZDycUAr1AISsZ1gIFczB-NHo6SfTxnLmm-SYa5gKR_onEnRmKGAiSOqPg5v6QQpLOjQoJxfJ4kE8Ba6dq5iDlZgphOvT43vo2vmtAuLgdjPnLLZJ34RUSMBLWKpge9m3OGmDRxPFb4p1ikwLUO8EvOebTGJ6O_ersz16erBmBbE06P922krmrwO0Gu43L3M3V_7f1aoOrO26-I8sAIEUY0oU00vzYxNsYE"
  },
  {
    id: "arc5",
    title: "Rhythm & Soul",
    date: "Oct 08, 2024",
    description: "Warm vinyl grooves from the jazz archive mixed with modern neo-soul vibes.",
    tags: ["#Jazz", "#Soul"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBD1tCw1ZdYSPE8sqn3COrBeM2gINnSp61A8rRSscwLAhoPR_2wHHKVMjSNnTPj3rL6JQl554N5DF5f8oTZ9q4C1fZp85yCCp-rZz5aOmBejRD9vVVQdiFq2ykLwa2w7SJVuMOLkP3zZQlLV2I9oxoCujQaQShaPN-4fz_GNh_aYAinzII14DHSPIx3uNP_7nuw_xEhrfqF6MQ6Q2g6OBX7wQI3l_NPh7qW2UCGvFC5zeSjq5UvcNapjoujVE6so8gCtnPT7Ka_GY"
  },
  {
    id: "arc6",
    title: "The Indie Hour",
    date: "Oct 05, 2024",
    description: "Highlighting local band demos and the freshest alternative student picks.",
    tags: ["#Indie", "#Local"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0F5VnEb95pMmoOd7t61PWGX_MujYYBI5bFGarpZ2WMPDlBo-t6c0zYMIyCO2RvOonMCdbTTvMQ-hnVA2N0UWGsCoESpPaTJZLlsksIk6s5VlJB6BO_GWk0mkmxRZTib1a9EQNM2gLigXl0GHtYmcdE-85jLZ4DUpNgcXDfB2IuZpzQDHmB7udf6U1tiwLIEu0ful89iS4_2eECkEr5vmIf38cRnT2j0BZJIIMUMHtfLoGscoW80or4BloZNwQR1RJScM-eN08Uog"
  }
];

export const EXTRA_ARCHIVE_ITEMS_GR: ArchiveItem[] = [
  {
    id: "arc4",
    title: "Experimental Night",
    date: "12 Οκτ 2024",
    description: "Glitch hop, IDM, και ηχητικοί πειραματισμοί από το τμήμα ψηφιακών τεχνών.",
    tags: ["#Experimental", "#IDM"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHXG2Y29-0UvxsVFeNF-kjaXUlqf4IiOhuJpu786GZDycUAr1AISsZ1gIFczB-NHo6SfTxnLmm-SYa5gKR_onEnRmKGAiSOqPg5v6QQpLOjQoJxfJ4kE8Ba6dq5iDlZgphOvT43vo2vmtAuLgdjPnLLZJ34RUSMBLWKpge9m3OGmDRxPFb4p1ikwLUO8EvOebTGJ6O_ersz16erBmBbE06P922krmrwO0Gu43L3M3V_7f1aoOrO26-I8sAIEUY0oU00vzYxNsYE"
  },
  {
    id: "arc5",
    title: "Rhythm & Soul",
    date: "08 Οκτ 2024",
    description: "Ζεστές αυλακώσεις βινυλίου από το αρχείο της jazz αναμεμειγμένες με neo-soul.",
    tags: ["#Jazz", "#Soul"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBD1tCw1ZdYSPE8sqn3COrBeM2gINnSp61A8rRSscwLAhoPR_2wHHKVMjSNnTPj3rL6JQl554N5DF5f8oTZ9q4C1fZp85yCCp-rZz5aOmBejRD9vVVQdiFq2ykLwa2w7SJVuMOLkP3zZQlLV2I9oxoCujQaQShaPN-4fz_GNh_aYAinzII14DHSPIx3uNP_7nuw_xEhrfqF6MQ6Q2g6OBX7wQI3l_NPh7qW2UCGvFC5zeSjq5UvcNapjoujVE6so8gCtnPT7Ka_GY"
  },
  {
    id: "arc6",
    title: "The Indie Hour",
    date: "05 Οκτ 2024",
    description: "Προβολή τοπικών συγκροτημάτων και εναλλακτικών φοιτητικών επιλογών.",
    tags: ["#Indie", "#Local"],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0F5VnEb95pMmoOd7t61PWGX_MujYYBI5bFGarpZ2WMPDlBo-t6c0zYMIyCO2RvOonMCdbTTvMQ-hnVA2N0UWGsCoESpPaTJZLlsksIk6s5VlJB6BO_GWk0mkmxRZTib1a9EQNM2gLigXl0GHtYmcdE-85jLZ4DUpNgcXDfB2IuZpzQDHmB7udf6U1tiwLIEu0ful89iS4_2eECkEr5vmIf38cRnT2j0BZJIIMUMHtfLoGscoW80or4BloZNwQR1RJScM-eN08Uog"
  }
];
