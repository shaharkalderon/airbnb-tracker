import { listBookings } from "../bookings/actions";
import { listIncome, listIncomeCategories } from "../income/actions";
import { listExpenses, listExpenseCategories } from "../expenses/actions";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [bookings, income, expenses, incomeCats, expenseCats] = await Promise.all([
    listBookings(),
    listIncome(),
    listExpenses(),
    listIncomeCategories(),
    listExpenseCategories(),
  ]);
  return (
    <AdminClient
      initialBookings={bookings ?? []}
      initialIncome={income ?? []}
      initialExpenses={expenses ?? []}
      incomeCategories={incomeCats}
      expenseCategories={expenseCats}
    />
  );
}
