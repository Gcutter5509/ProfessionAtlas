import type { KlimovType } from "@/data/klimov";
import type { Sphere } from "@/data/professions";

/**
 * Собственные векторные иллюстрации: у каждой сферы свой цвет и своя сцена,
 * чтобы карточки и страницы не сливались. Картинки рисуются прямо в SVG —
 * не нужны внешние файлы, одинаково хорошо смотрятся в светлой и тёмной теме.
 */

type Theme = { from: string; to: string; ink: string };
type Scene = "laptop" | "heart" | "book" | "gears" | "chart" | "palette" | "scales" | "crane" | "truck" | "cloche" | "sprout" | "atom" | "people" | "sheet";

export const SPHERE_THEME: Record<Sphere, Theme & { scene: Scene }> = {
  "IT и цифровые технологии": { from: "#4f46e5", to: "#06b6d4", ink: "#312e81", scene: "laptop" },
  "Медицина и здоровье": { from: "#e11d48", to: "#fb7185", ink: "#881337", scene: "heart" },
  Образование: { from: "#f59e0b", to: "#f97316", ink: "#7c2d12", scene: "book" },
  "Инженерия и производство": { from: "#475569", to: "#0ea5e9", ink: "#0f172a", scene: "gears" },
  "Бизнес и финансы": { from: "#059669", to: "#34d399", ink: "#064e3b", scene: "chart" },
  "Творчество и медиа": { from: "#c026d3", to: "#f472b6", ink: "#701a75", scene: "palette" },
  "Право и государство": { from: "#1e3a8a", to: "#6366f1", ink: "#172554", scene: "scales" },
  "Строительство и архитектура": { from: "#ea580c", to: "#facc15", ink: "#7c2d12", scene: "crane" },
  "Транспорт и логистика": { from: "#0284c7", to: "#22d3ee", ink: "#0c4a6e", scene: "truck" },
  "Сервис и туризм": { from: "#db2777", to: "#f59e0b", ink: "#831843", scene: "cloche" },
  "Природа и аграрный сектор": { from: "#16a34a", to: "#84cc16", ink: "#14532d", scene: "sprout" },
  Наука: { from: "#7c3aed", to: "#2dd4bf", ink: "#3b0764", scene: "atom" },
};

export const KLIMOV_THEME: Record<KlimovType, Theme & { scene: Scene }> = {
  N: { from: "#16a34a", to: "#84cc16", ink: "#14532d", scene: "sprout" },
  T: { from: "#475569", to: "#0ea5e9", ink: "#0f172a", scene: "gears" },
  H: { from: "#e11d48", to: "#f59e0b", ink: "#881337", scene: "people" },
  S: { from: "#4f46e5", to: "#06b6d4", ink: "#312e81", scene: "sheet" },
  A: { from: "#c026d3", to: "#f472b6", ink: "#701a75", scene: "palette" },
};

/** Цвет сферы для текста: подмешан цвет темы, чтобы читался и на светлом, и на тёмном фоне */
export const textColor = (t: Theme) => `color-mix(in srgb, ${t.from} 70%, var(--foreground))`;

/**
 * Цвет сферы для обёртки с классом `sphere-accent` (см. globals.css): внутри неё
 * акцентные цвета сайта (--accent, --accent-soft) берутся из гаммы картинки, и кнопки,
 * полосы, рамки и плашки перекрашиваются автоматически. Берём середину градиента.
 */
export function accentVars(t: Theme): React.CSSProperties {
  return { "--sphere": `color-mix(in srgb, ${t.from} 60%, ${t.to})` } as React.CSSProperties;
}

export const gradient = (t: Theme, angle = 135) => `linear-gradient(${angle}deg, ${t.from}, ${t.to})`;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function SphereArt({
  sphere,
  seed,
  className = "",
  bare,
}: {
  sphere: Sphere;
  seed?: string;
  className?: string;
  /** только фон без рисунка — для баннеров с текстом поверх */
  bare?: boolean;
}) {
  const t = SPHERE_THEME[sphere];
  return <Art theme={t} scene={bare ? null : t.scene} seed={seed ?? sphere} className={className} />;
}

export function KlimovArt({ type, seed, className = "" }: { type: KlimovType; seed?: string; className?: string }) {
  const t = KLIMOV_THEME[type];
  return <Art theme={t} scene={t.scene} seed={seed ?? type} className={className} />;
}

function Art({ theme, scene, seed, className }: { theme: Theme; scene: Scene | null; seed: string; className: string }) {
  const h = hash(seed);
  // Фоновые круги смещаются в зависимости от профессии — у каждой карточки свой рисунок
  const bubbles = [0, 1, 2].map((i) => {
    const v = (h >>> (i * 9)) & 511;
    return { cx: (v * 37) % 200, cy: (v * 13) % 120, r: 18 + (v % 30) };
  });
  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} overflow-hidden ${className}`} style={{ background: gradient(theme) }} aria-hidden>
      <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
        {bubbles.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill="#fff" opacity={0.1} />
        ))}
        <circle cx={(h % 180) + 10} cy={((h >>> 5) % 100) + 10} r={2} fill="#fff" opacity={0.6} />
        <circle cx={((h >>> 3) % 180) + 10} cy={((h >>> 11) % 100) + 10} r={1.5} fill="#fff" opacity={0.6} />
        {scene && (
          <g className="art-float">
            <SceneShape scene={scene} ink={theme.ink} accent={theme.to} />
          </g>
        )}
      </svg>
    </div>
  );
}

function gear(cx: number, cy: number, r: number, teeth: number) {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const rr = i % 4 < 2 ? r : r * 0.78;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return pts.join(" ");
}

function SceneShape({ scene, ink, accent }: { scene: Scene; ink: string; accent: string }) {
  const W = "#fff";
  switch (scene) {
    case "laptop":
      return (
        <>
          <rect x={62} y={28} width={76} height={50} rx={5} fill={W} />
          <rect x={68} y={34} width={64} height={38} rx={2} fill={ink} />
          <rect x={73} y={40} width={18} height={3} rx={1.5} fill={accent} />
          <rect x={94} y={40} width={22} height={3} rx={1.5} fill={W} opacity={0.7} />
          <rect x={79} y={47} width={28} height={3} rx={1.5} fill="#facc15" />
          <rect x={79} y={54} width={16} height={3} rx={1.5} fill={W} opacity={0.7} />
          <rect x={98} y={54} width={20} height={3} rx={1.5} fill={accent} />
          <rect x={73} y={61} width={12} height={3} rx={1.5} fill={accent} />
          <path d="M50 80h100l-7 9H57z" fill={W} opacity={0.92} />
        </>
      );
    case "heart":
      return (
        <>
          <path d="M100 96C58 70 60 34 84 34c9 0 14 6 16 11 2-5 7-11 16-11 24 0 26 36-16 62z" fill={W} />
          <polyline
            points="58,64 80,64 87,50 96,78 104,56 110,64 142,64"
            fill="none"
            stroke={ink}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M146 26h6v6h6v6h-6v6h-6v-6h-6v-6h6z" fill={W} opacity={0.85} />
        </>
      );
    case "book":
      return (
        <>
          <path d="M100 18l30 10-30 10-30-10z" fill={ink} />
          <path d="M84 33v8c8 5 24 5 32 0v-8l-16 5z" fill={ink} />
          <path d="M130 28v14" stroke={ink} strokeWidth={2} />
          <circle cx={130} cy={44} r={3} fill="#facc15" />
          <path d="M100 56c-12-8-28-8-40-4v42c12-4 28-4 40 4z" fill={W} />
          <path d="M100 56c12-8 28-8 40-4v42c-12-4-28-4-40 4z" fill={W} opacity={0.85} />
          {[64, 72, 80].map((y) => (
            <g key={y} stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.35}>
              <path d={`M68 ${y - 2}q14-3 26 1`} />
              <path d={`M106 ${y - 1}q12-4 26-1`} />
            </g>
          ))}
        </>
      );
    case "gears":
      return (
        <>
          <polygon points={gear(84, 62, 28, 10)} fill={W} />
          <circle cx={84} cy={62} r={10} fill={ink} />
          <polygon points={gear(126, 44, 18, 8)} fill={W} opacity={0.85} />
          <circle cx={126} cy={44} r={6} fill={ink} />
          <polygon points={gear(128, 84, 13, 7)} fill="#facc15" />
          <circle cx={128} cy={84} r={4} fill={ink} />
        </>
      );
    case "chart":
      return (
        <>
          {[
            [62, 24],
            [82, 36],
            [102, 48],
            [122, 62],
          ].map(([x, hgt]) => (
            <rect key={x} x={x} y={94 - hgt} width={14} height={hgt} rx={3} fill={W} opacity={0.9} />
          ))}
          <polyline points="56,66 80,52 100,58 138,26" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M128 24l12-2-2 12z" fill={ink} />
          <circle cx={148} cy={74} r={12} fill="#facc15" />
          <circle cx={148} cy={74} r={7} fill="none" stroke="#ca8a04" strokeWidth={2} />
          <path d="M56 96h92" stroke={W} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case "palette":
      return (
        <>
          <path d="M100 26c-30 0-50 18-50 37s16 31 35 31c8 0 9-6 6-11s0-10 8-10h13c22 0 38-8 38-23s-21-24-50-24z" fill={W} />
          <circle cx={76} cy={54} r={7} fill="#facc15" />
          <circle cx={96} cy={42} r={7} fill="#22d3ee" />
          <circle cx={120} cy={44} r={7} fill={ink} />
          <circle cx={136} cy={58} r={6} fill="#34d399" />
          <circle cx={78} cy={76} r={6} fill={accent} />
          <path d="M150 22l-34 40" stroke={ink} strokeWidth={5} strokeLinecap="round" />
          <path d="M116 62c-6 2-8 8-12 10 6 2 14 0 16-6z" fill={ink} />
        </>
      );
    case "scales":
      return (
        <>
          <rect x={97} y={30} width={6} height={58} rx={2} fill={W} />
          <rect x={76} y={86} width={48} height={7} rx={3.5} fill={W} />
          <rect x={58} y={33} width={84} height={5} rx={2.5} fill={W} />
          <circle cx={100} cy={30} r={6} fill="#facc15" />
          <g stroke={W} strokeWidth={1.5}>
            <path d="M64 38l-10 26M64 38l10 26M136 38l-10 22M136 38l10 22" />
          </g>
          <path d="M50 64h28a14 10 0 0 1-28 0z" fill={W} opacity={0.9} />
          <path d="M122 60h28a14 10 0 0 1-28 0z" fill={W} opacity={0.9} />
          <path d="M60 64l4-6 4 6z" fill={ink} />
        </>
      );
    case "crane":
      return (
        <>
          <rect x={98} y={50} width={44} height={46} rx={2} fill={W} />
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <rect key={`${r}${c}`} x={104 + c * 13} y={56 + r * 13} width={7} height={8} rx={1} fill={ink} opacity={0.75} />
            )),
          )}
          <rect x={66} y={22} width={6} height={74} fill={W} opacity={0.95} />
          <rect x={56} y={22} width={76} height={5} fill={W} />
          <rect x={54} y={27} width={12} height={9} fill={ink} />
          <path d="M122 27v18" stroke={W} strokeWidth={1.5} />
          <rect x={116} y={44} width={12} height={6} fill="#facc15" />
          <path d="M69 22l10-10M69 12v10" stroke={W} strokeWidth={2} />
          <path d="M52 96h96" stroke={W} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case "truck":
      return (
        <>
          <rect x={46} y={44} width={66} height={38} rx={4} fill={W} />
          <path d="M114 54h18l14 14v14h-32z" fill={W} opacity={0.92} />
          <path d="M119 58h11l9 10h-20z" fill={ink} opacity={0.8} />
          <rect x={54} y={52} width={28} height={4} rx={2} fill={accent} />
          {[64, 96, 132].map((x) => (
            <g key={x}>
              <circle cx={x} cy={84} r={9} fill={ink} />
              <circle cx={x} cy={84} r={3.5} fill={W} />
            </g>
          ))}
          <path d="M30 100h140" stroke={W} strokeWidth={3} strokeDasharray="12 8" strokeLinecap="round" opacity={0.7} />
        </>
      );
    case "cloche":
      return (
        <>
          <path d="M62 82a38 34 0 0 1 76 0z" fill={W} />
          <path d="M74 70a28 26 0 0 1 16-20" stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.35} />
          <circle cx={100} cy={45} r={5} fill={ink} />
          <rect x={52} y={82} width={96} height={7} rx={3.5} fill={W} opacity={0.92} />
          <path d="M150 30l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#facc15" />
          <path d="M52 36l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill={W} />
        </>
      );
    case "sprout":
      return (
        <>
          <circle cx={146} cy={32} r={13} fill="#facc15" />
          <g stroke="#facc15" strokeWidth={2.5} strokeLinecap="round">
            <path d="M146 12v-4M146 56v-4M126 32h-4M170 32h-4M132 18l-3-3M163 49l-3-3M160 18l3-3" />
          </g>
          <path d="M100 94V56" stroke={W} strokeWidth={5} strokeLinecap="round" />
          <path d="M100 68c-4-17-21-23-36-19 2 15 17 23 36 19z" fill={W} />
          <path d="M100 58c4-19 23-25 40-21-2 17-19 25-40 21z" fill={W} opacity={0.88} />
          <path d="M100 60c-6-4-16-6-26-3" stroke={ink} strokeWidth={1.5} fill="none" opacity={0.4} />
          <rect x={58} y={92} width={84} height={8} rx={4} fill={ink} opacity={0.55} />
        </>
      );
    case "atom":
      return (
        <>
          {[0, 60, 120].map((a) => (
            <ellipse key={a} cx={100} cy={60} rx={42} ry={15} fill="none" stroke={W} strokeWidth={3} transform={`rotate(${a} 100 60)`} />
          ))}
          <circle cx={100} cy={60} r={8} fill={ink} stroke={W} strokeWidth={2} />
          <circle cx={142} cy={60} r={4} fill="#facc15" />
          <circle cx={79} cy={23.6} r={4} fill="#facc15" />
          <circle cx={79} cy={96.4} r={4} fill={W} />
        </>
      );
    case "people":
      return (
        <>
          <circle cx={80} cy={46} r={12} fill={W} />
          <path d="M58 96c0-16 10-27 22-27s22 11 22 27z" fill={W} />
          <circle cx={122} cy={52} r={10} fill={W} opacity={0.88} />
          <path d="M103 96c0-13 8-23 19-23s19 10 19 23z" fill={W} opacity={0.88} />
          <rect x={112} y={16} width={36} height={20} rx={7} fill={W} />
          <path d="M120 36l-2 7 9-7z" fill={W} />
          {[122, 130, 138].map((x) => (
            <circle key={x} cx={x} cy={26} r={2.2} fill={ink} />
          ))}
        </>
      );
    case "sheet":
      return (
        <>
          <rect x={62} y={20} width={76} height={80} rx={6} fill={W} />
          <rect x={62} y={20} width={76} height={14} rx={6} fill={ink} />
          <rect x={62} y={28} width={76} height={6} fill={ink} />
          {[0, 1, 2, 3].map((r) => (
            <g key={r}>
              <rect x={70} y={42 + r * 11} width={18} height={5} rx={2} fill={ink} opacity={0.3} />
              <rect x={92} y={42 + r * 11} width={[26, 16, 30, 20][r]} height={5} rx={2} fill={accent} opacity={0.8} />
            </g>
          ))}
          <text x={146} y={52} fontSize={22} fontWeight={700} fill={W} fontFamily="sans-serif">
            ∑
          </text>
          <text x={36} y={84} fontSize={16} fontWeight={700} fill={W} fontFamily="monospace" opacity={0.85}>
            {"{ }"}
          </text>
        </>
      );
  }
}
