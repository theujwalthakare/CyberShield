import { AlertItem } from "@/lib/api";

type AlertsListProps = {
  items: AlertItem[];
};

export default function AlertsList({ items }: AlertsListProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Recent Alerts</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-800">
              {item.alert_type} • {item.severity.toUpperCase()}
            </p>
            <p className="text-sm text-slate-600">{item.area_code}</p>
            <p className="text-sm text-slate-700">{item.message}</p>
          </li>
        ))}
        {items.length === 0 ? <li className="text-sm text-slate-500">No active alerts.</li> : null}
      </ul>
    </div>
  );
}
