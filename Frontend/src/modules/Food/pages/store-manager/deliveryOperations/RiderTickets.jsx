import RiderTicketsDesk from "@food/components/RiderTicketsDesk"

// Tickets raised by this store's delivery partners (the store manager replies and resolves; the franchise admin closes).
export default function RiderTickets() {
  return <RiderTicketsDesk base="/food/store/rider-tickets" title="Rider Tickets" canClose={false} />
}
