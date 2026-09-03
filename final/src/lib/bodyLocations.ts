// Body location taxonomy: key -> { label, group, frontBack, x%, y% on SVG }
export type BodySide = "front" | "back";

export interface BodyLocation {
  key: string;
  label: string;
  group: string;
  side: BodySide;
  x: number; // % on 200x500 SVG
  y: number;
}

export const BODY_LOCATIONS: BodyLocation[] = [
  // FACE / SCALP / NECK (front)
  { key: "scalp", label: "Scalp / Top of head", group: "Face & Scalp", side: "front", x: 50, y: 4 },
  { key: "forehead", label: "Forehead", group: "Face & Scalp", side: "front", x: 50, y: 8 },
  { key: "face_cheek_left", label: "Left cheek", group: "Face & Scalp", side: "front", x: 45, y: 11 },
  { key: "face_cheek_right", label: "Right cheek", group: "Face & Scalp", side: "front", x: 55, y: 11 },
  { key: "nose", label: "Nose", group: "Face & Scalp", side: "front", x: 50, y: 11 },
  { key: "ear_left", label: "Left ear", group: "Face & Scalp", side: "front", x: 41, y: 10 },
  { key: "ear_right", label: "Right ear", group: "Face & Scalp", side: "front", x: 59, y: 10 },
  { key: "chin", label: "Chin / jaw", group: "Face & Scalp", side: "front", x: 50, y: 15 },
  { key: "neck_front", label: "Neck (front)", group: "Neck", side: "front", x: 50, y: 18 },
  { key: "neck_back", label: "Neck (back)", group: "Neck", side: "back", x: 50, y: 9 },

  // CHEST / TORSO (front)
  { key: "chest_left", label: "Left chest", group: "Chest", side: "front", x: 44, y: 25 },
  { key: "chest_right", label: "Right chest", group: "Chest", side: "front", x: 56, y: 25 },
  { key: "abdomen", label: "Abdomen", group: "Chest", side: "front", x: 50, y: 34 },
  { key: "groin", label: "Groin area", group: "Chest", side: "front", x: 50, y: 44 },

  // BACK
  { key: "back_upper_left", label: "Upper back (left)", group: "Back", side: "back", x: 44, y: 23 },
  { key: "back_upper_right", label: "Upper back (right)", group: "Back", side: "back", x: 56, y: 23 },
  { key: "back_lower_left", label: "Lower back (left)", group: "Back", side: "back", x: 44, y: 36 },
  { key: "back_lower_right", label: "Lower back (right)", group: "Back", side: "back", x: 56, y: 36 },
  { key: "buttocks_left", label: "Left buttock", group: "Back", side: "back", x: 45, y: 47 },
  { key: "buttocks_right", label: "Right buttock", group: "Back", side: "back", x: 55, y: 47 },

  // ARMS (front)
  { key: "shoulder_left", label: "Left shoulder", group: "Arms", side: "front", x: 36, y: 22 },
  { key: "shoulder_right", label: "Right shoulder", group: "Arms", side: "front", x: 64, y: 22 },
  { key: "left_arm_upper", label: "Left upper arm", group: "Arms", side: "front", x: 32, y: 30 },
  { key: "right_arm_upper", label: "Right upper arm", group: "Arms", side: "front", x: 68, y: 30 },
  { key: "left_arm_forearm", label: "Left forearm", group: "Arms", side: "front", x: 28, y: 40 },
  { key: "right_arm_forearm", label: "Right forearm", group: "Arms", side: "front", x: 72, y: 40 },
  { key: "left_elbow", label: "Left elbow (back)", group: "Arms", side: "back", x: 28, y: 36 },
  { key: "right_elbow", label: "Right elbow (back)", group: "Arms", side: "back", x: 72, y: 36 },

  // HANDS
  { key: "left_hand", label: "Left hand", group: "Hands", side: "front", x: 24, y: 48 },
  { key: "right_hand", label: "Right hand", group: "Hands", side: "front", x: 76, y: 48 },

  // LEGS (front)
  { key: "left_thigh", label: "Left thigh", group: "Legs", side: "front", x: 45, y: 55 },
  { key: "right_thigh", label: "Right thigh", group: "Legs", side: "front", x: 55, y: 55 },
  { key: "left_knee", label: "Left knee", group: "Legs", side: "front", x: 45, y: 67 },
  { key: "right_knee", label: "Right knee", group: "Legs", side: "front", x: 55, y: 67 },
  { key: "left_shin", label: "Left shin", group: "Legs", side: "front", x: 45, y: 77 },
  { key: "right_shin", label: "Right shin", group: "Legs", side: "front", x: 55, y: 77 },
  { key: "left_calf", label: "Left calf (back)", group: "Legs", side: "back", x: 45, y: 75 },
  { key: "right_calf", label: "Right calf (back)", group: "Legs", side: "back", x: 55, y: 75 },

  // FEET
  { key: "left_foot", label: "Left foot", group: "Feet", side: "front", x: 45, y: 92 },
  { key: "right_foot", label: "Right foot", group: "Feet", side: "front", x: 55, y: 92 },

  // OTHER
  { key: "other", label: "Other / not listed", group: "Other", side: "front", x: 50, y: 50 },
];

export const BODY_LOCATION_GROUPS = Array.from(new Set(BODY_LOCATIONS.map((b) => b.group)));

export const findBodyLocation = (key: string) => BODY_LOCATIONS.find((b) => b.key === key);
