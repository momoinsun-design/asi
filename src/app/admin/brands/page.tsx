import Link from "next/link";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n/server";

export default async function AdminBrandsPage() {
  const t = await getT();
  const brands = await prisma.brand.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, _count: { select: { campaigns: true } } },
  });
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{t.admin.brands.title}</h2>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Vertical</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Campaigns</th>
              <th className="px-4 py-3 text-right">{t.admin.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {brands.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{b.company}</td>
                <td className="px-4 py-3 text-slate-600">{b.user.email}</td>
                <td className="px-4 py-3 text-slate-600">{b.vertical}</td>
                <td className="px-4 py-3 text-slate-600">{money.format(b.budgetUsd)}/mo</td>
                <td className="px-4 py-3 text-slate-600">{b._count.campaigns}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/brands/${b.id}`}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    {t.admin.brands.edit}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
