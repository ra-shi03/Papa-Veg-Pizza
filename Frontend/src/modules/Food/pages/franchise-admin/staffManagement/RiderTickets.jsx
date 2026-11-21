import RiderTicketsDesk from "@food/components/RiderTicketsDesk"

// Tickets raised by the delivery partners of this franchise's stores (reply, resolve, close, reopen).
export default function RiderTickets() {
  return <RiderTicketsDesk base="/food/admin/delivery/rider-tickets" title="Rider Tickets" canClose />
}
