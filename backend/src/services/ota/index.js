import mock from "./mockProvider.js"
import bookingCom from "./bookingComProvider.js"
import agoda from "./agodaProvider.js"

const registry = {
  mock,
  booking_com: bookingCom,
  booking: bookingCom,
  agoda
}

export function getProvider(name = "mock") {
  const key = String(name || "mock").toLowerCase()
  return registry[key] || mock
}
