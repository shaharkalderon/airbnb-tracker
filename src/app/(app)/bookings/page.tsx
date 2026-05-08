import BookingsClient from "./BookingsClient";
import { listBookings } from "./actions";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const bookings = await listBookings();
  return <BookingsClient initial={bookings as never} />;
}
