// Placeholder Agoda provider that currently reuses the mock behavior.
import mockProvider from "./mockProvider.js"

class AgodaProvider {
  async push(payload) { return mockProvider.push(payload) }
  async pullBookings(args) { return mockProvider.pullBookings(args) }
  async handleWebhook(payload) { return mockProvider.handleWebhook(payload) }
}

export default new AgodaProvider()
