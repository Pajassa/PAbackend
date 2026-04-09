export function formatServices(services) {
  if (!services) return "";

  if (typeof services === "string") {
    services = JSON.parse(services);
  }

  const labelMap = {
    wifi: "Wi-fi",
    vegLunch: "Veg Lunch Included",
    vegDinner: "Veg Dinner Included",
    nonVegLunch: "Non Veg Lunch Included",
    nonVegDinner: "Non Veg Dinner Included",
    morningBreakfast: "Morning Breakfast",
  };

  return Object.entries(services)
    .filter(([_, value]) => value)
    .map(([key]) => labelMap[key] || key)
    .join(", ");
}
