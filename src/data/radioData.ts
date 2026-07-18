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
      { id: "m3", title: "Electric Avenue", time: "18:00 - 20:00", host: "DJ Nova", tags: ["#Techno"], isLive: true },
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
      { id: "m3", title: "Electric Avenue", time: "18:00 - 20:00", host: "DJ Nova", tags: ["#Techno"], isLive: true },
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
    host: "The FRS Team",
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
    host: "Η Ομάδα του FRS",
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
