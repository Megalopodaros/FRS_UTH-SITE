import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, FileText, Cookie, MapPin, Mail, Radio, AlertTriangle } from "lucide-react";

export type LegalTab = "privacy" | "terms" | "cookies";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
  isGreek: boolean;
}

export default function LegalModal({
  isOpen,
  onClose,
  initialTab = "privacy",
  isGreek
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[#F7F4EC] md:bg-[#F7F4EC]/96 md:backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/10 relative my-auto max-h-[88vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-black/[0.08] pb-4 shrink-0">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#ad021a] uppercase tracking-wider mb-1">
                <Radio className="w-3.5 h-3.5" />
                <span>FRS UTH • Web Radio</span>
              </div>
              <h2 className="font-display text-2xl font-black text-[#1C1917] tracking-tight">
                {isGreek ? "Νομική Ενημέρωση & Όροι" : "Legal & Privacy Terms"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#6B6560] hover:text-[#1C1917] p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-black/[0.06] py-3 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab("privacy")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "privacy"
                  ? "bg-[#ad021a] text-white shadow-xs"
                  : "text-[#6B6560] hover:bg-black/5"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isGreek ? "Πολιτική Απορρήτου" : "Privacy Policy"}</span>
            </button>

            <button
              onClick={() => setActiveTab("terms")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "terms"
                  ? "bg-[#ad021a] text-white shadow-xs"
                  : "text-[#6B6560] hover:bg-black/5"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isGreek ? "Όροι Χρήσης" : "Terms of Use"}</span>
            </button>

            <button
              onClick={() => setActiveTab("cookies")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "cookies"
                  ? "bg-[#ad021a] text-white shadow-xs"
                  : "text-[#6B6560] hover:bg-black/5"
              }`}
            >
              <Cookie className="w-3.5 h-3.5" />
              <span>{isGreek ? "Cookies & Δεδομένα" : "Cookies & Storage"}</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="overflow-y-auto pr-1 py-4 text-xs sm:text-sm text-[#443F3C] space-y-4 leading-relaxed">
            
            {/* TAB 1: PRIVACY POLICY */}
            {activeTab === "privacy" && (
              <div className="space-y-4">
                <div className="bg-white/70 p-4 rounded-2xl border border-black/5 flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                    <MapPin className="w-4 h-4 text-[#ad021a]" />
                    <span>{isGreek ? "Υπεύθυνος Σταθμού" : "Station Operator"}: FRS UTH — {isGreek ? "Ανεξάρτητη Φοιτητική Ομάδα (Μη επίσημος φορέας του Π.Θ.)" : "Independent Student Group (Non-official university entity)"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6B6560]">
                    <Mail className="w-4 h-4 text-[#ad021a]" />
                    <span>Email: <a href="mailto:foithtikaradioshows@gmail.com" className="text-[#ad021a] underline">foithtikaradioshows@gmail.com</a></span>
                  </div>
                  <div className="text-stone-500 font-mono text-[11px]">
                    {isGreek ? "Έδρα: Βόλος, Μαγνησία, Ελλάδα" : "Location: Volos, Thessaly, Greece"}
                  </div>
                </div>

                {isGreek ? (
                  <>
                    <h3 className="font-bold text-base text-[#1C1917]">1. Ποια δεδομένα συλλέγουμε</h3>
                    <p>
                      Δεν απαιτείται εγγραφή λογαριασμού για την ακρόαση του σταθμού. Συλλέγουμε αποκλειστικά τα στοιχεία που μας παρέχετε εσείς οικειοθελώς:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li><strong>Φόρμα Επικοινωνίας:</strong> Όνομα, διεύθυνση email και το κείμενο του μηνύματός σας.</li>
                      <li><strong>Αίτηση Open Call:</strong> Ονοματεπώνυμο, email, προαιρετικό τηλέφωνο, μουσικά ενδιαφέροντα και περιγραφή εκπομπής για την αξιολόγηση συμμετοχής στην ομάδα.</li>
                      <li><strong>Live Chat:</strong> Το ψευδώνυμο (nickname) που επιλέγετε ελεύθερα και τα μηνύματα που δημοσιεύετε δημόσια στη συνομιλία.</li>
                    </ul>

                    <h3 className="font-bold text-base text-[#1C1917]">2. Σκοπός Επεξεργασίας</h3>
                    <p>
                      Τα στοιχεία επικοινωνίας χρησιμοποιούνται αποκλειστικά για την απάντηση στα μηνύματά σας και τον συντονισμό των ραδιοφωνικών εκπομπών. Δεν πωλούμε, δεν κοινοποιούμε και δεν παραχωρούμε τα στοιχεία σας σε οποιονδήποτε τρίτο ή διαφημιστική εταιρεία.
                    </p>

                    <h3 className="font-bold text-base text-[#1C1917]">3. Δικαιώματα Χρήστη (GDPR)</h3>
                    <p>
                      Σύμφωνα με τον Γενικό Κανονισμό Προστασίας Δεδομένων (GDPR), έχετε το δικαίωμα πρόσβασης, διόρθωσης ή οριστικής διαγραφής των στοιχείων που έχετε υποβάλει στις φόρμες μας, στέλνοντας ένα απλό email στο <strong>foithtikaradioshows@gmail.com</strong>.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-base text-[#1C1917]">1. Information We Collect</h3>
                    <p>
                      No account registration is required to listen to our broadcast. We collect only information that you voluntarily provide:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li><strong>Contact Form:</strong> Name, email address, and your message content.</li>
                      <li><strong>Open Call Application:</strong> Full name, email, optional phone, music genres, and show proposal for producer onboarding.</li>
                      <li><strong>Live Chat:</strong> The display nickname you choose freely and messages submitted publicly.</li>
                    </ul>

                    <h3 className="font-bold text-base text-[#1C1917]">2. Purpose of Processing</h3>
                    <p>
                      Your information is used strictly to communicate with you and coordinate station broadcasts. We never sell, rent, or distribute your personal details to third parties or marketing entities.
                    </p>

                    <h3 className="font-bold text-base text-[#1C1917]">3. Your Rights (GDPR)</h3>
                    <p>
                      Under the General Data Protection Regulation (GDPR), you hold full rights to access, rectify, or request deletion of any submitted information by emailing us at <strong>foithtikaradioshows@gmail.com</strong>.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: TERMS OF USE */}
            {activeTab === "terms" && (
              <div className="space-y-4">
                {isGreek ? (
                  <>
                    {/* Explicit Independence Disclaimer Box */}
                    <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl text-amber-950 text-xs space-y-2">
                      <div className="font-bold text-sm flex items-center gap-1.5 text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>1. Ανεξαρτησία από το Πανεπιστήμιο Θεσσαλίας & Αποποίηση Ευθύνης</span>
                      </div>
                      <p>
                        Ο <strong>FRS (Φοιτητικός Ραδιοφωνικός Σταθμός)</strong> αποτελεί μια <strong>αυτόνομη, ανεξάρτητη και αυτοδιαχειριζόμενη πρωτοβουλία φοιτητών</strong>.
                      </p>
                      <p>
                        <strong>Σε καμία περίπτωση ο σταθμός δεν αποτελεί επίσημο όργανο, επίσημη υπηρεσία, γραφείο τύπου, εκπρόσωπο ή νομικό πρόσωπο της διοίκησης του Πανεπιστημίου Θεσσαλίας.</strong>
                      </p>
                      <p>
                        Το Πανεπιστήμιο Θεσσαλίας <strong>δεν φέρει καμία απολύτως νομική, αστική, ποινική, διοικητική ή συντακτική ευθύνη</strong> για τη λειτουργία του ραδιοφώνου, τις εκπομπές, τις μουσικές μεταδόσεις, τα podcast, τα αναρτώμενα κείμενα ή τις απόψεις που διατυπώνονται από τους ραδιοφωνικούς παραγωγούς και τους χρήστες του Live Chat. Οι εκφραζόμενες απόψεις ανήκουν αποκλειστικά στα φυσικά πρόσωπα που τις εκφέρουν.
                      </p>
                    </div>

                    <h3 className="font-bold text-base text-[#1C1917]">2. Μη Κερδοσκοπικός & Πολιτιστικός Χαρακτήρας</h3>
                    <p>
                      Ο FRS UTH λειτουργεί σε αυστηρά εθελοντική και μη κερδοσκοπική βάση. Όλο το ραδιοφωνικό πρόγραμμα, η μουσική ροή, τα αρχεία εκπομπών και οι ψηφιακές λειτουργίες του ιστότοπου παρέχονται εντελώς δωρεάν με αποκλειστικό σκοπό την πολιτιστική, μουσική και ψυχαγωγική έκφραση της φοιτητικής κοινότητας.
                    </p>

                    <h3 className="font-bold text-base text-[#1C1917]">3. Κανόνες Κοινότητας Live Chat</h3>
                    <p>
                      Το Live Chat του σταθμού είναι ένας φιλόξενος χώρος διαλόγου και ανταλλαγής μουσικών απόψεων. Οι επισκέπτες οφείλουν να σέβονται τους συνομιλητές τους. Απαγορεύονται ρητά:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>Προσβλητικά, απειλητικά, δυσφημιστικά ή ρατσιστικά σχόλια.</li>
                      <li>Ρητορική μίσους, παρενόχληση και ανεπιθύμητη διαφήμιση (spam).</li>
                      <li>Κοινοποίηση προσωπικών στοιχείων τρίτων χωρίς τη συγκατάθεσή τους.</li>
                    </ul>
                    <p className="text-xs text-stone-500">
                      Η διαχειριστική ομάδα του σταθμού διατηρεί το δικαίωμα διαγραφής μηνυμάτων ή προσωρινής απομάκρυνσης χρηστών που παραβιάζουν τους παραπάνω κανόνες.
                    </p>

                    <h3 className="font-bold text-base text-[#1C1917]">4. Πνευματικά Δικαιώματα & Περιεχόμενο</h3>
                    <p>
                      Τα λογότυπα, τα γραφικά, ο πηγαίος κώδικας και οι πρωτότυπες εκπομπές του σταθμού ανήκουν στην ομάδα του FRS UTH. Η μουσική αναπαράγεται στο πλαίσιο της πολιτιστικής προβολής καλλιτεχνών και φοιτητικών εκπομπών.
                    </p>
                  </>
                ) : (
                  <>
                    {/* Explicit Independence Disclaimer Box */}
                    <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl text-amber-950 text-xs space-y-2">
                      <div className="font-bold text-sm flex items-center gap-1.5 text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>1. Independence from the University & Disclaimer of Liability</span>
                      </div>
                      <p>
                        <strong>FRS (Student Web Radio)</strong> is an <strong>autonomous, independent, student-run initiative</strong> organized voluntarily by students.
                      </p>
                      <p>
                        <strong>Under no circumstances does FRS represent an official body, administrative department, spokesperson, or legal organ of the University of Thessaly administration.</strong>
                      </p>
                      <p>
                        The University of Thessaly <strong>bears zero legal, civil, penal, administrative, or editorial liability</strong> for station operations, show broadcasts, music transmissions, podcasts, published articles, or viewpoints stated by producers and Live Chat users. All opinions belong solely to the individuals expressing them.
                      </p>
                    </div>

                    <h3 className="font-bold text-base text-[#1C1917]">2. Non-Commercial Cultural Character</h3>
                    <p>
                      FRS UTH operates on a strictly non-commercial and voluntary basis. All broadcasts, playlists, archives, and online features are provided completely free of charge for student culture, musical exploration, and educational enjoyment.
                    </p>

                    <h3 className="font-bold text-base text-[#1C1917]">3. Live Chat Community Guidelines</h3>
                    <p>
                      The Live Chat is a welcoming student space for music discussions. Listeners are expected to behave with respect. The following are strictly prohibited:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>Abusive, defamatory, hateful, or harassing remarks.</li>
                      <li>Spam, commercial solicitation, or automated flooding.</li>
                      <li>Sharing private personal information of others without consent.</li>
                    </ul>
                    <p className="text-xs text-stone-500">
                      Station moderators reserve the right to delete messages or restrict users who violate these community standards.
                    </p>

                    <h3 className="font-bold text-base text-[#1C1917]">4. Intellectual Property</h3>
                    <p>
                      Logos, visuals, source code, and original student broadcasts belong to FRS UTH. Music tracks are streamed for cultural enrichment and student showcase.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* TAB 3: COOKIES & LOCAL STORAGE */}
            {activeTab === "cookies" && (
              <div className="space-y-4">
                {isGreek ? (
                  <>
                    <h3 className="font-bold text-base text-[#1C1917]">1. Τι είναι τα Cookies & η Τοπική Αποθήκευση;</h3>
                    <p>
                      Η τοπική αποθήκευση (Local Storage) επιτρέπει στον περιηγητή σας (browser) να διατηρεί χρήσιμες προτιμήσεις τοπικά στη συσκευή σας, ώστε να μην χρειάζεται να τις ρυθμίζετε ξανά σε κάθε επίσκεψη.
                    </p>

                    <h3 className="font-bold text-base text-[#1C1917]">2. Τι δεδομένα αποθηκεύουμε τοπικά:</h3>
                    <ul className="list-disc list-inside space-y-1.5 pl-2">
                      <li><strong>Ένταση & Σίγαση Ήχου:</strong> Αποθηκεύει το επίπεδο ήχου και την κατάσταση mute του player.</li>
                      <li><strong>Γλώσσα Ιστότοπου:</strong> Αποθηκεύει την επιλογή σας ανάμεσα σε Ελληνικά και Αγγλικά.</li>
                      <li><strong>Cache Προγράμματος:</strong> Αποθηκεύει προσωρινά το ραδιοφωνικό πρόγραμμα ώστε να φορτώνει ταχύτατα και να μειώνει τα αιτήματα δικτύου.</li>
                      <li><strong>Ψηφοφορίες Live Poll:</strong> Αποθηκεύει τοπικά ότι ψηφίσατε σε μια συγκεκριμένη ψηφοφορία ώστε να αποφεύγεται η διπλοψηφία.</li>
                      <li><strong>Ενημέρωση Cookies:</strong> Αποθηκεύει ότι είδατε την ενημέρωση για να μην εμφανίζεται ξανά το banner.</li>
                    </ul>

                    <h3 className="font-bold text-base text-[#1C1917]">3. Χρησιμοποιούμε Cookies Παρακολούθησης ή Διαφημίσεων;</h3>
                    <p className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200">
                      <strong>Όχι.</strong> Ο FRS UTH <strong>δεν χρησιμοποιεί κανένα cookie παρακολούθησης</strong> (third-party tracking cookies), pixels κοινωνικών δικτύων ή διαφημιστικά δίκτυα. Όλα τα δεδομένα παραμένουν αποκλειστικά στη συσκευή σας.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-base text-[#1C1917]">1. What is Local Storage & Cookies?</h3>
                    <p>
                      Local storage allows your browser to remember technical preferences on your own device, ensuring you don't need to reconfigure them each time you tune in.
                    </p>

                    <h3 className="font-bold text-base text-[#1C1917]">2. What We Store Locally:</h3>
                    <ul className="list-disc list-inside space-y-1.5 pl-2">
                      <li><strong>Volume & Mute State:</strong> Remembers your preferred audio level.</li>
                      <li><strong>Language Preference:</strong> Remembers Greek or English selection.</li>
                      <li><strong>Schedule Cache:</strong> Temporarily caches show schedules for instant loading.</li>
                      <li><strong>Live Poll Voting:</strong> Records anonymous vote state per session to prevent double voting.</li>
                      <li><strong>Consent Flag:</strong> Remembers that you reviewed our cookie notice.</li>
                    </ul>

                    <h3 className="font-bold text-base text-[#1C1917]">3. Do We Use Advertising or Tracking Cookies?</h3>
                    <p className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200">
                      <strong>No.</strong> FRS UTH <strong>does not use any third-party tracking cookies</strong>, social network trackers, or advertising scripts. All stored settings remain private to your browser.
                    </p>
                  </>
                )}
              </div>
            )}

          </div>

          {/* Footer Close Button */}
          <div className="pt-4 border-t border-black/[0.08] flex items-center justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-[#ad021a] hover:bg-[#8f0115] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {isGreek ? "Κλείσιμο" : "Close"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
