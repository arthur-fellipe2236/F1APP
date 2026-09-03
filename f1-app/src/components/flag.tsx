export function Flag({
  src,
  label,
}: {
  src: string | null
  label?: string | null
}) {
  const text = label || "—"
  if (!src) return <span>{text}</span>
  return (
    <span className="flex items-center gap-2">
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover shadow-sm"
      />
      {text}
    </span>
  )
}
