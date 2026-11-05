if (!process.env.DEMO_PASSWORD || !process.env.DEMO_STATION_SECRET) {
  throw new Error("Set DEMO_PASSWORD and DEMO_STATION_SECRET before seeding demo data.")
}
