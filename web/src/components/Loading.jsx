import Logo from "./Logo";

// Skeleton placeholders shaped like the page that is loading, so content
// slides into place instead of replacing a spinner.

function Bar({ w = "100%", h = 12, style }) {
  return <span className="skeleton" style={{ width: w, height: h, ...style }} />;
}

function HeadingSkeleton() {
  return (
    <div className="sk-heading">
      <Bar w={220} h={28} />
      <Bar w={320} h={13} />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="sk-row">
      <span className="skeleton sk-icon" />
      <div className="sk-lines">
        <Bar w="45%" h={13} />
        <Bar w="25%" h={10} />
      </div>
      <Bar w={64} h={20} />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="sk-card">
      <span className="skeleton sk-icon" />
      <Bar w="60%" h={15} />
      <Bar w="90%" h={10} />
      <Bar w="70%" h={10} />
    </div>
  );
}

const LAYOUTS = {
  list: () => (
    <>
      <HeadingSkeleton />
      <div className="sk-stack">
        {Array.from({ length: 5 }, (_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </>
  ),
  grid: () => (
    <>
      <HeadingSkeleton />
      <div className="sk-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </>
  ),
  dashboard: () => (
    <>
      <HeadingSkeleton />
      <div className="sk-stats">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="sk-card sk-stat" key={i}>
            <Bar w="50%" h={11} />
            <Bar w="35%" h={26} />
          </div>
        ))}
      </div>
      <div className="sk-stack">
        {Array.from({ length: 3 }, (_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </>
  ),
  detail: () => (
    <>
      <Bar w={110} h={11} />
      <HeadingSkeleton />
      <div className="sk-tabs">
        <Bar w={70} h={12} />
        <Bar w={90} h={12} />
        <Bar w={100} h={12} />
      </div>
      <div className="sk-card sk-block">
        <Bar w="30%" h={15} />
        <Bar w="95%" />
        <Bar w="88%" />
        <Bar w="60%" />
      </div>
    </>
  ),
  board: () => (
    <>
      <HeadingSkeleton />
      <div className="sk-board">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="sk-column" key={i}>
            <Bar w="50%" h={13} />
            {Array.from({ length: 3 - (i % 2) }, (_, j) => (
              <div className="sk-card" key={j}>
                <Bar w={52} h={16} />
                <Bar w="80%" h={13} />
                <Bar w="40%" h={10} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  ),
};

export default function Loading({ text = "Loading…", variant = "list" }) {
  const Layout = LAYOUTS[variant] || LAYOUTS.list;

  return (
    <div className="page-skeleton" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{text}</span>
      <Layout />
    </div>
  );
}

// Full-screen splash while a saved session is being restored.
export function BootScreen({ text = "Signing you in…" }) {
  return (
    <div className="boot-screen" role="status" aria-live="polite">
      <Logo size="xl" className="boot-logo" />
      <div className="boot-bar">
        <span />
      </div>
      <p>{text}</p>
    </div>
  );
}

// Small inline spinner for buttons and inline saves.
export function Spinner({ size = 16 }) {
  return (
    <span
      className="inline-spinner"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
