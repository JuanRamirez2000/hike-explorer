export default function StatRow({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <tr>
      <td className={`text-base-content/50 ${wide ? "w-40" : "w-24"}`}>{label}</td>
      <td className="font-mono">{value}</td>
    </tr>
  );
}
