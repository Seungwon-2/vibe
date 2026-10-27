export function CountdownOverlay({ value }: { value: number }): React.JSX.Element | null {
  if (value <= 0) return null;
  return (
    <div className="runner-countdown" role="status" aria-live="assertive" aria-label={`${value}초 후 시작`}>
      <span>준비하세요</span>
      <strong key={value}>{value}</strong>
    </div>
  );
}
