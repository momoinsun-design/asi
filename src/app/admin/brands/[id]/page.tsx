import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { BrandForm } from "../brand-form";
import { getT } from "@/lib/i18n/server";

export default async function AdminBrandEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getT();
  const { id } = await params;
  const brand = await prisma.brand.findUnique({ where: { id }, include: { user: true } });
  if (!brand) redirect("/admin/brands");

  return (
    <div>
      <Link href="/admin/brands" className="text-sm text-brand-600 hover:underline">
        {t.admin.common.back}
      </Link>
      <h2 className="mb-1 mt-2 text-xl font-semibold text-slate-900">
        {t.admin.brands.formTitle}
      </h2>
      <p className="mb-4 text-sm text-slate-500">{brand.user.email}</p>
      <BrandForm
        initial={{
          id: brand.id,
          company: brand.company,
          vertical: brand.vertical,
          budgetUsd: brand.budgetUsd,
          goals: brand.goals,
        }}
      />
    </div>
  );
}
