// Placeholder Booking.com provider that currently reuses the mock behavior.
// Swap implementations later to call real Booking.com APIs.
import mockProvider from "./mockProvider.js"

class BookingComProvider {
  async push(payload) { return mockProvider.push(payload) }
  async pullBookings(args) { return mockProvider.pullBookings(args) }
  async handleWebhook(payload) { return mockProvider.handleWebhook(payload) }
}

export default new BookingComProvider()
