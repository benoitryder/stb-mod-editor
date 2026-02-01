const romCharacterSlots = {
  // Shared by v2.5 and v2.6
  "v2.5": ["sinbad-2.5", "kiki-2.5", "pepper-2.5", "vgsage-2.5", "sunny-2.5"],
};

// Static configuration
const STATIC_CONF = {
  characterPacks: {
    "STB 2.6": [
      { name: "sinbad", url: "data/sinbad.json", slot: "sinbad-2.5" },
      { name: "kiki", url: "data/kiki.json", slot: "kiki-2.5" },
      { name: "pepper", url: "data/pepper.json", slot: "pepper-2.5" },
      { name: "vgsage", url: "data/vgsage.json", slot: "vgsage-2.5" },
      { name: "sunny", url: "data/sunny.json", slot: "sunny-2.5" },
    ],
  },
  // Information of known ROMS, indexed by their hash
  // - `name` is a human-readable name, can be anything
  // - `modBank` is the first bank that stores mod data, `null` if unknown
  // `modBank` must rely on bank mapping, implemented in `game/banks.asm`
  // - `FIRST_GAME_BANK` is an offset applied to ROM with online enabled
  // - First mod bank location is announced by a `;; mod banks` comment
  knownRoms: {
    "utmgm9": {
      name: "Super Tilt Bro. v2.5 (online build)",
      modBank: 0x4 + 0x11,
      characterSlots: romCharacterSlots["v2.5"],
    },
    "itn6my": {
      name: "Super Tilt Bro. v2.5 (offline build)",
      modBank: 0x11,
      characterSlots: romCharacterSlots["v2.5"],
    },
    "1fqcsvf": {
      name: "Super Tilt Bro. v2.6 (online build)",
      modBank: 0x4 + 0x12,
      characterSlots: romCharacterSlots["v2.5"],
    },
    "1vm7kcs": {
      name: "Super Tilt Bro. v2.6 (offline build)",
      modBank: 0x12,
      characterSlots: romCharacterSlots["v2.5"],
    },
  },
  // List of all known slots (should cover all slots listed elsewhere)
  // Set default index of characters if ROM is not known
  characterSlots: {
    "sinbad-2.5": { defaultIndex: 0 },
    "kiki-2.5": { defaultIndex: 1 },
    "pepper-2.5": { defaultIndex: 2 },
    "vgsage-2.5": { defaultIndex: 3 },
    "sunny-2.5": { defaultIndex: 4 },
  },
};
