import { RiskArea } from "@/lib/api";

type RiskTableProps = {
  items: RiskArea[];
};

export default function RiskTable({ items }: RiskTableProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Area Risk Scores</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Area</th>
              <th className="py-2 pr-4">Score</th>
              <th className="py-2">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.area_code} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-800">{item.area_code}</td>
                <td className="py-2 pr-4 text-slate-700">{item.score}</td>
                <td className="py-2 text-slate-700">{item.risk_level}</td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className="py-4 text-slate-500" colSpan={3}>
                  No risk data available.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
