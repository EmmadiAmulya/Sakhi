export interface PhaseContent {
  title: string;
  focus: string;
  energy: string;
  nutrition: string;
  exercise: string;
  selfCare: string;
}

export const PHASE_CONTENT: Record<"menstrual" | "follicular" | "ovulatory" | "luteal", PhaseContent> = {
  menstrual: {
    title: "Time for Rest & Grounding",
    focus: "Introspection, journaling, clarifying goals, and inner reflection.",
    energy: "Lowest energy levels. Your body is expending resources on shedding the uterine lining.",
    nutrition: "Iron-rich foods (spinach, lentils, red meat), warm herbal teas (ginger, raspberry leaf), and magnesium-rich foods.",
    exercise: "Rest, gentle yin yoga, light walking, and restorative stretching. Avoid heavy lifting.",
    selfCare: "Warm baths, hot water bottles on the abdomen, early bedtime, and giving yourself permission to slow down.",
  },
  follicular: {
    title: "Focus, Creativity & Planning",
    focus: "Brainstorming, starting new projects, learning skills, and structuring complex tasks.",
    energy: "Rising estrogen levels boost physical stamina, cognitive sharpness, and social drive.",
    nutrition: "Light, fresh, fermented foods (kimchi, sauerkraut), complex carbs, broccoli, sprouts, and healthy fats.",
    exercise: "Cardio workouts, strength training, and moderate hikes. Great time to ramp up intensity.",
    selfCare: "Schedule social meetings, try out creative projects, and explore new pathways.",
  },
  ovulatory: {
    title: "Peak Energy & Social Connection",
    focus: "Public speaking, presentations, negotiation, dating, and community events.",
    energy: "Highest energy, confidence, and verbal fluency. Estrogen and LH peak.",
    nutrition: "Hydrating raw foods, colorful berries, quinoa, light proteins, and fiber-rich greens to support liver estrogen detoxification.",
    exercise: "High-intensity interval training (HIIT), heavy lifting, power yoga, and group fitness classes.",
    selfCare: "Say yes to social gathers, host dinners, or treat yourself to active outdoor adventures.",
  },
  luteal: {
    title: "Winding Down & Nesting",
    focus: "Closing projects, organizing, filing details, domestic chores, and nesting.",
    energy: "Winding down as progesterone rises. Stamina decreases; you may feel more reflective or sensitive.",
    nutrition: "Warm, cooked, grounding root vegetables (sweet potatoes, squash), seeds (sesame, sunflower), and complex grains.",
    exercise: "Pilates, moderate strength training, longer walks, and relaxing flows. Listen to your body.",
    selfCare: "Clean your space, practice boundary setting, journal before sleep, and brew warm chamomile teas.",
  },
};
