import LedgerTable from "@/components/LedgerTable";
import { listIncome, listIncomeCategories, saveIncome, deleteIncome } from "./actions";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const [rows, categories] = await Promise.all([listIncome(), listIncomeCategories()]);
  return (
    <LedgerTable
      title="Income"
      amountLabel="Income"
      rows={rows as never}
      categories={categories}
      onSave={saveIncome}
      onDelete={deleteIncome}
      refetchUrl="/api/income"
      amountColor="emerald"
    />
  );
}
