export default function MediaPlaceholder({ label = 'Фото', compact = false }) {
  return (
    <div className={`relative isolate grid overflow-hidden bg-[#dfe5ed] text-ink/45 ${compact ? 'h-44' : 'aspect-[4/3]'}`} aria-label={`${label} — заглушка`}>
      <div className="absolute inset-y-0 right-[18%] w-px -skew-x-[28deg] bg-signal/20" />
      <div className="absolute inset-y-0 right-[34%] w-px -skew-x-[28deg] bg-signal/15" />
      <div className="absolute bottom-0 right-0 h-24 w-24 border-l-[32px] border-t-[48px] border-l-transparent border-t-signal/10" />
      <span className="relative m-auto border border-ink/15 bg-[#edf1f5] px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em]">
        {label}
      </span>
    </div>
  )
}
