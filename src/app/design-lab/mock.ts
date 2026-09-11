/**
 * Safe mock data for the Design Lab. Every name, business, amount and count
 * here is fictional and exists only to render the prototypes. Nothing reads
 * or writes the database.
 */
export const ASSET = (id: string, ext = "jpg") => `/design-lab/${id}.${ext}`;

export const mock = {
  person: { name: "Maya Okafor", username: "mayaok", city: "Raleigh, NC", earned: 1240, completed: 9, rating: 4.9, instagram: { handle: "mayaok", followers: 3200 }, vehicle: { label: "2019 Honda Civic", color: "Silver", zones: ["Rear window", "Doors"] } },
  opportunities: {
    recreate: { business: "Grounded Coffee", city: "Raleigh", pay: 75, title: "Morning pour, your way", spots: 3, deadline: "Sep 24" },
    story: { business: "PureBloom Skincare", city: "Durham", pay: 40, hours: 24, minFollowers: 1000 },
    car: { business: "Blue Ridge Plumbing", city: "Raleigh", payPerMonth: 110, zones: ["Rear window"], durationDays: 30 },
  },
  business: { name: "Grounded Coffee", category: "Coffee shop", city: "Raleigh, NC" },
};
