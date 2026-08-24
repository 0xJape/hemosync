export default function SystemLoading({ label = "Synchronizing local systems", countdown }: { label?: string; countdown?: number }) {
  return <div className="system-loading" role="status" aria-live="polite" aria-label={label}>
    <div className="system-loading__panel">
      <div className="system-loading__core"><span/><span/><span/></div>
      <p>{label}</p>
      {countdown !== undefined && <strong className="system-loading__countdown">{countdown}</strong>}
      <div className="system-loading__track"><i/></div>
      <small>HEMOSYNC · STATION 01</small>
    </div>
  </div>;
}
