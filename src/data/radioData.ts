/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DayProgram, ShowDescription, ArchiveItem, StationEvent } from "../types";
import { SHOW_FILES } from "virtual:show-images";

export interface GalleryImage {
  id: string;
  name: string;
  category: string;
  path: string;
}

// Known curated names & categories for default images
const KNOWN_PRESETS: Record<string, { name: string; category: string }> = {
  "vinyl.jpg": { name: "Vinyl Player & LP", category: "Μουσική Ροή" },
  "studio.jpg": { name: "Radio Studio & Mic", category: "Broadcast" },
  "on-air.png": { name: "On Air Neon & Mixer", category: "Live Studio" },
  "concert.jpg": { name: "Concert & Party", category: "Live Stage" }
};

function formatImageTitle(fileName: string): string {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  return nameWithoutExt
    .split(/[-_]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const fallbackFiles = ["vinyl.jpg", "studio.jpg", "on-air.png", "concert.jpg"];
const availableFiles = Array.isArray(SHOW_FILES) && SHOW_FILES.length > 0 ? SHOW_FILES : fallbackFiles;

export const SHOW_GALLERY_PRESETS: GalleryImage[] = availableFiles.map((file) => {
  const id = file.replace(/\.[^/.]+$/, "");
  const known = KNOWN_PRESETS[file.toLowerCase()];
  return {
    id,
    name: known ? known.name : formatImageTitle(file),
    category: known ? known.category : "Σταθμός",
    path: `/shows/${file}`
  };
});

export const WEEKLY_SCHEDULE_EN: DayProgram[] = [
  {
    day: "Mon",
    fullName: "Monday",
    shows: [
      {
        id: "m1",
        title: "Morning Mix",
        time: "10:00 - 12:00",
        host: "Apollo",
        tags: ["#LoFi", "#Chill"],
        description: "Start your week right with Apollo's hand-picked lo-fi beats, mellow grooves, and smooth transitions. From chilled-out instrumentals to downtempo hip-hop — the perfect companion for Monday morning coffee and campus commutes."
      },
      {
        id: "m2",
        title: "Campus Voices",
        time: "14:00 - 16:00",
        host: "Student Union",
        tags: ["#Talk", "#Campus"],
        description: "The official voice of the student body. Campus Voices brings you in-depth discussions, interviews with faculty and fellow students, university news updates, and debates on the issues that matter most to campus life."
      },
      {
        id: "m3",
        title: "Electric Avenue",
        time: "18:00 - 20:00",
        host: "Nova",
        tags: ["#Techno", "#Electro"],
        description: "Nova takes you on an electrifying ride through the best of techno, electro, and synth-driven soundscapes. From pulsing basslines to shimmering arpeggios, Electric Avenue is where the voltage never drops."
      },
      {
        id: "m4",
        title: "Deep Space",
        time: "21:00 - 23:00",
        host: "The Cosmonaut",
        tags: ["#Ambient", "#Space"],
        description: "Drift into the cosmos with The Cosmonaut's curated selection of ambient textures, space-age synthesizers, and hypnotic drones. Ideal for late-night studying, meditation, or simply floating through the void."
      }
    ]
  },
  {
    day: "Tue",
    fullName: "Tuesday",
    shows: [
      {
        id: "tu1",
        title: "Indie Hour",
        time: "11:00 - 13:00",
        host: "Sarah V.",
        tags: ["#Indie", "#DreamPop"],
        description: "Sarah V. digs through the underground to bring you the freshest indie rock, dream pop, and lo-fi bedroom recordings. Featuring exclusive premieres, vinyl picks, and the occasional live in-studio session from local artists."
      },
      {
        id: "tu2",
        title: "Rock Anthems",
        time: "16:00 - 18:00",
        host: "George",
        tags: ["#Rock", "#Alternative"],
        description: "George turns the amplifier to 11 with a powerhouse lineup of classic rock, grunge, and modern alternative anthems. From stadium sing-alongs to raw garage riffs — this is the show that shakes your Tuesday."
      }
    ]
  },
  {
    day: "Wed",
    fullName: "Wednesday",
    shows: [
      {
        id: "w1",
        title: "Beats & Rhymes",
        time: "15:00 - 17:00",
        host: "MC Flow",
        tags: ["#HipHop", "#Rap"],
        description: "MC Flow delivers a hard-hitting journey through golden-age hip-hop, contemporary rap, and underground boom-bap. Expect deep crate-digging, exclusive freestyles from local artists, and breakdowns of the culture that moves us."
      },
      {
        id: "w2",
        title: "Bass Drop",
        time: "20:00 - 22:00",
        host: "Chloe",
        tags: ["#Dubstep", "#Bass"],
        description: "Chloe unleashes bone-rattling dubstep, bass house, and heavy electronic bangers guaranteed to test your speakers. Expect filthy drops, wobbling sub-bass, and festival-grade energy every Wednesday night."
      }
    ]
  },
  {
    day: "Thu",
    fullName: "Thursday",
    shows: [
      {
        id: "th1",
        title: "Jazz Fusion",
        time: "20:00 - 22:00",
        host: "The Quartet",
        tags: ["#Jazz", "#Fusion"],
        description: "The Quartet blends timeless jazz standards with modern fusion, funk grooves, and improvisational experimentation. From smoky lounge moods to high-energy brass solos — your Thursday night ticket to sophisticated sound."
      }
    ]
  },
  {
    day: "Fri",
    fullName: "Friday",
    shows: [
      {
        id: "f1",
        title: "Club Night",
        time: "22:00 - 00:00",
        host: "Alex",
        tags: ["#House", "#Dance"],
        description: "The weekend starts here. Alex spins peak-time house, tech-house bangers, and pulsating dancefloor anthems to kick off your Friday night right. High energy, seamless mixing, and tracks that keep you moving."
      }
    ]
  },
  {
    day: "Sat",
    fullName: "Saturday",
    shows: [
      {
        id: "sa1",
        title: "Global Grooves",
        time: "18:00 - 20:00",
        host: "World Tour",
        tags: ["#World", "#Global"],
        description: "World Tour takes you on a sonic journey across continents — from Afrobeat rhythms and Latin percussion to Middle Eastern melodies and Asian-inspired electronic fusions. Every Saturday is a passport to new sounds."
      }
    ]
  },
  {
    day: "Sun",
    fullName: "Sunday",
    shows: [
      {
        id: "su1",
        title: "Lazy Sunday",
        time: "12:00 - 15:00",
        host: "Chill Crew",
        tags: ["#Acoustic", "#Folk"],
        description: "Wind down with the Chill Crew's laid-back selection of acoustic covers, gentle folk melodies, and sun-drenched singer-songwriter tracks. The perfect backdrop for late mornings, studying, and Sunday relaxation."
      }
    ]
  }
];

export const WEEKLY_SCHEDULE_GR: DayProgram[] = [
  {
    day: "Δευ",
    fullName: "Δευτέρα",
    shows: [
      {
        id: "m1",
        title: "Morning Mix",
        time: "10:00 - 12:00",
        host: "Apollo",
        tags: ["#LoFi", "#Chill"],
        description: "Ξεκίνα τη βδομάδα σου σωστά με τις χειροδιάλεκτες lo-fi επιλογές του Apollo, απαλά grooves και ομαλές μεταβάσεις. Από χαλαρά instrumentals μέχρι downtempo hip-hop — ο τέλειος σύντροφος για τον πρωινό καφέ και τη μετακίνηση στο campus."
      },
      {
        id: "m2",
        title: "Campus Voices",
        time: "14:00 - 16:00",
        host: "Εκπρόσωπος Φοιτητών",
        tags: ["#Talk", "#Campus"],
        description: "Η επίσημη φωνή του φοιτητικού σώματος. Το Campus Voices φέρνει σε βάθος συζητήσεις, συνεντεύξεις με καθηγητές και συμφοιτητές, νέα του πανεπιστημίου και debates για τα θέματα που αφορούν τη φοιτητική ζωή."
      },
      {
        id: "m3",
        title: "Electric Avenue",
        time: "18:00 - 20:00",
        host: "Nova",
        tags: ["#Techno", "#Electro"],
        description: "Η Nova σε παίρνει σε μια ηλεκτρισμένη βόλτα μέσα από τα καλύτερα techno, electro και synth-driven ηχοτοπία. Από pulsating basslines μέχρι arpeggios που λάμπουν, το Electric Avenue δεν ρίχνει ποτέ την τάση."
      },
      {
        id: "m4",
        title: "Deep Space",
        time: "21:00 - 23:00",
        host: "The Cosmonaut",
        tags: ["#Ambient", "#Space"],
        description: "Παρασύρσου στον κόσμο με τις επιλεγμένες ambient υφές, space-age synthesizers και υπνωτικά drones του Cosmonaut. Ιδανικό για νυχτερινό διάβασμα, διαλογισμό ή απλά για να πλανιέσαι στο κενό."
      }
    ]
  },
  {
    day: "Τρι",
    fullName: "Τρίτη",
    shows: [
      {
        id: "tu1",
        title: "Indie Hour",
        time: "11:00 - 13:00",
        host: "Sarah V.",
        tags: ["#Indie", "#DreamPop"],
        description: "Η Sarah V. σκάβει στο underground για να σου φέρει το πιο φρέσκο indie rock, dream pop και lo-fi bedroom ηχογραφήσεις. Με αποκλειστικές πρεμιέρες, επιλογές βινυλίου και περιστασιακές ζωντανές sessions τοπικών καλλιτεχνών."
      },
      {
        id: "tu2",
        title: "Rock Anthems",
        time: "16:00 - 18:00",
        host: "George",
        tags: ["#Rock", "#Alternative"],
        description: "Ο George γυρνάει τον ενισχυτή στο 11 με μια δυνατή επιλογή κλασικού rock, grunge και σύγχρονων alternative ύμνων. Από stadium sing-alongs μέχρι ωμά garage riffs — αυτή είναι η εκπομπή που ταρακουνάει κάθε Τρίτη."
      }
    ]
  },
  {
    day: "Τετ",
    fullName: "Τετάρτη",
    shows: [
      {
        id: "w1",
        title: "Beats & Rhymes",
        time: "15:00 - 17:00",
        host: "MC Flow",
        tags: ["#HipHop", "#Rap"],
        description: "Ο MC Flow παραδίδει ένα δυναμικό μείγμα golden-age hip-hop, σύγχρονου rap και freestyle sessions. Περίμενε deep crate-digging, αποκλειστικά freestyles τοπικών MCs και αναλύσεις της κουλτούρας που μας κινεί."
      },
      {
        id: "w2",
        title: "Bass Drop",
        time: "20:00 - 22:00",
        host: "Chloe",
        tags: ["#Dubstep", "#Bass"],
        description: "Η Chloe ξαπολύει dubstep που σπάει κόκαλα, bass house και βαριά ηλεκτρονικά κομμάτια που θα ταρακουνήσουν τα ηχεία σου. Περίμενε filthy drops, wobbling sub-bass και ενέργεια που μετατρέπει κάθε βράδυ Τετάρτης σε festival."
      }
    ]
  },
  {
    day: "Πεμ",
    fullName: "Πέμπτη",
    shows: [
      {
        id: "th1",
        title: "Jazz Fusion",
        time: "20:00 - 22:00",
        host: "The Quartet",
        tags: ["#Jazz", "#Fusion"],
        description: "Το Quartet συνδυάζει κλασικά jazz standards με μοντέρνα fusion, funk και αυτοσχεδιαστικό πειραματισμό. Από smoky lounge vibes μέχρι high-energy solos — ένα βράδυ εκλεπτυσμένης μουσικής κάθε Πέμπτη."
      }
    ]
  },
  {
    day: "Παρ",
    fullName: "Παρασκευή",
    shows: [
      {
        id: "f1",
        title: "Club Night",
        time: "22:00 - 00:00",
        host: "Alex",
        tags: ["#House", "#Dance"],
        description: "Το Σαββατοκύριακο ξεκινάει εδώ. Ο Alex ρίχνει τα πιο καυτά house κομμάτια, tech-house bangers και dancefloor anthems για να ξεκινήσεις τη Παρασκευή σου. Ενέργεια κορυφής, seamless mixing και sets που σε κρατάνε σε κίνηση."
      }
    ]
  },
  {
    day: "Σαβ",
    fullName: "Σάββατο",
    shows: [
      {
        id: "sa1",
        title: "Global Grooves",
        time: "18:00 - 20:00",
        host: "World Tour",
        tags: ["#World", "#Global"],
        description: "Το World Tour σε πηγαίνει σε ένα ηχητικό ταξίδι σε ηπείρους — από ρυθμούς Afrobeat και Latin κρουστά μέχρι μελωδίες Μέσης Ανατολής και ηλεκτρονικά fusions ασιατικής έμπνευσης. Κάθε Σάββατο είναι ένα διαβατήριο σε νέο μουσικό προορισμό."
      }
    ]
  },
  {
    day: "Κυρ",
    fullName: "Κυριακή",
    shows: [
      {
        id: "su1",
        title: "Lazy Sunday",
        time: "12:00 - 15:00",
        host: "Chill Crew",
        tags: ["#Acoustic", "#Folk"],
        description: "Χαλάρωσε με τις laid-back επιλογές του Chill Crew — ακουστικά covers, folk μελωδίες και ηλιόλουστα singer-songwriter κομμάτια. Το τέλειο soundtrack για αργά πρωινά, brunch και ξεκούραση πριν αρχίσει η νέα εβδομάδα."
      }
    ]
  }
];

export const SHOWS_DESCRIPTIONS_EN: ShowDescription[] = [
  // ── Weekly Schedule Shows (unique per schedule slot) ──────────────
  {
    id: "m1",
    title: "Morning Mix",
    host: "Apollo",
    description: "Start your week right with Apollo's hand-picked lo-fi beats, mellow grooves, and smooth transitions. From chilled-out instrumentals to downtempo hip-hop — the perfect companion for Monday morning coffee and campus commutes.",
    tags: ["#LoFi", "#Chill"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "m2",
    title: "Campus Voices",
    host: "Student Union",
    description: "The official voice of the student body. Campus Voices brings you in-depth discussions, interviews with faculty and fellow students, university news updates, and debates on the issues that matter most to campus life.",
    tags: ["#Talk", "#Campus"],
    image: "/shows/studio.jpg"
  },
  {
    id: "m3",
    title: "Electric Avenue",
    host: "Nova",
    description: "Nova takes you on an electrifying ride through the best of techno, electro, and synth-driven soundscapes. From pulsing basslines to shimmering arpeggios, Electric Avenue is where the voltage never drops.",
    tags: ["#Techno", "#Electro"],
    image: "/shows/on-air.png"
  },
  {
    id: "m4",
    title: "Deep Space",
    host: "The Cosmonaut",
    description: "Drift into the cosmos with The Cosmonaut's curated selection of ambient textures, space-age synthesizers, and hypnotic drones. Ideal for late-night studying, meditation, or simply floating through the void.",
    tags: ["#Ambient", "#Space"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "tu1",
    title: "Indie Hour",
    host: "Sarah V.",
    description: "Sarah V. digs through the underground to bring you the freshest indie rock, dream pop, and lo-fi bedroom recordings. Featuring exclusive premieres, vinyl picks, and the occasional live in-studio session from local artists.",
    tags: ["#Indie", "#DreamPop"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "tu2",
    title: "Rock Anthems",
    host: "George",
    description: "George cranks the amp to eleven with a hard-hitting selection of classic rock, grunge, and modern alternative anthems. From stadium sing-alongs to raw garage riffs — this is the show that rocks the airwaves every Tuesday.",
    tags: ["#Rock", "#Alternative"],
    image: "/shows/concert.jpg"
  },
  {
    id: "w1",
    title: "Beats & Rhymes",
    host: "MC Flow",
    description: "MC Flow delivers a powerhouse blend of golden-age hip-hop, contemporary rap, and freestyle sessions. Expect deep crate-digging, exclusive freestyles from local MCs, and breakdowns of the culture that moves us.",
    tags: ["#HipHop", "#Rap"],
    image: "/shows/on-air.png"
  },
  {
    id: "w2",
    title: "Bass Drop",
    host: "Chloe",
    description: "Chloe unleashes bone-rattling dubstep, bass house, and heavy electronic cuts that will shake your speakers. Expect filthy drops, wobbling sub-bass, and the kind of energy that turns any Wednesday night into a festival.",
    tags: ["#Dubstep", "#Bass"],
    image: "/shows/on-air.png"
  },
  {
    id: "th1",
    title: "Jazz Fusion",
    host: "The Quartet",
    description: "The Quartet blends classic jazz standards with modern fusion, funk, and improvisational experimentation. From smoky lounge vibes to high-energy solos — an evening of sophisticated musicianship every Thursday.",
    tags: ["#Jazz", "#Fusion"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "f1",
    title: "Club Night",
    host: "Alex",
    description: "The weekend starts here. Alex drops the hottest house music, tech-house bangers, and dancefloor anthems to kick off your Friday night. Peak-time energy, seamless mixing, and the kind of sets that keep you moving until the lights come on.",
    tags: ["#House", "#Dance"],
    image: "/shows/concert.jpg"
  },
  {
    id: "sa1",
    title: "Global Grooves",
    host: "World Tour",
    description: "World Tour takes you on a sonic journey across continents — from Afrobeat rhythms and Latin percussion to Middle Eastern melodies and Asian-inspired electronic fusions. Every Saturday is a passport to a new musical destination.",
    tags: ["#World", "#Global"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "su1",
    title: "Lazy Sunday",
    host: "Chill Crew",
    description: "Unwind with Chill Crew's laid-back selection of acoustic covers, folk melodies, and sun-drenched singer-songwriter tracks. The perfect soundtrack for slow mornings, brunch, and recharging before the new week begins.",
    tags: ["#Acoustic", "#Folk"],
    image: "/shows/vinyl.jpg"
  },
  // ── Legacy Show Descriptions (kept for backward compatibility) ────
  {
    id: "desc1",
    title: "Midnight Sessions",
    host: "Alex Thorne",
    description: "An exploratory journey into deep house, minimal techno, and ambient soundscapes. Perfect for late-night studying or existential contemplation in the dark.",
    tags: ["#Electronic", "#Ambient"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "desc2",
    title: "Vinyl Grooves",
    host: "Sarah Jenkins",
    description: "Dusting off the archives to bring you strictly wax selections. From rare 70s funk and soul to early hip-hop breaks, experiencing music the way it was meant to be heard.",
    tags: ["#Funk", "#Soul"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "desc3",
    title: "Campus Indie Radar",
    host: "The FRS UTH Team",
    description: "Your weekly digest of the local scene. We're spotlighting the best up-and-coming bands on campus, featuring live studio sessions, interviews, and raw talent.",
    tags: ["#Indie", "#Local"],
    image: "/shows/studio.jpg"
  },
  {
    id: "desc4",
    title: "Electronic Avenue",
    host: "Vector",
    description: "High-bpm, unapologetic electronic music. From drum and bass to hardcore techno, this is where the campus turns up the tempo and lets loose.",
    tags: ["#Techno", "#DnB"],
    image: "/shows/on-air.png"
  },
  {
    id: "desc5",
    title: "Morning Mix",
    host: "Ben & Chloe",
    description: "Wake up right with a curated blend of upbeat indie pop, campus news, and caffeine-fueled banter. The essential soundtrack for your 8 AM commute.",
    tags: ["#Pop", "#Talk"],
    image: "/shows/studio.jpg"
  },
  {
    id: "desc6",
    title: "Global Grooves",
    host: "Maya Patel",
    description: "Transcending borders with an eclectic mix of Afrobeat, Bossa Nova, and contemporary world music fusion. Expand your sonic horizons every Sunday.",
    tags: ["#World", "#Jazz"],
    image: "/shows/vinyl.jpg"
  }
];

export const SHOWS_DESCRIPTIONS_GR: ShowDescription[] = [
  // ── Εκπομπές Εβδομαδιαίου Προγράμματος ──────────────
  {
    id: "m1",
    title: "Morning Mix",
    host: "Apollo",
    description: "Ξεκίνα τη βδομάδα σου σωστά με τις χειροδιάλεκτες lo-fi επιλογές του Apollo, απαλά grooves και ομαλές μεταβάσεις. Από χαλαρά instrumentals μέχρι downtempo hip-hop — ο τέλειος σύντροφος για τον πρωινό καφέ και τη μετακίνηση στο campus.",
    tags: ["#LoFi", "#Chill"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "m2",
    title: "Campus Voices",
    host: "Εκπρόσωπος Φοιτητών",
    description: "Η επίσημη φωνή του φοιτητικού σώματος. Το Campus Voices φέρνει σε βάθος συζητήσεις, συνεντεύξεις με καθηγητές και συμφοιτητές, νέα του πανεπιστημίου και debates για τα θέματα που αφορούν τη φοιτητική ζωή.",
    tags: ["#Talk", "#Campus"],
    image: "/shows/studio.jpg"
  },
  {
    id: "m3",
    title: "Electric Avenue",
    host: "Nova",
    description: "Η Nova σε παίρνει σε μια ηλεκτρισμένη βόλτα μέσα από τα καλύτερα techno, electro και synth-driven ηχοτοπία. Από pulsating basslines μέχρι arpeggios που λάμπουν, το Electric Avenue δεν ρίχνει ποτέ την τάση.",
    tags: ["#Techno", "#Electro"],
    image: "/shows/on-air.png"
  },
  {
    id: "m4",
    title: "Deep Space",
    host: "The Cosmonaut",
    description: "Παρασύρσου στον κόσμο με τις επιλεγμένες ambient υφές, space-age synthesizers και υπνωτικά drones του Cosmonaut. Ιδανικό για νυχτερινό διάβασμα, διαλογισμό ή απλά για να πλανιέσαι στο κενό.",
    tags: ["#Ambient", "#Space"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "tu1",
    title: "Indie Hour",
    host: "Sarah V.",
    description: "Η Sarah V. σκάβει στο underground για να σου φέρει το πιο φρέσκο indie rock, dream pop και lo-fi bedroom ηχογραφήσεις. Με αποκλειστικές πρεμιέρες, επιλογές βινυλίου και περιστασιακές ζωντανές sessions τοπικών καλλιτεχνών.",
    tags: ["#Indie", "#DreamPop"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "tu2",
    title: "Rock Anthems",
    host: "George",
    description: "Ο George γυρνάει τον ενισχυτή στο 11 με μια δυνατή επιλογή κλασικού rock, grunge και σύγχρονων alternative ύμνων. Από stadium sing-alongs μέχρι ωμά garage riffs — αυτή είναι η εκπομπή που ταρακουνάει κάθε Τρίτη.",
    tags: ["#Rock", "#Alternative"],
    image: "/shows/concert.jpg"
  },
  {
    id: "w1",
    title: "Beats & Rhymes",
    host: "MC Flow",
    description: "Ο MC Flow παραδίδει ένα δυναμικό μείγμα golden-age hip-hop, σύγχρονου rap και freestyle sessions. Περίμενε deep crate-digging, αποκλειστικά freestyles τοπικών MCs και αναλύσεις της κουλτούρας που μας κινεί.",
    tags: ["#HipHop", "#Rap"],
    image: "/shows/on-air.png"
  },
  {
    id: "w2",
    title: "Bass Drop",
    host: "Chloe",
    description: "Η Chloe ξαπολύει dubstep που σπάει κόκαλα, bass house και βαριά ηλεκτρονικά κομμάτια που θα ταρακουνήσουν τα ηχεία σου. Περίμενε filthy drops, wobbling sub-bass και ενέργεια που μετατρέπει κάθε βράδυ Τετάρτης σε festival.",
    tags: ["#Dubstep", "#Bass"],
    image: "/shows/on-air.png"
  },
  {
    id: "th1",
    title: "Jazz Fusion",
    host: "The Quartet",
    description: "Το Quartet συνδυάζει κλασικά jazz standards με μοντέρνα fusion, funk και αυτοσχεδιαστικό πειραματισμό. Από smoky lounge vibes μέχρι high-energy solos — ένα βράδυ εκλεπτυσμένης μουσικής κάθε Πέμπτη.",
    tags: ["#Jazz", "#Fusion"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "f1",
    title: "Club Night",
    host: "Alex",
    description: "Το Σαββατοκύριακο ξεκινάει εδώ. Ο Alex ρίχνει τα πιο καυτά house κομμάτια, tech-house bangers και dancefloor anthems για να ξεκινήσεις τη Παρασκευή σου. Ενέργεια κορυφής, seamless mixing και sets που σε κρατάνε σε κίνηση.",
    tags: ["#House", "#Dance"],
    image: "/shows/concert.jpg"
  },
  {
    id: "sa1",
    title: "Global Grooves",
    host: "World Tour",
    description: "Το World Tour σε πηγαίνει σε ένα ηχητικό ταξίδι σε ηπείρους — από ρυθμούς Afrobeat και Latin κρουστά μέχρι μελωδίες Μέσης Ανατολής και ηλεκτρονικά fusions ασιατικής έμπνευσης. Κάθε Σάββατο είναι ένα διαβατήριο σε νέο μουσικό προορισμό.",
    tags: ["#World", "#Global"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "su1",
    title: "Lazy Sunday",
    host: "Chill Crew",
    description: "Χαλάρωσε με τις laid-back επιλογές του Chill Crew — ακουστικά covers, folk μελωδίες και ηλιόλουστα singer-songwriter κομμάτια. Το τέλειο soundtrack για αργά πρωινά, brunch και ξεκούραση πριν αρχίσει η νέα εβδομάδα.",
    tags: ["#Acoustic", "#Folk"],
    image: "/shows/vinyl.jpg"
  },
  // ── Παλαιότερες Περιγραφές (για συμβατότητα) ────
  {
    id: "desc1",
    title: "Midnight Sessions",
    host: "Alex Thorne",
    description: "Ένα εξερευνητικό ταξίδι στη deep house, minimal techno και ambient τοπία. Ιδανικό για διάβασμα αργά το βράδυ ή υπαρξιακή αναζήτηση στο σκοτάδι.",
    tags: ["#Electronic", "#Ambient"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "desc2",
    title: "Vinyl Grooves",
    host: "Sarah Jenkins",
    description: "Ξεσκονίζουμε το αρχείο για να σας φέρουμε αποκλειστικά επιλογές από βινύλιο. Από σπάνια funk και soul των 70s έως early hip-hop breaks, απολαύστε τη μουσική όπως της αξίζει.",
    tags: ["#Funk", "#Soul"],
    image: "/shows/vinyl.jpg"
  },
  {
    id: "desc3",
    title: "Campus Indie Radar",
    host: "Η Ομάδα του FRS UTH",
    description: "Η εβδομαδιαία ανασκόπηση της τοπικής σκηνής. Προβάλλουμε τις καλύτερες ανερχόμενες μπάντες στο πανεπιστήμιο με ζωντανές ηχογραφήσεις και συνεντεύξεις.",
    tags: ["#Indie", "#Local"],
    image: "/shows/studio.jpg"
  },
  {
    id: "desc4",
    title: "Electronic Avenue",
    host: "Vector",
    description: "Υψηλό BPM, ασυμβίβαστη ηλεκτρονική μουσική. Από drum and bass μέχρι hardcore techno, εδώ είναι που το campus ανεβάζει την ταχύτητα και ξεσαλώνει.",
    tags: ["#Techno", "#DnB"],
    image: "/shows/on-air.png"
  },
  {
    id: "desc5",
    title: "Morning Mix",
    host: "Ben & Chloe",
    description: "Ξυπνήστε σωστά με ένα επιλεγμένο μείγμα indie pop, νέα του πανεπιστημίου και κουβέντα με καφέ. Το απαραίτητο soundtrack για τη διαδρομή σας στις 8 π.μ.",
    tags: ["#Pop", "#Talk"],
    image: "/shows/studio.jpg"
  },
  {
    id: "desc6",
    title: "Global Grooves",
    host: "Maya Patel",
    description: "Ξεπερνώντας τα σύνορα με μια εκλεκτική μίξη Afrobeat, Bossa Nova και σύγχρονης world fusion. Διευρύνετε τους μουσικούς σας ορίζοντες κάθε Κυριακή.",
    tags: ["#World", "#Jazz"],
    image: "/shows/vinyl.jpg"
  }
];

export const ARCHIVE_ITEMS_EN: ArchiveItem[] = [
  {
    id: "arc1",
    title: "Midnight Circuits Vol. 4",
    date: "Oct 24, 2024",
    description: "Vertex tearing through heavy industrial techno cuts and unreleased student demos.",
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
    description: "Ο Vertex σαρώνει με heavy industrial techno κομμάτια και ακυκλοφόρητα demos φοιτητών.",
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

export const DEFAULT_EVENTS_GR: StationEvent[] = [
  {
    id: "ev1",
    dayNum: "18",
    monthStr: "ΜΑΙ",
    categoryBadge: "Festival & Outdoor Stage",
    timeLocation: "🕒 19:30 • 📍 Πεδίον του Άρεως, Βόλος",
    title: "Campus Spring Festival 2026",
    description: "Το μεγαλύτερο φοιτητικό φεστιβάλ του Βόλου επιστρέφει με live bands, indie alternative acts και live stages στο Πεδίον του Άρεως. Μια ολόκληρη ημέρα γεμάτη μουσική, live ραδιοφωνικές συνεντεύξεις στον αέρα και ελεύθερη είσοδο για όλη την πανεπιστημιακή κοινότητα.",
    tags: ["#LiveBands", "#FreeEntry", "#OutdoorStage", "#VolosCampus"]
  },
  {
    id: "ev2",
    dayNum: "24",
    monthStr: "ΜΑΙ",
    categoryBadge: "Workshop & Studio Training",
    timeLocation: "🕒 17:00 • 📍 FRS Broadcast Studio A",
    title: "Workshop: Podcast & Audio Production",
    description: "Εξειδικευμένο εργαστήριο ήχου και παραγωγής εκπομπών από τους τεχνικούς και παραγωγούς του σταθμού. Πρακτική εκπαίδευση σε κονσόλες μίξης, μικροφωνικές τεχνικές, ηχογράφηση φωνής, mastering podcast επεισοδίων και live streaming workflows.",
    tags: ["#Podcast", "#SoundMixing", "#StudioA", "#RadioSkills"]
  },
  {
    id: "ev3",
    dayNum: "06",
    monthStr: "ΙΟΥΝ",
    categoryBadge: "Vinyl Session",
    timeLocation: "🕒 21:00 • 📍 Πολυτεχνείο Βόλου",
    title: "Vinyl Night: Lo-Fi Beats & Analog Sound",
    description: "Βραδιά αφιερωμένη στον αναλογικό ήχο και τη μαγεία του βινυλίου. Οι παραγωγοί του σταθμού επιλέγουν rare grooves, soul, funk και lo-fi hip hop αποκλειστικά από δίσκους βινυλίου με ζωντανή αναμετάδοση στο web stream.",
    tags: ["#VinylOnly", "#Analog", "#ChillVibes"]
  }
];

export const DEFAULT_EVENTS_EN: StationEvent[] = [
  {
    id: "ev1",
    dayNum: "18",
    monthStr: "MAY",
    categoryBadge: "Festival & Outdoor Stage",
    timeLocation: "🕒 19:30 • 📍 Pedion tou Areos, Volos",
    title: "Campus Spring Festival 2026",
    description: "The biggest student festival in Volos returns with live bands, indie alternative acts, and live stages at Pedion tou Areos. A full day of live music, on-air radio interviews, and free entry for the entire university community.",
    tags: ["#LiveBands", "#FreeEntry", "#OutdoorStage", "#VolosCampus"]
  },
  {
    id: "ev2",
    dayNum: "24",
    monthStr: "MAY",
    categoryBadge: "Workshop & Studio Training",
    timeLocation: "🕒 17:00 • 📍 FRS Broadcast Studio A",
    title: "Workshop: Podcast & Audio Production",
    description: "Hands-on audio and broadcasting workshop led by station sound engineers and hosts. Practical training in mixing desks, microphone techniques, voice recording, podcast mastering, and live streaming workflows.",
    tags: ["#Podcast", "#SoundMixing", "#StudioA", "#RadioSkills"]
  },
  {
    id: "ev3",
    dayNum: "06",
    monthStr: "JUN",
    categoryBadge: "Vinyl Session",
    timeLocation: "🕒 21:00 • 📍 Volos Polytechnic",
    title: "Vinyl Night: Lo-Fi Beats & Analog Sound",
    description: "An evening dedicated to analog sound and vinyl groove. Station producers spin rare grooves, soul, funk, and lo-fi hip hop strictly from vinyl records with live broadcast on the web radio stream.",
    tags: ["#VinylOnly", "#Analog", "#ChillVibes"]
  }
];

