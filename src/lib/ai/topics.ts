export interface TopicDefinition {
  id: string;
  name: string;
  icon: string;
  words: string[];
}

export const TOPICS: TopicDefinition[] = [
  {
    id: "greetings",
    name: "Greetings & Basics",
    icon: "👋",
    words: [
      "hello", "goodbye", "please", "thank you", "yes", "no",
      "excuse me", "sorry", "good morning", "good night",
      "how are you", "welcome",
    ],
  },
  {
    id: "food",
    name: "Food & Drinks",
    icon: "🍽️",
    words: [
      "water", "bread", "milk", "coffee", "tea", "rice",
      "chicken", "fish", "fruit", "vegetable", "salt", "sugar",
      "egg", "cheese", "juice",
    ],
  },
  {
    id: "travel",
    name: "Travel & Transport",
    icon: "✈️",
    words: [
      "airport", "train", "bus", "taxi", "hotel", "ticket",
      "passport", "luggage", "map", "station", "flight",
      "reservation", "departure", "arrival",
    ],
  },
  {
    id: "technology",
    name: "Technology",
    icon: "💻",
    words: [
      "computer", "phone", "internet", "email", "password",
      "screen", "keyboard", "website", "application", "data",
      "download", "search", "camera", "message",
    ],
  },
  {
    id: "work",
    name: "Business & Work",
    icon: "💼",
    words: [
      "office", "meeting", "manager", "salary", "project",
      "company", "employee", "customer", "contract", "deadline",
      "team", "schedule", "budget",
    ],
  },
  {
    id: "health",
    name: "Health & Body",
    icon: "🏥",
    words: [
      "doctor", "hospital", "medicine", "head", "hand", "eye",
      "pain", "fever", "appointment", "pharmacy", "sleep",
      "exercise", "healthy",
    ],
  },
  {
    id: "home",
    name: "Home & Family",
    icon: "🏠",
    words: [
      "house", "room", "kitchen", "bathroom", "door", "window",
      "mother", "father", "child", "family", "bed", "table",
      "chair", "garden",
    ],
  },
  {
    id: "nature",
    name: "Nature & Weather",
    icon: "🌿",
    words: [
      "sun", "rain", "wind", "snow", "tree", "flower", "sea",
      "mountain", "sky", "cloud", "hot", "cold", "weather",
    ],
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "🛍️",
    words: [
      "store", "price", "money", "buy", "sell", "cheap",
      "expensive", "cash", "credit card", "receipt", "discount",
      "size", "color",
    ],
  },
  {
    id: "time",
    name: "Time & Numbers",
    icon: "🕐",
    words: [
      "today", "tomorrow", "yesterday", "morning", "evening",
      "night", "week", "month", "year", "hour", "minute",
      "early", "late",
    ],
  },
];
