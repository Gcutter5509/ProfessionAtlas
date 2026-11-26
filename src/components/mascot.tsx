/**
 * Персонаж-проводник атласа: дедушка с облаком седых волос, в очках и полосатом шарфе.
 * Плоская векторная иллюстрация по образцу из Gemini.
 *  - "curious" — вопросительный взгляд (баннер с тестом);
 *  - "blindfold" — с завязанными глазами, без очков (случайная профессия).
 */

const SKIN = "#9C5C47";
const HAIR = "#F2EDE3";
const DARK = "#45272A";
const COAT = "#9A9490";
/** Шарф и повязка — коралловые с жёлтыми полосами, чтобы выделяться на синем фоне баннеров */
const CORAL = "#E2604A";
const CORAL_DARK = "#B8453A";
const YELLOW = "#F4C95D";

const HAIR_PUFFS: [number, number, number][] = [
  [186, 56, 28], [240, 66, 30], [276, 90, 24], [284, 128, 26], [270, 160, 24], [250, 150, 25],
  [143, 72, 26], [122, 98, 22], [118, 132, 22], [126, 158, 18], [200, 100, 60], [245, 120, 40],
  // закрывают просветы между облачками: над лбом слева и за ухом справа
  [138, 118, 22], [132, 142, 16], [274, 204, 17],
];

function Stripes({ d, width }: { d: string; width: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={CORAL} strokeWidth={width} strokeLinecap="round" />
      <path d={d} fill="none" stroke={YELLOW} strokeWidth={width} strokeDasharray="34 30" />
    </>
  );
}

function Glasses() {
  return (
    <g fill="none" stroke={DARK}>
      <rect x="121" y="178" width="38" height="27" rx="7" strokeWidth="5" />
      <rect x="175" y="178" width="39" height="27" rx="7" strokeWidth="5" />
      <path d="M159,186 Q167,181 175,186" strokeWidth="4" />
      <path d="M214,184 L250,168" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

export function Mascot({ variant, className }: { variant: "curious" | "blindfold"; className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      {/* пальто и шарф */}
      <path d="M104,312 Q122,286 150,284 L292,236 Q342,258 356,288 L384,410 L86,410 Z" fill={COAT} />
      <path d="M252,232 Q290,220 300,248 L296,262 L250,262 Z" fill={CORAL_DARK} />
      <Stripes d="M146,330 L140,420" width={42} />
      <Stripes d="M266,262 Q252,330 240,420" width={42} />
      <Stripes d="M124,316 Q168,358 224,322 Q270,292 292,232" width={44} />

      {/* волосы */}
      {HAIR_PUFFS.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={HAIR} />
      ))}

      {/* затылок и шея за ухом — чтобы между лицом, ухом и волосами не просвечивал фон */}
      <ellipse cx="258" cy="160" rx="30" ry="42" fill={HAIR} />

      {/* голова */}
      <path d="M180,250 L230,168 L264,186 L282,214 L278,244 L246,292 L186,300 Z" fill={SKIN} />
      <ellipse cx="254" cy="188" rx="13" ry="23" fill={SKIN} />
      <path
        d="M147,128 Q188,123 222,124 Q231,127 229,141 L228,150 L237,162 L237,214 Q232,258 206,282 L152,282 Q131,242 131,190 Q133,150 147,128 Z"
        fill={SKIN}
      />
      <path
        d="M137,234 Q156,214 186,218 Q212,214 228,206 L230,176 L238,166 Q252,196 246,238 Q238,284 204,298 Q172,306 152,292 Q134,274 137,234 Z"
        fill={HAIR}
      />
      <path
        d="M150,234 Q175,229 200,234 Q201,247 192,256 L186,258 Q182,249 177,247 L172,247 Q166,249 161,258 L155,256 Q149,247 150,234 Z"
        fill={SKIN}
      />
      <path d="M159,245 L190,245 Q189,252 182,252 L167,252 Q160,252 159,245 Z" fill={HAIR} />

      {variant === "curious" ? (
        <>
          {/* одна бровь поднята, взгляд вверх-вправо */}
          <path d="M128,163 L157,160 L158,171 L126,174 Z" fill={DARK} />
          <path d="M178,150 Q196,140 214,146 L218,155 Q198,150 180,160 Z" fill={DARK} />
          <ellipse cx="151" cy="186" rx="4" ry="6" fill={DARK} />
          <ellipse cx="202" cy="185" rx="4" ry="6" fill={DARK} />
          <Glasses />
          <text x="312" y="92" fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize="64" fill={YELLOW}>
            ?
          </text>
          <text
            x="292"
            y="40"
            fontFamily="Inter, Arial, sans-serif"
            fontWeight="800"
            fontSize="34"
            fill={HAIR}
            transform="rotate(12 300 30)"
          >
            ?
          </text>
        </>
      ) : (
        <>
          {/* повязка на глазах с узлом за ухом */}
          <path d="M126,160 Q190,150 252,158 L254,190 Q190,182 126,194 Z" fill={CORAL} />
          <path d="M126,172 Q190,164 253,170 L253,178 Q190,172 126,182 Z" fill={YELLOW} />
          <path d="M252,170 Q280,150 300,140 L304,154 Q284,164 258,178 Z" fill={CORAL} />
          <path d="M254,176 Q284,186 300,204 L290,212 Q276,196 252,184 Z" fill={CORAL} />
          <circle cx="254" cy="174" r="9" fill={CORAL_DARK} />
        </>
      )}
    </svg>
  );
}
