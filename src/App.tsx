import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { assistantTranslations, isLanguageCode, languages, translations, type LanguageCode } from "./locales";
import indiaLocations from "./indiaDistricts.json";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bot,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Eye,
  EyeOff,
  FilePlus2,
  Filter,
  Fingerprint,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  MapPin,
  Menu,
  MoreHorizontal,
  MessageCircle,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Section = "Dashboard" | "Cases" | "Potential matches" | "District network" | "Analytics";
type CaseStatus = "Open" | "Under investigation" | "Potential match" | "Verified" | "Resolved";
type CaseRecord = {
  id: string;
  person: string;
  age: number;
  gender: string;
  state?: string;
  district: string;
  station: string;
  type: string;
  status: CaseStatus;
  priority: "High" | "Medium" | "Standard";
  lastSeen: string;
  updated: string;
  initials: string;
  color: string;
  mark: string;
  location: string;
};
type MatchStatus = "Requires review" | "Verified" | "Not a match";
type PotentialMatch = {
  id: string;
  from: string;
  to: string;
  district: string;
  score: number;
  reason: string;
  status: MatchStatus;
  date: string;
};
type AuditEntry = { action: string; detail: string; time: string };
type ChatMessage = { role: "assistant" | "user"; text: string; action?: Section };

type LocaleContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string) => string;
};
const LocaleContext = createContext<LocaleContextValue>({
  language: "en",
  setLanguage: () => undefined,
  t: (key) => translations.en[key] ?? key,
});

const STORAGE_KEY = "tracesetu-demo-v1";
const LANGUAGE_STORAGE_KEY = "tracesetu-language";
const indiaStatesAndDistricts: { state: string; districts: string[] }[] = [...indiaLocations].sort((a, b) => a.state.localeCompare(b.state));
const getDistricts = (state: string) => indiaStatesAndDistricts.find((entry) => entry.state === state)?.districts ?? [];
const districts = Array.from(new Set(indiaStatesAndDistricts.flatMap((entry) => entry.districts))).sort((a, b) => a.localeCompare(b));
const seedCases: CaseRecord[] = [
  { id: "TS-2048", person: "Aarav Kulkarni", age: 17, gender: "Male", district: "Pune", station: "Shivajinagar", type: "Missing person", status: "Under investigation", priority: "High", lastSeen: "12 Oct 2026", updated: "18 min ago", initials: "AK", color: "blue", mark: "Small scar above left eyebrow", location: "Pune Station, Pune" },
  { id: "TS-2047", person: "Meera Deshmukh", age: 24, gender: "Female", district: "Mumbai", station: "Dadar", type: "Missing person", status: "Potential match", priority: "High", lastSeen: "11 Oct 2026", updated: "42 min ago", initials: "MD", color: "rose", mark: "Birthmark on right wrist", location: "Dadar, Mumbai" },
  { id: "TS-2046", person: "Unidentified person", age: 30, gender: "Male", district: "Nashik", station: "Panchavati", type: "Unidentified person", status: "Open", priority: "Medium", lastSeen: "10 Oct 2026", updated: "1 hr ago", initials: "UP", color: "amber", mark: "Tattoo on left forearm", location: "Panchavati, Nashik" },
  { id: "TS-2045", person: "Rohan Patil", age: 16, gender: "Male", district: "Kolhapur", station: "Rajaram Puri", type: "Missing person", status: "Under investigation", priority: "High", lastSeen: "09 Oct 2026", updated: "2 hrs ago", initials: "RP", color: "green", mark: "Mole on chin", location: "Kolhapur Bus Stand" },
  { id: "TS-2044", person: "Sana Shaikh", age: 22, gender: "Female", district: "Pune", station: "Kondhwa", type: "Missing person", status: "Open", priority: "Medium", lastSeen: "08 Oct 2026", updated: "3 hrs ago", initials: "SS", color: "violet", mark: "Small scar on right palm", location: "Kondhwa, Pune" },
  { id: "TS-2043", person: "Unidentified person", age: 42, gender: "Female", district: "Mumbai", station: "Kurla", type: "Unidentified person", status: "Under investigation", priority: "Standard", lastSeen: "07 Oct 2026", updated: "5 hrs ago", initials: "UP", color: "teal", mark: "Silver nose stud", location: "Kurla, Mumbai" },
  { id: "TS-2042", person: "Ishaan Jadhav", age: 19, gender: "Male", district: "Nagpur", station: "Sitabuldi", type: "Missing person", status: "Potential match", priority: "Medium", lastSeen: "06 Oct 2026", updated: "Yesterday", initials: "IJ", color: "orange", mark: "Birthmark on neck", location: "Sitabuldi, Nagpur" },
  { id: "TS-2041", person: "Ananya More", age: 15, gender: "Female", district: "Nashik", station: "Gangapur Road", type: "Missing person", status: "Under investigation", priority: "High", lastSeen: "05 Oct 2026", updated: "Yesterday", initials: "AM", color: "pink", mark: "Round birthmark on left shoulder", location: "Gangapur Road, Nashik" },
  { id: "TS-2040", person: "Devendra Pawar", age: 35, gender: "Male", district: "Pune", station: "Hadapsar", type: "Related investigation", status: "Open", priority: "Standard", lastSeen: "04 Oct 2026", updated: "Yesterday", initials: "DP", color: "slate", mark: "Tattoo on right forearm", location: "Hadapsar, Pune" },
  { id: "TS-2039", person: "Kavya Joshi", age: 28, gender: "Female", district: "Kolhapur", station: "Shahupuri", type: "Missing person", status: "Resolved", priority: "Standard", lastSeen: "02 Oct 2026", updated: "2 days ago", initials: "KJ", color: "cyan", mark: "Small scar on left knee", location: "Shahupuri, Kolhapur" },
  { id: "TS-2038", person: "Nikhil Bhosale", age: 20, gender: "Male", district: "Mumbai", station: "Andheri", type: "Missing person", status: "Open", priority: "Medium", lastSeen: "01 Oct 2026", updated: "2 days ago", initials: "NB", color: "indigo", mark: "Mole near right ear", location: "Andheri, Mumbai" },
  { id: "TS-2037", person: "Unidentified person", age: 26, gender: "Female", district: "Nagpur", station: "Sadar", type: "Unidentified person", status: "Under investigation", priority: "Medium", lastSeen: "29 Sep 2026", updated: "3 days ago", initials: "UP", color: "lime", mark: "Tattoo on left wrist", location: "Sadar, Nagpur" },
  { id: "TS-2036", person: "Arjun Shinde", age: 32, gender: "Male", district: "Nashik", station: "Indira Nagar", type: "Missing person", status: "Resolved", priority: "Standard", lastSeen: "26 Sep 2026", updated: "4 days ago", initials: "AS", color: "blue", mark: "Scar on right forearm", location: "Indira Nagar, Nashik" },
  { id: "TS-2035", person: "Pooja Chavan", age: 18, gender: "Female", district: "Pune", station: "Deccan", type: "Missing person", status: "Open", priority: "Medium", lastSeen: "25 Sep 2026", updated: "5 days ago", initials: "PC", color: "rose", mark: "Mole below left eye", location: "Deccan, Pune" },
  { id: "TS-2034", person: "Sameer Khan", age: 27, gender: "Male", district: "Kolhapur", station: "Rajarampuri", type: "Related investigation", status: "Verified", priority: "Standard", lastSeen: "22 Sep 2026", updated: "1 week ago", initials: "SK", color: "teal", mark: "Tattoo on upper arm", location: "Rajarampuri, Kolhapur" },
];

const seedMatches: PotentialMatch[] = [
  { id: "MT-091", from: "TS-2048", to: "TS-2046", district: "Pune → Nashik", score: 91, reason: "Age range, identifying mark & travel corridor", status: "Requires review", date: "Today, 10:24" },
  { id: "MT-090", from: "TS-2047", to: "TS-2043", district: "Mumbai → Mumbai", score: 87, reason: "Age range, appearance & last-seen proximity", status: "Requires review", date: "Today, 09:12" },
  { id: "MT-089", from: "TS-2045", to: "TS-2042", district: "Kolhapur → Nagpur", score: 82, reason: "Age range, gender & inter-district route", status: "Requires review", date: "Yesterday, 16:48" },
  { id: "MT-088", from: "TS-2044", to: "TS-2037", district: "Pune → Nagpur", score: 79, reason: "Age range, identifying mark & description", status: "Requires review", date: "Yesterday, 14:31" },
  { id: "MT-087", from: "TS-2041", to: "TS-2043", district: "Nashik → Mumbai", score: 76, reason: "Age range, gender & date proximity", status: "Requires review", date: "Yesterday, 11:06" },
  { id: "MT-086", from: "TS-2042", to: "TS-2040", district: "Nagpur → Pune", score: 73, reason: "Location corridor & descriptive attributes", status: "Requires review", date: "12 Oct, 17:50" },
  { id: "MT-085", from: "TS-2048", to: "TS-2038", district: "Pune → Mumbai", score: 71, reason: "Age range, gender & inter-district route", status: "Requires review", date: "12 Oct, 14:22" },
  { id: "MT-084", from: "TS-2047", to: "TS-2037", district: "Mumbai → Nagpur", score: 68, reason: "Age range & identifying mark", status: "Requires review", date: "11 Oct, 18:02" },
  { id: "MT-083", from: "TS-2045", to: "TS-2046", district: "Kolhapur → Nashik", score: 64, reason: "Gender, age range & date proximity", status: "Verified", date: "11 Oct, 09:41" },
  { id: "MT-082", from: "TS-2044", to: "TS-2043", district: "Pune → Mumbai", score: 58, reason: "Location corridor & descriptive attributes", status: "Not a match", date: "10 Oct, 12:18" },
];

const trendData = [
  { month: "May", cases: 44, matched: 20 }, { month: "Jun", cases: 52, matched: 28 },
  { month: "Jul", cases: 48, matched: 24 }, { month: "Aug", cases: 67, matched: 37 },
  { month: "Sep", cases: 58, matched: 31 }, { month: "Oct", cases: 73, matched: 42 },
];
const districtData = [
  { district: "Pune", cases: 38 }, { district: "Mumbai", cases: 32 },
  { district: "Nagpur", cases: 25 }, { district: "Nashik", cases: 21 },
  { district: "Kolhapur", cases: 16 },
];
const statusData = [
  { name: "Investigation", value: 46, color: "#3679c9" },
  { name: "Open", value: 28, color: "#efab4d" },
  { name: "Potential match", value: 17, color: "#52a68a" },
  { name: "Resolved", value: 9, color: "#b8c4d3" },
];

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as { cases: CaseRecord[]; matches: PotentialMatch[]; audit: AuditEntry[] };
      if (Array.isArray(parsed.cases) && Array.isArray(parsed.matches) && Array.isArray(parsed.audit)) return parsed;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return {
    cases: seedCases,
    matches: seedMatches,
    audit: [
      { action: "Potential match generated", detail: "TS-2048 · Match MT-091", time: "10:24 AM" },
      { action: "Case record updated", detail: "TS-2047 · Mumbai District", time: "09:48 AM" },
      { action: "Investigator review completed", detail: "TS-2042 · Nagpur District", time: "09:16 AM" },
    ],
  };
}

function App() {
  const [data, setData] = useState(loadData);
  const [language, setLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved && isLanguageCode(saved) ? saved : "en";
  });
  const [authenticated, setAuthenticated] = useState(false);
  const [section, setSection] = useState<Section>("Dashboard");
  const [query, setQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("All districts");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [showAddCase, setShowAddCase] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [matchFilter, setMatchFilter] = useState("Requires review");
  const [toast, setToast] = useState("");
  const t = (key: string) => translations[language][key] ?? assistantTranslations[language]?.[key] ?? translations.en[key] ?? assistantTranslations.en[key] ?? key;
  const locale = { language, setLanguage: (value: LanguageCode) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
    setLanguage(value);
  }, t };

  const updateData = (next: typeof data) => {
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };
  const addAudit = (audit: AuditEntry) => [...data.audit, audit].slice(-30);
  const openSection = (value: Section) => {
    setSection(value);
    setSelectedCase(null);
    setMobileNav(false);
  };

  const filteredCases = useMemo(() => data.cases.filter((item) => {
    const matchesQuery = `${item.id} ${item.person} ${item.state ?? "Maharashtra"} ${item.district} ${item.station} ${item.age} ${item.gender} ${item.mark}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (districtFilter === "All districts" || item.district === districtFilter) && (statusFilter === "All statuses" || item.status === statusFilter);
  }), [data.cases, query, districtFilter, statusFilter]);
  const visibleMatches = data.matches.filter((match) => matchFilter === "All matches" || match.status === matchFilter);
  const pendingMatches = data.matches.filter((match) => match.status === "Requires review").length;

  const decideMatch = (id: string, status: MatchStatus) => {
    const match = data.matches.find((entry) => entry.id === id);
    if (!match) return;
    const matches = data.matches.map((entry) => entry.id === id ? { ...entry, status } : entry);
    const cases = status === "Verified"
      ? data.cases.map((entry) => [match.from, match.to].includes(entry.id) && entry.status !== "Resolved" ? { ...entry, status: "Verified" as CaseStatus, updated: "Just now" } : entry)
      : data.cases;
    updateData({ cases, matches, audit: addAudit({ action: status === "Verified" ? "Potential match verified" : "Potential match dismissed", detail: `${match.id} · ${match.from} ↔ ${match.to}`, time: "Just now" }) });
    notify(status === "Verified" ? "Match marked verified. Case records updated." : "Match marked as not a match.");
  };

  const addCase = (input: Pick<CaseRecord, "person" | "age" | "gender" | "state" | "district" | "station" | "type" | "mark" | "location">) => {
    const initials = input.person.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    const newCase: CaseRecord = {
      ...input, id: `TS-${2049 + data.cases.length - seedCases.length}`, status: "Open", priority: "Medium",
      lastSeen: "14 Oct 2026", updated: "Just now", initials, color: "blue",
    };
    updateData({ cases: [newCase, ...data.cases], matches: data.matches, audit: addAudit({ action: "New case record created", detail: `${newCase.id} · ${newCase.district} District`, time: "Just now" }) });
    setShowAddCase(false);
    setSection("Cases");
    notify(`${newCase.id} has been added to the case register.`);
  };

  const runMatches = (caseId: string) => {
    const already = data.matches.some((match) => match.from === caseId && match.status === "Requires review");
    if (already) {
      setSection("Potential matches");
      notify("There are already potential matches awaiting review for this case.");
      return;
    }
    const generated: PotentialMatch = {
      id: `MT-${String(92 + Math.max(0, data.matches.length - seedMatches.length)).padStart(3, "0")}`, from: caseId,
      to: data.cases.find((entry) => entry.id !== caseId)?.id ?? "TS-2046",
      district: "Pune → Nashik", score: 72 + (data.matches.length % 20),
      reason: "Age range, descriptive attributes & location corridor", status: "Requires review", date: "Just now",
    };
    updateData({ cases: data.cases.map((item) => item.id === caseId ? { ...item, status: "Potential match" as CaseStatus, updated: "Just now" } : item), matches: [generated, ...data.matches], audit: addAudit({ action: "Potential match generated", detail: `${caseId} · Match ${generated.id}`, time: "Just now" }) });
    setSection("Potential matches");
    setMatchFilter("Requires review");
    notify("Potential match generated. Human verification is required.");
  };

  if (!authenticated) {
    return <LocaleContext.Provider value={locale}><LoginPage onDemoLogin={() => setAuthenticated(true)} /></LocaleContext.Provider>;
  }

  return (
    <LocaleContext.Provider value={locale}><div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><span className="brand-bridge">T</span><span className="brand-dot" /></div>
          <div><div className="brand-name">TRACE<span>SETU</span></div><div className="brand-caption">CASE COORDINATION</div></div>
          <button className="mobile-close icon-button" aria-label="Close menu" onClick={() => setMobileNav(false)}><X size={18} /></button>
        </div>
        <div className="demo-chip"><span className="pulse-dot" /> {t("demoEnvironment")}</div>
        <div className="nav-label">{t("workspace")}</div>
        <nav className="main-nav" aria-label="Main navigation">
          {([
            ["Dashboard", "dashboard", LayoutDashboard],
            ["Cases", "cases", ClipboardList],
            ["Potential matches", "matches", Fingerprint],
            ["District network", "network", Globe2],
            ["Analytics", "analytics", Activity],
          ] as const).map(([label, translationKey, Icon]) => (
            <button key={label} className={`nav-item ${section === label && !selectedCase ? "active" : ""}`} onClick={() => openSection(label)}>
              <Icon size={18} strokeWidth={1.8} /><span>{t(translationKey)}</span>
              {label === "Potential matches" && pendingMatches > 0 && <span className="nav-count">{pendingMatches}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><CircleHelp size={16} /></div>
            <div><strong>{t("assistance")}</strong><span>{t("fieldGuide")}</span></div>
            <ArrowRight size={14} />
          </div>
          <div className="sidebar-user">
            <div className="user-avatar">RK</div>
            <div className="user-details"><strong>R. Kulkarni</strong><span>District Investigator</span></div>
            <MoreHorizontal size={18} className="user-more" />
          </div>
          <div className="sidebar-footnote"><ShieldCheck size={13} /> {t("secureAccess")}</div>
        </div>
      </aside>
      {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
          <div className="topbar-left">
            <div className="gov-mark" aria-label="Government of India">
              <NationalEmblem />
              <div className="flag" aria-hidden="true"><i /><i /><i /><span className="chakra"><b /></span></div>
              <div className="gov-copy"><strong>GOVERNMENT OF INDIA</strong><span>Public Safety · India</span></div>
            </div>
            <div className="topbar-divider" />
            <div className="crumb"><span>{t("workspace")}</span><ChevronRight size={14} /><strong>{selectedCase ? "Case profile" : t(section === "Dashboard" ? "dashboard" : section === "Cases" ? "cases" : section === "Potential matches" ? "matches" : section === "District network" ? "network" : "analytics")}</strong></div>
          </div>
          <div className="topbar-actions">
            <LanguagePicker />
            <label className="global-search"><Search size={16} /><input placeholder={t("search")} value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => selectedCase && setSelectedCase(null)} onKeyDown={(event) => { if (event.key === "Enter") openSection("Cases"); }} /><kbd>⌘ K</kbd></label>
            <div className="top-action-wrap">
              <button className={`icon-button top-icon ${showNotifications ? "selected" : ""}`} aria-label="Notifications" onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}><Bell size={18} /><span className="notification-dot" /></button>
              {showNotifications && <div className="popover notification-popover"><div className="popover-heading"><strong>Notifications</strong><button onClick={() => notify("All notifications marked as read.")}>Mark all read</button></div><div className="notification-row"><span className="notification-icon blue-soft"><Fingerprint size={15} /></span><div><strong>New potential match</strong><p>TS-2048 · Pune ↔ Nashik</p><small>18 minutes ago</small></div><i /></div><div className="notification-row"><span className="notification-icon amber-soft"><Clock3 size={15} /></span><div><strong>Review required</strong><p>3 matches need your attention</p><small>42 minutes ago</small></div><i /></div><button className="popover-footer" onClick={() => { openSection("Potential matches"); setShowNotifications(false); }}>View all notifications <ArrowRight size={14} /></button></div>}
            </div>
            <div className="top-action-wrap">
              <button className="profile-button" onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}><span className="profile-avatar">RK</span><span className="profile-text"><strong>R. Kulkarni</strong><small>Investigator</small></span><ChevronDown size={14} /></button>
              {showProfile && <div className="popover profile-popover"><div className="profile-popover-top"><span className="profile-avatar">RK</span><div><strong>R. Kulkarni</strong><small>Shivajinagar Police Station</small></div></div><div className="profile-role"><ShieldCheck size={14} /> Authorized investigator</div><button className="profile-menu-item" onClick={() => notify("You are signed in to the fictional demo environment.")}>Account settings <ArrowRight size={14} /></button><button className="profile-menu-item" onClick={() => { setAuthenticated(false); setShowProfile(false); setSelectedCase(null); setSection("Dashboard"); }}>Sign out <ArrowRight size={14} /></button></div>}
            </div>
          </div>
        </header>
        <div className="official-note"><ShieldCheck size={13} /><span>{t("authorized")}</span><span className="note-separator">·</span><span>{t("demoOnly")}</span><button aria-label="About prototype" onClick={() => notify("TRACESETU is a decision-support prototype. All potential matches require human verification.")}><CircleHelp size={13} /></button></div>

        <div className="page-content">
          {selectedCase ? <CaseProfile record={selectedCase} matches={data.matches.filter((match) => match.from === selectedCase.id || match.to === selectedCase.id)} onBack={() => setSelectedCase(null)} onFind={() => runMatches(selectedCase.id)} onReview={(id) => { setSelectedCase(null); setSection("Potential matches"); setMatchFilter("All matches"); window.setTimeout(() => document.getElementById(`match-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80); }} />
            : section === "Dashboard" ? <Dashboard data={data} pendingMatches={pendingMatches} onNavigate={openSection} onOpenCase={setSelectedCase} onFindMatches={runMatches} />
            : section === "Cases" ? <CasesPage cases={filteredCases} query={query} onQueryChange={setQuery} districtFilter={districtFilter} onDistrictChange={setDistrictFilter} statusFilter={statusFilter} onStatusChange={setStatusFilter} onAdd={() => setShowAddCase(true)} onOpenCase={setSelectedCase} onFindMatches={runMatches} />
            : section === "Potential matches" ? <MatchesPage matches={visibleMatches} allCount={data.matches.length} filter={matchFilter} onFilter={setMatchFilter} onDecide={decideMatch} onOpenCase={(id) => { const record = data.cases.find((item) => item.id === id); if (record) setSelectedCase(record); }} />
            : section === "District network" ? <NetworkPage matches={data.matches} />
            : <AnalyticsPage cases={data.cases} matches={data.matches} />}
        </div>
      </main>

      {showAddCase && <AddCaseModal onClose={() => setShowAddCase(false)} onSave={addCase} />}
      <AssistantChat cases={data.cases} matches={data.matches} onNavigate={openSection} />
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div></LocaleContext.Provider>
  );
}

function LoginPage({ onDemoLogin }: { onDemoLogin: () => void }) {
  const { t } = useContext(LocaleContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Pune");
  const stateDistricts = getDistricts(state);
  const [role, setRole] = useState("Investigator");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(t("signInUnavailable"));
  };

  return <main className="login-page">
    <section className="login-story">
      <div className="login-story-texture" />
      <div className="login-brand">
        <div className="brand-mark"><span className="brand-bridge">T</span><span className="brand-dot" /></div>
        <div><div className="brand-name">TRACE<span>SETU</span></div><div className="brand-caption">CASE COORDINATION PLATFORM</div></div>
      </div>
      <div className="login-hero-copy">
        <span className="login-kicker"><span className="pulse-dot" /> {t("loginKicker")}</span>
        <h1>{t("loginHeadline").split("<br />")[0]}<br /><em>{t("loginHeadline").split("<br />")[1]}</em></h1>
        <p>{t("loginStory")}</p>
      </div>
      <div className="login-network-art" aria-hidden="true">
        <svg viewBox="0 0 620 270" preserveAspectRatio="xMidYMid meet">
          <defs><radialGradient id="loginGlow"><stop stopColor="#6fb7d6" stopOpacity=".25" /><stop offset="1" stopColor="#6fb7d6" stopOpacity="0" /></radialGradient></defs>
          <ellipse cx="340" cy="142" rx="230" ry="120" fill="url(#loginGlow)" />
          <path className="login-map-outline" d="M70 139 101 106l40 8 18-26 46 10 26-28 51 18 28-25 33 17 34-11 30 30 45-4 20 28 49 4-2 35-23 22-41-4-24 34-44-10-27 22-38-12-32 17-31-22-39 12-17-27-46 4-20-23-46-6 5-25-35-10Z" />
          <path className="login-route" d="M155 147 Q240 65 326 117 T468 129 M155 147 Q238 205 326 117 T420 177 M235 103 Q280 151 326 117 T468 129" />
          <g className="login-map-point"><circle cx="155" cy="147" r="10" /><circle cx="155" cy="147" r="3" /><text x="132" y="173">MUMBAI</text></g>
          <g className="login-map-point"><circle cx="326" cy="117" r="12" /><circle cx="326" cy="117" r="4" /><text x="305" y="145">PUNE</text></g>
          <g className="login-map-point"><circle cx="235" cy="103" r="8" /><circle cx="235" cy="103" r="2.5" /><text x="209" y="90">NASHIK</text></g>
          <g className="login-map-point"><circle cx="420" cy="177" r="8" /><circle cx="420" cy="177" r="2.5" /><text x="403" y="201">KOLHAPUR</text></g>
          <g className="login-map-point"><circle cx="468" cy="129" r="8" /><circle cx="468" cy="129" r="2.5" /><text x="451" y="111">NAGPUR</text></g>
        </svg>
        <div className="login-art-card"><span className="login-art-icon"><Fingerprint size={17} /></span><span><strong>Potential lead identified</strong><small>Human review always required</small></span><span className="login-art-score">87%</span></div>
      </div>
      <div className="login-story-bottom"><div className="login-story-rule" /><span>SECURE COORDINATION · HUMAN-LED DECISIONS</span><span>MAHARASHTRA · INDIA</span></div>
    </section>

    <section className="login-form-side">
      <div className="login-gov-line">
        <div className="gov-mark" aria-label="Ashoka Lion Capital, Indian flag and Government of India"><NationalEmblem /><div className="flag" aria-hidden="true"><i /><i /><i /><span className="chakra"><b /></span></div><div className="gov-copy"><strong>GOVERNMENT OF INDIA</strong><span>Public Safety · India</span></div></div>
        <div className="login-header-actions"><LanguagePicker /><span className="login-prototype">{t("prototype")}</span></div>
      </div>
      <div className="login-form-wrap">
        <div className="login-mobile-brand"><div className="brand-mark"><span className="brand-bridge">T</span><span className="brand-dot" /></div><div className="brand-name">TRACE<span>SETU</span></div></div>
        <div className="login-heading"><span className="login-eyebrow"><LockKeyhole size={13} /> {t("authorized")}</span><h2>{t("welcomeBack")}</h2><p>{t("loginIntro")}</p></div>
        <form className="login-form" onSubmit={submit}>
          <label className="login-label" htmlFor="login-email">{t("officialId")}</label>
          <div className="login-input-wrap"><UserRound size={16} /><input id="login-email" type="email" autoComplete="username" placeholder="name@department.gov.in" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <div className="login-password-heading"><label className="login-label" htmlFor="login-password">{t("password")}</label><button type="button" className="forgot-link" onClick={() => setMessage(t("signInUnavailable"))}>{t("forgotPassword")}</button></div>
          <div className="login-input-wrap"><LockKeyhole size={16} /><input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder={t("password")} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
          <div className="login-selects">
            <div><label className="login-label" htmlFor="login-state">{t("state")}</label><div className="login-select-wrap"><MapPin size={14} /><select id="login-state" value={state} onChange={(event) => { setState(event.target.value); setDistrict(getDistricts(event.target.value)[0] ?? ""); }}>{indiaStatesAndDistricts.map((item) => <option key={item.state}>{item.state}</option>)}</select><ChevronDown size={14} /></div></div>
            <div><label className="login-label" htmlFor="login-district">{t("district")}</label><div className="login-select-wrap"><MapPin size={14} /><select id="login-district" value={district} onChange={(event) => setDistrict(event.target.value)}>{stateDistricts.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></div></div>
            <div className="login-role-field"><label className="login-label" htmlFor="login-role">{t("role")}</label><div className="login-select-wrap"><ShieldCheck size={14} /><select id="login-role" value={role} onChange={(event) => setRole(event.target.value)}><option>Investigator</option><option>District officer</option><option>Administrator</option><option>Read-only viewer</option></select><ChevronDown size={14} /></div></div>
          </div>
          {message && <div className="login-message" role="status"><CircleHelp size={15} /><span>{message}</span></div>}
          <button type="submit" className="login-submit">{t("signIn")} <ArrowRight size={16} /></button>
        </form>
        <div className="login-divider"><span /> <small>{t("orDemo")}</small> <span /></div>
        <button type="button" className="demo-login-button" onClick={onDemoLogin}><Sparkles size={16} /><span><strong>{t("demoAccess")}</strong><small>{t("demoCaption")}</small></span><ArrowUpRight size={15} /></button>
        <div className="login-security-note"><ShieldCheck size={15} /><span>{t("secureAccess")}<br /><strong>{t("loginWarning")}</strong></span></div>
      </div>
      <footer className="login-footer"><span>© 2026 TRACESETU · {t("prototype")}</span><span>{t("notOfficial")}</span></footer>
    </section>
  </main>;
}

function LanguagePicker() {
  const { language, setLanguage, t } = useContext(LocaleContext);
  return <label className="language-picker">
    <Globe2 size={14} aria-hidden="true" />
    <span className="language-picker-label">{t("language")}</span>
    <select aria-label={t("language")} value={language} onChange={(event) => {
      if (isLanguageCode(event.target.value)) setLanguage(event.target.value);
    }}>
      {languages.map((item) => <option key={item.code} value={item.code}>{item.nativeName}</option>)}
    </select>
    <ChevronDown size={12} aria-hidden="true" />
  </label>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <div className="heading-action">{action}</div>}</div>;
}

function NationalEmblem() {
  return <svg className="national-emblem" viewBox="0 0 40 44" role="img" aria-label="Stylized Ashoka Lion Capital emblem">
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.15">
      <path d="M8 17c-1.5-3-1.4-6.1.3-8.4L6.8 6l3.4.9c1.1-2 2.9-3.1 5.1-3.2L17 1.5l2.1 2.2L20 1l.9 2.7L23 1.5l1.7 2.2c2.2.1 4 1.2 5.1 3.2l3.4-.9-1.5 2.6c1.7 2.3 1.8 5.4.3 8.4" />
      <path d="M8.2 13.4c2.1-1.9 4.4-2.9 7-2.9s4.5 1 4.8 3.1c.3-2.1 2.2-3.1 4.8-3.1s4.9 1 7 2.9M9 16.7c2.2-1.1 4.3-1.7 6.4-1.7 2.3 0 3.9.6 4.6 1.8.7-1.2 2.3-1.8 4.6-1.8 2.1 0 4.2.6 6.4 1.7" />
      <path d="M8 18c.2 2.5 1.1 4.3 2.7 5.4l-.3 2.3h19.2l-.3-2.3c1.6-1.1 2.5-2.9 2.7-5.4M11 22l2-1.1m16 1.1-2-1.1M15 20l1.4 1m8.6-1-1.4 1M12 25.7v2m16-2v2" />
      <path d="M6.5 28h27v5h-27zM9 33v2.5m22-2.5v2.5M12 35.5h16M14 38h12M16 40.5h8M18 43h4" />
      <circle cx="20" cy="30.5" r="2.1" />
      <path d="M20 28.8v3.4m-1.7-1.7h3.4m-2.9-1.2 2.4 2.4m0-2.4-2.4 2.4M9 30.5h2m18 0h2" />
    </g>
  </svg>;
}

function Dashboard({ data, pendingMatches, onNavigate, onOpenCase, onFindMatches }: {
  data: { cases: CaseRecord[]; matches: PotentialMatch[]; audit: AuditEntry[] };
  pendingMatches: number;
  onNavigate: (section: Section) => void;
  onOpenCase: (record: CaseRecord) => void;
  onFindMatches: (caseId: string) => void;
}) {
  const { t } = useContext(LocaleContext);
  const active = data.cases.filter((record) => !["Resolved", "Verified"].includes(record.status)).length;
  const stats = [
    { label: t("activeCases"), value: String(active).padStart(2, "0"), delta: t("fiveDistricts"), icon: ClipboardList, color: "blue", trend: "up" },
    { label: t("potentialMatches"), value: String(pendingMatches).padStart(2, "0"), delta: t("awaitingReview"), icon: Fingerprint, color: "mint", trend: "up" },
    { label: t("unidentified"), value: String(data.cases.filter((item) => item.type === "Unidentified person").length).padStart(2, "0"), delta: t("recordsInSystem"), icon: UserRound, color: "gold", trend: "flat" },
    { label: t("reviewsNeeded"), value: String(pendingMatches).padStart(2, "0"), delta: t("needsAttention"), icon: Clock3, color: "violet", trend: "down" },
  ];
  return <>
    <div className="welcome-strip"><div className="welcome-symbol"><Sparkles size={17} /></div><div><strong>{t("welcome")}</strong><span>{t("welcomeLine")}</span></div><span className="welcome-date">WED, 14 OCT 2026</span></div>
    <PageHeading eyebrow={t("commandWord")} title={t("command")} description={t("commandLine")} action={<button className="button button-primary" onClick={() => onNavigate("Cases")}><FilePlus2 size={16} /> {t("newCase")}</button>} />

    <section className="stat-grid" aria-label="Key statistics">
      {stats.map(({ label, value, delta, icon: Icon, color, trend }) => <div className="stat-card" key={label}><div className="stat-top"><span className={`stat-icon ${color}`}><Icon size={18} /></span><button className="stat-menu" aria-label={`${label} options`}><MoreHorizontal size={17} /></button></div><div className="stat-value">{value}<span className={`stat-trend ${trend}`}>{trend === "up" ? <ArrowUpRight size={13} /> : trend === "down" ? <ArrowDownRight size={13} /> : <Activity size={12} />}</span></div><div className="stat-label">{label}</div><div className="stat-delta">{delta}</div></div>)}
    </section>

    <div className="dashboard-grid">
      <section className="panel trend-panel">
        <div className="panel-header"><div><h2>{t("caseActivity")}</h2><p>{t("caseActivityLine")}</p></div><button className="select-like">{t("lastSixMonths")} <ChevronDown size={14} /></button></div>
        <div className="chart-legend"><span><i className="legend-blue" /> {t("reportedCases")}</span><span><i className="legend-mint" /> {t("potentialMatches")}</span><span className="chart-total">73 <small>{t("newCasesMonth")}</small></span></div>
        <div className="trend-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}><defs><linearGradient id="caseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3c83d3" stopOpacity={0.15} /><stop offset="95%" stopColor="#3c83d3" stopOpacity={0} /></linearGradient><linearGradient id="matchFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#56ae91" stopOpacity={0.13} /><stop offset="95%" stopColor="#56ae91" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#edf1f5" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8995a5", fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8995a5", fontSize: 11 }} /><Tooltip contentStyle={{ border: "1px solid #e8edf3", borderRadius: 10, boxShadow: "0 8px 24px #17344e14" }} /><Area type="monotone" dataKey="cases" name="Cases reported" stroke="#3679c9" strokeWidth={2.3} fill="url(#caseFill)" /><Area type="monotone" dataKey="matched" name="Potential matches" stroke="#52a68a" strokeWidth={2.3} fill="url(#matchFill)" /></AreaChart></ResponsiveContainer></div>
      </section>
      <section className="panel status-panel">
        <div className="panel-header"><div><h2>{t("cases")}</h2><p>{t("activeCases")}</p></div><button className="round-more" aria-label="More options"><MoreHorizontal size={17} /></button></div>
        <div className="status-chart-wrap"><div className="status-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" innerRadius="72%" outerRadius="96%" paddingAngle={4} stroke="none" startAngle={90} endAngle={-270}>{statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer><div className="donut-center"><strong>128</strong><span>{t("cases")}</span></div></div>
          <div className="status-legend">{statusData.map((entry) => <div key={entry.name}><i style={{ background: entry.color }} /><span>{entry.name}</span><strong>{entry.value}%</strong></div>)}</div></div>
        <button className="panel-link" onClick={() => onNavigate("Analytics")}>{t("analyticsTitle")} <ArrowRight size={14} /></button>
      </section>
    </div>

    <div className="dashboard-grid lower-grid">
      <section className="panel district-panel">
        <div className="panel-header"><div><h2>{t("casesByDistrict")}</h2><p>{t("activeAcrossNetwork")}</p></div><button className="text-link" onClick={() => onNavigate("District network")}>{t("network")} <ArrowRight size={14} /></button></div>
        <div className="district-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={districtData} layout="vertical" margin={{ top: 4, right: 24, left: 2, bottom: 0 }}><CartesianGrid stroke="#eef1f5" horizontal={false} /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#8995a5", fontSize: 10 }} /><YAxis type="category" dataKey="district" axisLine={false} tickLine={false} tick={{ fill: "#5c6a7a", fontSize: 11 }} width={62} /><Tooltip cursor={{ fill: "#f5f8fb" }} contentStyle={{ border: "1px solid #e8edf3", borderRadius: 9 }} /><Bar dataKey="cases" fill="#79a8dd" radius={[0, 5, 5, 0]} barSize={12}>{districtData.map((entry, index) => <Cell key={entry.district} fill={index === 0 ? "#3679c9" : "#9dbce0"} />)}</Bar></BarChart></ResponsiveContainer></div>
      </section>
      <section className="panel review-panel">
        <div className="panel-header"><div><h2>{t("needsReview")}</h2><p>{t("matchesAwaiting")}</p></div><span className="review-count">{pendingMatches}</span></div>
        <div className="review-list">{data.matches.filter((match) => match.status === "Requires review").slice(0, 3).map((match) => {
          const source = data.cases.find((record) => record.id === match.from);
          const other = data.cases.find((record) => record.id === match.to);
          return <button className="review-row" key={match.id} onClick={() => onNavigate("Potential matches")}><div className="review-avatars"><span className={`person-avatar ${source?.color ?? "blue"}`}>{source?.initials ?? "?"}</span><span className={`person-avatar ${other?.color ?? "teal"}`}>{other?.initials ?? "?"}</span></div><div className="review-info"><strong>{match.from} <ArrowRight size={12} /> {match.to}</strong><span>{match.district}</span></div><div className="score-mini"><strong>{match.score}%</strong><span>match</span></div></button>;
        })}</div>
        <button className="panel-link" onClick={() => onNavigate("Potential matches")}>{t("reviewAll")} <ArrowRight size={14} /></button>
      </section>
    </div>

    <section className="panel recent-panel">
      <div className="panel-header"><div><h2>{t("recentlyUpdated")}</h2><p>{t("latestActivity")}</p></div><button className="text-link" onClick={() => onNavigate("Cases")}>{t("viewAll")} <ArrowRight size={14} /></button></div>
      <CaseTable cases={data.cases.slice(0, 5)} onOpenCase={onOpenCase} onFindMatches={onFindMatches} compact />
    </section>
    <div className="page-foot"><span><ShieldCheck size={13} /> TRACESETU is a decision-support system. All matches require human verification.</span><span>DEMO DATA · NOT REAL CASE INFORMATION</span></div>
  </>;
}

function CaseTable({ cases, onOpenCase, onFindMatches, compact = false }: { cases: CaseRecord[]; onOpenCase: (record: CaseRecord) => void; onFindMatches: (caseId: string) => void; compact?: boolean }) {
  return <div className={`table-scroll ${compact ? "compact-table" : ""}`}><table><thead><tr><th>CASE ID</th><th>PERSON</th><th>DISTRICT / STATION</th><th>CASE TYPE</th><th>STATUS</th><th>UPDATED</th><th aria-label="Actions" /></tr></thead><tbody>{cases.map((record) => <tr key={record.id}><td><button className="case-id-link" onClick={() => onOpenCase(record)}>{record.id}</button></td><td><button className="person-cell" onClick={() => onOpenCase(record)}><span className={`person-avatar ${record.color}`}>{record.initials}</span><span><strong>{record.person}</strong><small>{record.age} years · {record.gender}</small></span></button></td><td><span className="district-cell"><strong>{record.district}</strong><small>{record.state ?? "Maharashtra"} · {record.station} Police Station</small></span></td><td><span className="case-type">{record.type}</span></td><td><StatusBadge status={record.status} /></td><td className="updated-cell">{record.updated}</td><td><button className="table-more" aria-label={`Find matches for ${record.id}`} title="Find potential matches" onClick={() => onFindMatches(record.id)}><Fingerprint size={16} /></button></td></tr>)}</tbody></table>{cases.length === 0 && <div className="empty-state"><Search size={22} /><strong>No cases found</strong><span>Try changing your search or filters.</span></div>}</div>;
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const className = status === "Open" ? "status-open" : status === "Under investigation" ? "status-investigating" : status === "Potential match" ? "status-match" : status === "Verified" ? "status-verified" : "status-resolved";
  return <span className={`status-badge ${className}`}><i />{status}</span>;
}

function CasesPage({ cases, query, onQueryChange, districtFilter, onDistrictChange, statusFilter, onStatusChange, onAdd, onOpenCase, onFindMatches }: {
  cases: CaseRecord[]; query: string; onQueryChange: (value: string) => void; districtFilter: string; onDistrictChange: (value: string) => void;
  statusFilter: string; onStatusChange: (value: string) => void; onAdd: () => void; onOpenCase: (record: CaseRecord) => void; onFindMatches: (caseId: string) => void;
}) {
  const { t } = useContext(LocaleContext);
  return <>
    <PageHeading eyebrow={t("secureRecords")} title={t("caseManagement")} description={t("caseManagementLine")} action={<button className="button button-primary" onClick={onAdd}><Plus size={17} /> {t("createCase")}</button>} />
    <div className="cases-summary"><div><span className="summary-number">{cases.length.toString().padStart(2, "0")}</span><span>Records displayed</span></div><div className="summary-divider" /><div><span className="summary-number">05</span><span>Districts connected</span></div><div className="summary-spacer" /><span className="fictional-tag"><ShieldCheck size={13} /> Fictional demo records</span></div>
    <section className="panel cases-panel">
      <div className="case-toolbar"><label className="case-search"><Search size={16} /><input placeholder="Search name, case ID, station, identifying mark..." value={query} onChange={(event) => onQueryChange(event.target.value)} /><kbd>⌘ F</kbd></label><div className="filter-select-wrap"><Filter size={15} /><select aria-label="Filter by district" value={districtFilter} onChange={(event) => onDistrictChange(event.target.value)}><option>All districts</option>{districts.map((district) => <option key={district}>{district}</option>)}</select><ChevronDown size={14} /></div><div className="filter-select-wrap"><SlidersHorizontal size={15} /><select aria-label="Filter by status" value={statusFilter} onChange={(event) => onStatusChange(event.target.value)}><option>All statuses</option><option>Open</option><option>Under investigation</option><option>Potential match</option><option>Verified</option><option>Resolved</option></select><ChevronDown size={14} /></div><button className="icon-button export-button" title="Export is disabled in this demo"><MoreHorizontal size={19} /></button></div>
      <CaseTable cases={cases} onOpenCase={onOpenCase} onFindMatches={onFindMatches} />
      <div className="table-footer"><span>Showing <strong>{cases.length ? "1" : "0"}–{cases.length}</strong> of {cases.length} records</span><div className="pagination"><button disabled aria-label="Previous page"><ChevronLeft size={15} /></button><button className="page-active">1</button><button disabled aria-label="Next page"><ChevronRight size={15} /></button></div></div>
    </section>
    <div className="page-foot"><span><ShieldCheck size={13} /> Case details are visible to authorized personnel only.</span><span>DEMO DATA · NOT REAL CASE INFORMATION</span></div>
  </>;
}

function MatchesPage({ matches, allCount, filter, onFilter, onDecide, onOpenCase }: {
  matches: PotentialMatch[]; allCount: number; filter: string; onFilter: (value: string) => void; onDecide: (id: string, status: MatchStatus) => void; onOpenCase: (id: string) => void;
}) {
  const { t } = useContext(LocaleContext);
  return <>
    <PageHeading eyebrow={t("humanReview")} title={t("matchTitle")} description={t("matchLine")} action={<button className="button button-outline" onClick={() => onFilter("All matches")}><SlidersHorizontal size={16} /> {t("matchFilters")}</button>} />
    <div className="match-callout"><div className="callout-icon"><Fingerprint size={19} /></div><div><strong>Every suggestion needs a human decision</strong><p>Matches are generated from authorized case attributes. A score indicates similarity only and must never be treated as proof of identity.</p></div><span className="callout-count">{matches.filter((match) => match.status === "Requires review").length} <small>to review</small></span></div>
    <div className="match-tabs"><button className={filter === "Requires review" ? "selected" : ""} onClick={() => onFilter("Requires review")}>Requires review <span>{matches.filter((match) => match.status === "Requires review").length}</span></button><button className={filter === "Verified" ? "selected" : ""} onClick={() => onFilter("Verified")}>Verified <span>{matches.filter((match) => match.status === "Verified").length}</span></button><button className={filter === "Not a match" ? "selected" : ""} onClick={() => onFilter("Not a match")}>Not a match <span>{matches.filter((match) => match.status === "Not a match").length}</span></button><button className={filter === "All matches" ? "selected" : ""} onClick={() => onFilter("All matches")}>All <span>{allCount}</span></button></div>
    <div className="match-cards">{matches.map((match, index) => <MatchCard key={match.id} match={match} rank={index + 1} onDecide={onDecide} onOpenCase={onOpenCase} />)}{matches.length === 0 && <div className="panel empty-match"><Fingerprint size={26} /><strong>No matches in this view</strong><span>Try another status filter or check back later.</span></div>}</div>
    <div className="page-foot"><span><ShieldCheck size={13} /> All match decisions are logged for accountability.</span><span>DEMO DATA · NOT REAL CASE INFORMATION</span></div>
  </>;
}

function MatchCard({ match, rank, onDecide, onOpenCase }: { match: PotentialMatch; rank: number; onDecide: (id: string, status: MatchStatus) => void; onOpenCase: (id: string) => void }) {
  const scoreColor = match.score >= 85 ? "high" : match.score >= 70 ? "medium" : "low";
  return <article className="panel match-card" id={`match-${match.id}`}>
    <div className="match-card-top"><div className="match-rank">#{String(rank).padStart(2, "0")}</div><div className={`match-score ${scoreColor}`}><strong>{match.score}<small>%</small></strong><span>SIMILARITY</span></div><div className="match-meta"><span className="match-id">{match.id}</span><span className="match-time"><Clock3 size={12} /> {match.date}</span></div><span className={`match-status ${match.status === "Requires review" ? "pending" : match.status === "Verified" ? "confirmed" : "dismissed"}`}><i />{match.status}</span></div>
    <div className="match-pair">
      <button className="match-person" onClick={() => onOpenCase(match.from)}><span className="match-person-label">SOURCE CASE</span><span className="match-person-id">{match.from} <ArrowUpRight size={12} /></span><span className="match-person-place"><MapPin size={12} /> {match.district.split(" → ")[0]} District</span></button>
      <div className="pair-connector"><span /><ArrowRight size={15} /><span /></div>
      <button className="match-person" onClick={() => onOpenCase(match.to)}><span className="match-person-label">COMPARISON RECORD</span><span className="match-person-id">{match.to} <ArrowUpRight size={12} /></span><span className="match-person-place"><MapPin size={12} /> {match.district.split(" → ")[1]} District</span></button>
    </div>
    <div className="match-reason"><Sparkles size={14} /><span><strong>Suggested because:</strong> {match.reason}</span></div>
    <div className="match-card-bottom"><span className="human-review-label"><ShieldCheck size={14} /> Potential match — requires human verification</span>{match.status === "Requires review" && <div className="match-actions"><button className="button button-reject" onClick={() => onDecide(match.id, "Not a match")}><XCircle size={14} /> Not a match</button><button className="button button-verify" onClick={() => onDecide(match.id, "Verified")}><CheckCheck size={14} /> Verify match</button></div>}</div>
  </article>;
}

function CaseProfile({ record, matches, onBack, onFind, onReview }: { record: CaseRecord; matches: PotentialMatch[]; onBack: () => void; onFind: () => void; onReview: (id: string) => void }) {
  return <>
    <button className="back-link" onClick={onBack}><ChevronLeft size={16} /> Back to case register</button>
    <div className="profile-heading"><div className={`profile-person-avatar ${record.color}`}>{record.initials}</div><div className="profile-heading-info"><div className="eyebrow">CASE PROFILE / {record.id}</div><h1>{record.person}</h1><p>{record.age} years · {record.gender} · {record.district} District</p></div><div className="profile-heading-actions"><StatusBadge status={record.status} /><button className="button button-primary" onClick={onFind}><Fingerprint size={16} /> Find matches</button></div></div>
    <div className="profile-layout"><div className="profile-main">
      <section className="panel profile-section"><div className="section-title"><div><h2>Person information</h2><p>Fictional information for prototype demonstration</p></div><UserRound size={18} /></div><div className="detail-grid"><Detail label="Age" value={`${record.age} years`} /><Detail label="Gender" value={record.gender} /><Detail label="Identifying mark" value={record.mark} /><Detail label="Last known location" value={record.location} /><Detail label="Date last seen" value={record.lastSeen} /><Detail label="Case category" value={record.type} /></div></section>
      <section className="panel profile-section"><div className="section-title"><div><h2>Potential matches</h2><p>Ranked suggestions linked to this record</p></div><Fingerprint size={18} /></div>{matches.length ? matches.map((match) => <button className="profile-match-row" key={match.id} onClick={() => onReview(match.id)}><span className={`profile-score ${match.score >= 85 ? "high" : "medium"}`}>{match.score}%</span><span><strong>{match.id} · {match.from} ↔ {match.to}</strong><small>{match.reason}</small></span><span className={`match-status ${match.status === "Requires review" ? "pending" : match.status === "Verified" ? "confirmed" : "dismissed"}`}><i />{match.status}</span><ArrowRight size={15} /></button>) : <div className="inline-empty">No potential matches have been generated for this case yet.</div>}</section>
      <section className="panel profile-section"><div className="section-title"><div><h2>Investigation timeline</h2><p>Recent recorded activity</p></div><Activity size={18} /></div><div className="timeline"><div className="timeline-item"><span className="timeline-dot blue-dot" /><div><strong>Case record created</strong><p>Secure record entered into TRACESETU demo environment.</p><small>{record.updated === "Just now" ? "Just now" : record.lastSeen}</small></div></div><div className="timeline-item"><span className="timeline-dot mint-dot" /><div><strong>District coordination enabled</strong><p>Record available for authorized inter-district comparison.</p><small>System event</small></div></div></div></section>
    </div><aside className="profile-side"><section className="panel side-detail"><h3>Case details</h3><Detail label="Case number" value={record.id} /><Detail label="Police station" value={`${record.station} Police Station`} /><Detail label="District" value={record.district} /><Detail label="Priority" value={record.priority} /><Detail label="Last updated" value={record.updated} /><div className="side-disclaimer"><ShieldCheck size={15} /><span>Access to case information is restricted to authorized personnel.</span></div></section><section className="panel side-detail"><h3>Verification reminder</h3><p className="side-reminder">A similarity score is a lead, not confirmation. Verify every detail through established procedures before taking action.</p><button className="text-link" onClick={onFind}>Run matching again <ArrowRight size={14} /></button></section></aside></div>
    <div className="page-foot"><span><ShieldCheck size={13} /> Access and case updates are auditable.</span><span>DEMO DATA · NOT REAL CASE INFORMATION</span></div>
  </>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="detail-item"><span>{label}</span><strong>{value}</strong></div>;
}

function AssistantChat({ cases, matches, onNavigate }: { cases: CaseRecord[]; matches: PotentialMatch[]; onNavigate: (section: Section) => void }) {
  const { language, t } = useContext(LocaleContext);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: t("assistantIntro") },
  ]);

  useEffect(() => {
    setMessages((current) => current.map((message, index) =>
      index === 0 && message.role === "assistant"
        ? { ...message, text: t("assistantIntro") }
        : message,
    ));
  }, [language]);

  const answer = (question: string): Omit<ChatMessage, "role"> => {
    const text = question.toLowerCase();
    if (question === t("askReview") || question === t("askScore") || text.includes("match") || text.includes("score") || text.includes("similarity")) {
      return {
        text: t("matchGuidance"),
        action: "Potential matches",
      };
    }
    if (text.includes("review") || text.includes("verify") || text.includes("reject")) {
      return {
        text: t("reviewGuidance"),
        action: "Potential matches",
      };
    }
    if (question === t("askCreate") || text.includes("add") || text.includes("create") || text.includes("new case")) {
      return {
        text: t("caseGuidance"),
        action: "Cases",
      };
    }
    if (text.includes("district") || text.includes("network") || text.includes("map")) {
      return {
        text: t("networkGuidance"),
        action: "District network",
      };
    }
    if (text.includes("analytic") || text.includes("chart") || text.includes("trend")) {
      return {
        text: t("analyticsGuidance"),
        action: "Analytics",
      };
    }
    if (text.includes("how many") || text.includes("count") || text.includes("stat") || text.includes("summary")) {
      const activeCases = cases.filter((record) => !["Resolved", "Verified"].includes(record.status)).length;
      const reviewCount = matches.filter((match) => match.status === "Requires review").length;
      const verifiedCount = matches.filter((match) => match.status === "Verified").length;
      return {
        text: t("countGuidance").replace("{cases}", String(cases.length)).replace("{active}", String(activeCases)).replace("{pending}", String(reviewCount)).replace("{verified}", String(verifiedCount)),
        action: "Dashboard",
      };
    }
    if (text.includes("real") || text.includes("privacy") || text.includes("secure") || text.includes("data")) {
      return {
        text: t("privacyGuidance"),
      };
    }
    return {
      text: t("fallbackGuidance"),
    };
  };

  const sendMessage = (question: string) => {
    const cleaned = question.trim();
    if (!cleaned) return;
    setMessages((current) => [...current, { role: "user", text: cleaned }, { role: "assistant", ...answer(cleaned) }]);
    setInput("");
  };

  const startNewChat = () => {
    setMessages([{ role: "assistant", text: t("assistantIntro") }]);
  };

  return <div className="assistant-widget">
    {isOpen && <section className="assistant-panel" aria-label={t("assistant")}>
      <header className="assistant-header">
        <span className="assistant-avatar"><Bot size={18} /></span>
        <div className="assistant-heading"><strong>{t("assistant")}</strong><span><i /> {t("assistantStatus")}</span></div>
        <button className="assistant-header-button" aria-label={t("newChat")} title={t("newChat")} onClick={startNewChat}><RotateCcw size={15} /></button>
        <button className="assistant-header-button" aria-label={t("closeAssistant")} onClick={() => setIsOpen(false)}><X size={17} /></button>
      </header>
      <div className="assistant-disclaimer"><ShieldCheck size={13} /><span>{t("assistantWarning")}</span></div>
      <div className="assistant-messages" role="log" aria-live="polite" aria-relevant="additions">
        {messages.map((message, index) => <div className={`assistant-message ${message.role}`} key={`${index}-${message.text.slice(0, 20)}`}>
          {message.role === "assistant" && <span className="assistant-message-avatar"><Bot size={13} /></span>}
          <div className="assistant-bubble">
            <p>{message.text}</p>
            {message.action && <button className="assistant-action" onClick={() => { onNavigate(message.action!); setIsOpen(false); }}>{t(message.action === "Potential matches" ? "openReview" : message.action === "Cases" ? "openCases" : message.action === "District network" ? "openNetwork" : message.action === "Analytics" ? "openAnalytics" : "openDashboard")} <ArrowRight size={13} /></button>}
            <span className="assistant-message-time">{message.role === "assistant" ? t("demoReply") : t("you")}</span>
          </div>
        </div>)}
        {messages.length === 1 && <div className="assistant-suggestions"><span>{t("tryAsking")}</span><button onClick={() => sendMessage(t("askReview"))}>{t("askReview")}</button><button onClick={() => sendMessage(t("askScore"))}>{t("askScore")}</button><button onClick={() => sendMessage(t("askCreate"))}>{t("askCreate")}</button></div>}
      </div>
      <form className="assistant-compose" onSubmit={(event) => { event.preventDefault(); sendMessage(input); }}>
        <input aria-label={t("assistant")} placeholder={t("assistantPlaceholder")} value={input} onChange={(event) => setInput(event.target.value)} />
        <button type="submit" aria-label={t("send")} disabled={!input.trim()}><Send size={15} /></button>
      </form>
      <div className="assistant-footer">{t("assistantStatus")}</div>
    </section>}
    <button className={`assistant-launcher ${isOpen ? "is-open" : ""}`} aria-label={isOpen ? t("closeAssistant") : t("openAssistant")} onClick={() => setIsOpen(!isOpen)}>
      {isOpen ? <X size={21} /> : <><MessageCircle size={20} /><span className="assistant-launcher-label">{t("askAssistant")}</span><i /></>}
    </button>
  </div>;
}

function NetworkPage({ matches }: { matches: PotentialMatch[] }) {
  const { t } = useContext(LocaleContext);
  const activeRoutes = Array.from(new Set(matches.map((match) => match.district)));
  return <>
    <PageHeading eyebrow={t("workspace")} title={t("districtNetwork")} description={t("networkLine")} action={<span className="network-live"><span className="pulse-dot" /> 5 · {t("network").toUpperCase()}</span>} />
    <section className="network-hero">
      <div className="network-copy"><span className="network-kicker"><Globe2 size={14} /> MAHARASHTRA COORDINATION NETWORK</span><h2>Closer connections.<br /><em>Better coordination.</em></h2><p>Potential links across district boundaries are surfaced for authorized officers to review and verify.</p><div className="network-stats"><div><strong>05</strong><span>Districts connected</span></div><div><strong>{activeRoutes.length.toString().padStart(2, "0")}</strong><span>Active routes</span></div><div><strong>{matches.filter((match) => match.status === "Requires review").length.toString().padStart(2, "0")}</strong><span>Awaiting review</span></div></div></div>
      <div className="map-visual"><div className="map-grid" /><svg className="route-lines" viewBox="0 0 440 320" aria-hidden="true"><path d="M116 174 Q197 73 270 102 T345 166 Q282 231 208 208 T116 174" /><path d="M116 174 Q102 100 190 73 T345 166" /><path d="M116 174 Q192 256 270 102" /><path d="M208 208 Q273 276 345 166" /></svg><div className="map-pin pin-pune"><span /><strong>Pune</strong></div><div className="map-pin pin-mumbai"><span /><strong>Mumbai</strong></div><div className="map-pin pin-nashik"><span /><strong>Nashik</strong></div><div className="map-pin pin-nagpur"><span /><strong>Nagpur</strong></div><div className="map-pin pin-kolhapur"><span /><strong>Kolhapur</strong></div><span className="map-caption"><MapPin size={12} /> Illustrative district routes</span></div>
    </section>
    <div className="section-subheading"><div><h2>Cross-district match leads</h2><p>Potential connections requiring officer review</p></div><span className="fictional-tag"><ShieldCheck size={13} /> Fictional records</span></div>
    <section className="panel route-table"><div className="route-table-head"><span>CASE PAIR</span><span>DISTRICT ROUTE</span><span>LEAD</span><span>STATUS</span><span>UPDATED</span></div>{matches.filter((match) => match.district.includes("→") && match.district.split(" → ")[0] !== match.district.split(" → ")[1]).slice(0, 7).map((match) => <div className="route-table-row" key={match.id}><span className="case-id-link">{match.from} <ArrowRight size={12} /> {match.to}</span><span className="route-name"><MapPin size={13} /> {match.district}</span><span className={`route-score ${match.score > 84 ? "high" : ""}`}>{match.score}% <small>similarity</small></span><span className={`match-status ${match.status === "Requires review" ? "pending" : match.status === "Verified" ? "confirmed" : "dismissed"}`}><i />{match.status}</span><span className="updated-cell">{match.date}</span></div>)}</section>
    <div className="network-caption"><ShieldCheck size={14} /> Route lines are illustrative only; they do not represent verified movement or location data.</div>
    <div className="page-foot"><span><ShieldCheck size={13} /> Coordination is limited to authorized district users.</span><span>DEMO DATA · NOT REAL CASE INFORMATION</span></div>
  </>;
}

function AnalyticsPage({ cases, matches }: { cases: CaseRecord[]; matches: PotentialMatch[] }) {
  const { t } = useContext(LocaleContext);
  const verified = matches.filter((match) => match.status === "Verified").length;
  const avgScore = Math.round(matches.reduce((sum, match) => sum + match.score, 0) / Math.max(matches.length, 1));
  return <>
    <PageHeading eyebrow={t("demoOnly")} title={t("analyticsTitle")} description={t("analyticsLine")} action={<button className="select-like"><span className="online-mark" /> {t("lastSixMonths")} <ChevronDown size={14} /></button>} />
    <div className="analytics-stats"><div className="panel analytics-stat"><span>Total case records</span><strong>{cases.length}</strong><small>Fictional demo records</small></div><div className="panel analytics-stat"><span>Potential matches</span><strong>{matches.length}</strong><small>Generated by demo engine</small></div><div className="panel analytics-stat"><span>Verified matches</span><strong>{verified}</strong><small>Reviewed by an investigator</small></div><div className="panel analytics-stat"><span>Average similarity</span><strong>{avgScore}<small>%</small></strong><small>Similarity is not identity</small></div></div>
    <div className="dashboard-grid analytics-grid"><section className="panel trend-panel"><div className="panel-header"><div><h2>Case activity over time</h2><p>Reported cases & potential matches</p></div></div><div className="chart-legend"><span><i className="legend-blue" /> Cases reported</span><span><i className="legend-mint" /> Potential matches</span></div><div className="analytics-trend"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{ top: 10, right: 14, left: -15, bottom: 0 }}><CartesianGrid stroke="#edf1f5" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8995a5", fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8995a5", fontSize: 11 }} /><Tooltip contentStyle={{ border: "1px solid #e8edf3", borderRadius: 10 }} /><Area type="monotone" dataKey="cases" name="Cases reported" stroke="#3679c9" strokeWidth={2.3} fill="url(#caseFill)" /><Area type="monotone" dataKey="matched" name="Potential matches" stroke="#52a68a" strokeWidth={2.3} fill="url(#matchFill)" /></AreaChart></ResponsiveContainer></div></section><section className="panel district-panel"><div className="panel-header"><div><h2>Cases by district</h2><p>Demo network distribution</p></div></div><div className="analytics-district"><ResponsiveContainer width="100%" height="100%"><BarChart data={districtData} layout="vertical" margin={{ top: 4, right: 24, left: 2, bottom: 0 }}><CartesianGrid stroke="#eef1f5" horizontal={false} /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#8995a5", fontSize: 10 }} /><YAxis type="category" dataKey="district" axisLine={false} tickLine={false} tick={{ fill: "#5c6a7a", fontSize: 11 }} width={62} /><Tooltip cursor={{ fill: "#f5f8fb" }} /><Bar dataKey="cases" fill="#79a8dd" radius={[0, 5, 5, 0]} barSize={14} /></BarChart></ResponsiveContainer></div></section></div>
    <section className="panel analytics-note"><div className="analytics-note-icon"><ShieldCheck size={18} /></div><div><strong>Interpret with care</strong><p>These charts use fictional demonstration data and are not operational statistics. Match volume and similarity scores do not measure confirmed identities or investigative outcomes.</p></div></section>
    <div className="page-foot"><span><Activity size={13} /> Analytics are aggregated from fictional demo records.</span><span>DEMO DATA · NOT REAL CASE INFORMATION</span></div>
  </>;
}

function AddCaseModal({ onClose, onSave }: { onClose: () => void; onSave: (input: Pick<CaseRecord, "person" | "age" | "gender" | "state" | "district" | "station" | "type" | "mark" | "location">) => void }) {
  const [form, setForm] = useState({ person: "", age: "", gender: "Female", state: "Maharashtra", district: "Pune", station: "", type: "Missing person", mark: "", location: "" });
  const stateDistricts = getDistricts(form.state);
  const [error, setError] = useState("");
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const age = Number(form.age);
    if (!form.person.trim() || !form.station.trim() || !form.location.trim() || !Number.isInteger(age) || age < 0 || age > 120) {
      setError("Enter a name, valid age, police station and last known location.");
      return;
    }
    onSave({ person: form.person.trim(), age, gender: form.gender, state: form.state, district: form.district, station: form.station.trim(), type: form.type, mark: form.mark.trim() || "Not recorded", location: form.location.trim() });
  };
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="add-case-title"><div className="modal-heading"><div><span className="eyebrow">SECURE CASE ENTRY</span><h2 id="add-case-title">Create a case record</h2><p>Use fictional information in this demonstration prototype.</p></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div><form onSubmit={submit}><div className="form-grid"><label className="form-field form-full">Person name<input value={form.person} onChange={(event) => update("person", event.target.value)} placeholder="Enter person’s name" autoFocus /></label><label className="form-field">Age<input type="number" min="0" max="120" value={form.age} onChange={(event) => update("age", event.target.value)} placeholder="Age in years" /></label><label className="form-field">Gender<select value={form.gender} onChange={(event) => update("gender", event.target.value)}><option>Female</option><option>Male</option><option>Other</option><option>Not recorded</option></select></label><label className="form-field">State / UT<select value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value, district: getDistricts(event.target.value)[0] ?? "" }))}>{indiaStatesAndDistricts.map((item) => <option key={item.state}>{item.state}</option>)}</select></label><label className="form-field">District<select value={form.district} onChange={(event) => update("district", event.target.value)}>{stateDistricts.map((district) => <option key={district}>{district}</option>)}</select></label><label className="form-field">Case type<select value={form.type} onChange={(event) => update("type", event.target.value)}><option>Missing person</option><option>Unidentified person</option><option>Suspected trafficking</option><option>Related investigation</option></select></label><label className="form-field form-full">Police station<input value={form.station} onChange={(event) => update("station", event.target.value)} placeholder="Station name" /></label><label className="form-field form-full">Last known location<input value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Area, city or landmark" /></label><label className="form-field form-full">Identifying mark <span className="optional-label">OPTIONAL</span><input value={form.mark} onChange={(event) => update("mark", event.target.value)} placeholder="Distinctive mark or description" /></label></div>{error && <div className="form-error">{error}</div>}<div className="modal-privacy"><ShieldCheck size={15} /> Demo records are stored in this browser only.</div><div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Plus size={16} /> Create case record</button></div></form></div></div>;
}

export default App;
