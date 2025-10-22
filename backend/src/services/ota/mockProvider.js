import crypto from "crypto"

// Simple mock provider to simulate OTA push/pull/webhook flows
class MockOtaProvider {
  constructor(provider = "mock") {
    this.provider = provider
  }

  // Push rooms/rates/media payload to OTA
  async push(payload) {
    await this.#sleep(200)
    return {
      provider: this.provider,
      status: "success",
      message: `Pushed ${this.#summ(payload)} to provider`,
      providerRequestId: crypto.randomUUID()
    }
  }

  // Pull bookings since cursor/ISO string
  async pullBookings({ since }) {
    await this.#sleep(200)
    // Return a few fake bookings
    const now = new Date().toISOString()
    return {
      provider: this.provider,
      status: "success",
      bookings: [
        {
          externalId: `bk_${Date.now()}`,
          guest: { firstName: "Alex", lastName: "Doe", email: "alex@example.com", phone: "+10000000001" },
          roomNumber: "101",
          roomId: null, // optional
          checkIn: now,
          checkOut: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          adults: 2,
          children: 0,
          totalAmount: 120.0
        }
      ],
      cursor: now
    }
  }

  // Process webhook payload
  async handleWebhook(payload) {
    await this.#sleep(100)
    return { provider: this.provider, status: "received", type: payload?.type || "unknown" }
  }

  #summ(obj) {
    try { return Object.keys(obj || {}).join(",") || "payload" } catch { return "payload" }
  }

  #sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
}

export default new MockOtaProvider("mock")
