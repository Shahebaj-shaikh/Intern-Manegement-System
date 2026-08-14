export const Table = ({ columns, children }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left">
          {columns.map((col) => (
            <th key={col} className="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">{children}</tbody>
    </table>
  </div>
);
