import Link from "next/link";
import { requireRoleSession } from "@/lib/session";
import NewProductForm from "@/components/NewProductForm";

export default async function NewProductPage() {
  await requireRoleSession("ADMIN");

  return (
    <div>
      <Link
        href="/dashboard/inventory"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-950"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to inventory
      </Link>
      <h1 className="mt-2 font-serif text-xl font-semibold tracking-tight text-navy-950 sm:text-2xl">
        Add product
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Create a new product and it will appear in the storefront catalog once saved.
      </p>
      <NewProductForm />
    </div>
  );
}
