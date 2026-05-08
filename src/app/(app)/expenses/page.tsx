import LedgerTable from "@/components/LedgerTable";
import { listExpenses, listExpenseCategories, saveExpense, deleteExpense } from "./actions";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [rows, categories] = await Promise.all([listExpenses(), listExpenseCategories()]);
  return (
    <LedgerTable
      title="Expenses"
      amountLabel="Expense"
      rows={rows as never}
      categories={categories}
      onSave={saveExpense}
      onDelete={deleteExpense}
      refetchUrl="/api/expenses"
      amountColor="rose"
    />
  );
}
