// Asset types for electrical transmission and distribution
export const assetTypes = [
  { value: "transformer", label: "Power Transformer" },
  { value: "circuit_breaker", label: "Circuit Breaker" },
  { value: "switchgear", label: "Switchgear" },
  { value: "overhead_line", label: "Overhead Transmission Line" },
  { value: "underground_cable", label: "Underground Cable" },
  { value: "capacitor_bank", label: "Capacitor Bank" },
  { value: "reactor", label: "Shunt Reactor" },
  { value: "disconnect_switch", label: "Disconnect Switch" },
  { value: "surge_arrester", label: "Surge Arrester" },
  { value: "insulator", label: "Insulator" },
]

// Voltage ratings based on asset type
export function getVoltageRatings(assetType: string) {
  const commonVoltages = [
    { value: "lv", label: "Low Voltage (< 1kV)" },
    { value: "mv", label: "Medium Voltage (1kV - 35kV)" },
    { value: "hv", label: "High Voltage (36kV - 230kV)" },
    { value: "ehv", label: "Extra High Voltage (> 230kV)" },
  ]

  // Return specific voltage ratings based on asset type
  switch (assetType) {
    case "transformer":
    case "circuit_breaker":
    case "switchgear":
      return commonVoltages
    case "overhead_line":
    case "underground_cable":
      return commonVoltages.filter((v) => v.value !== "lv")
    case "capacitor_bank":
    case "reactor":
      return commonVoltages.filter((v) => v.value !== "lv")
    case "disconnect_switch":
    case "surge_arrester":
    case "insulator":
      return commonVoltages
    default:
      return commonVoltages
  }
}

// Operating environments based on asset type
export function getOperatingEnvironments(assetType: string) {
  // Simplified environment options for all asset types
  return [
    { value: "indoor", label: "Indoor" },
    { value: "outdoor", label: "Outdoor" },
    { value: "coastal", label: "Coastal/High Salinity" },
    { value: "extreme_climate", label: "Extreme Hot/Cold Climate" },
  ]
}

// Asset age ranges
export function getAgeRanges() {
  return [
    { value: "new", label: "New (< 5 years)" },
    { value: "mid_life", label: "Mid-life (5-15 years)" },
    { value: "mature", label: "Mature (16-30 years)" },
    { value: "end_of_life", label: "End of Life (> 30 years)" },
  ]
}

// Load profiles based on asset type
export function getLoadProfiles(assetType: string) {
  const commonProfiles = [
    { value: "light", label: "Light Load (< 30% rated)" },
    { value: "medium", label: "Medium Load (30-70% rated)" },
    { value: "heavy", label: "Heavy Load (> 70% rated)" },
    { value: "cyclic", label: "Cyclic Loading" },
    { value: "intermittent", label: "Intermittent Loading" },
  ]

  // Add specific load profiles for certain asset types
  switch (assetType) {
    case "transformer":
      return [
        ...commonProfiles,
        { value: "overload", label: "Frequent Overloading" },
        { value: "harmonic", label: "High Harmonic Content" },
      ]
    case "circuit_breaker":
      return [
        ...commonProfiles,
        { value: "frequent_ops", label: "Frequent Operations" },
        { value: "fault_interruption", label: "Frequent Fault Interruption" },
      ]
    case "switchgear":
      return [...commonProfiles, { value: "frequent_switching", label: "Frequent Switching Operations" }]
    case "overhead_line":
    case "underground_cable":
      return [
        ...commonProfiles,
        { value: "dynamic", label: "Dynamic Loading (renewable integration)" },
        { value: "seasonal_peak", label: "Seasonal Peak Loading" },
      ]
    case "capacitor_bank":
      return [
        { value: "continuous", label: "Continuous Operation" },
        { value: "switched", label: "Frequently Switched" },
        { value: "seasonal", label: "Seasonal Operation" },
      ]
    case "reactor":
      return [
        { value: "continuous", label: "Continuous Operation" },
        { value: "switched", label: "Switched Operation" },
        { value: "overload", label: "Occasional Overload" },
      ]
    case "disconnect_switch":
      return [
        { value: "infrequent", label: "Infrequent Operation" },
        { value: "frequent", label: "Frequent Operation" },
        { value: "emergency", label: "Emergency Operation Only" },
      ]
    case "surge_arrester":
      return [
        { value: "normal", label: "Normal System Voltage" },
        { value: "elevated", label: "Elevated System Voltage" },
        { value: "frequent_surges", label: "Frequent Surge Events" },
      ]
    case "insulator":
      return [
        { value: "normal", label: "Normal System Voltage" },
        { value: "elevated", label: "Elevated System Voltage" },
        { value: "transient", label: "Frequent Transient Overvoltages" },
      ]
    default:
      return commonProfiles
  }
}

// Asset criticality levels
export function getAssetCriticality() {
  return [
    { value: "high", label: "High Criticality" },
    { value: "medium", label: "Medium Criticality" },
    { value: "low", label: "Low Criticality" },
  ]
}

// Failure modes based on asset type
export function getFailureModes(assetType: string) {
  switch (assetType) {
    case "transformer":
      return [
        {
          name: "Insulation Breakdown",
          description:
            "Degradation of paper insulation due to thermal stress, moisture ingress, or electrical stress leading to internal short circuits.",
          severity: 9,
          occurrence: 5,
          detection: 4,
        },
        {
          name: "Bushing Failure",
          description: "Cracking, contamination, or moisture ingress in bushings leading to flashover or explosion.",
          severity: 8,
          occurrence: 6,
          detection: 3,
        },
        {
          name: "Oil Leakage",
          description:
            "Leakage from gaskets, welds, or cooling systems leading to reduced insulation and cooling capability.",
          severity: 6,
          occurrence: 7,
          detection: 2,
        },
        {
          name: "Cooling System Failure",
          description: "Failure of fans, pumps, or radiators leading to overheating and accelerated insulation aging.",
          severity: 7,
          occurrence: 5,
          detection: 3,
        },
        {
          name: "Tap Changer Malfunction",
          description:
            "Mechanical failure or contact wear in the tap changer mechanism leading to improper voltage regulation.",
          severity: 6,
          occurrence: 6,
          detection: 4,
        },
      ]

    case "circuit_breaker":
      return [
        {
          name: "Operating Mechanism Failure",
          description: "Mechanical failure in the operating mechanism preventing proper opening or closing operations.",
          severity: 8,
          occurrence: 6,
          detection: 4,
        },
        {
          name: "Contact Erosion",
          description:
            "Erosion of main contacts due to arcing during interruption leading to increased contact resistance.",
          severity: 7,
          occurrence: 7,
          detection: 5,
        },
        {
          name: "SF6 Gas Leakage",
          description:
            "Leakage of SF6 insulating gas leading to reduced dielectric strength and interruption capability.",
          severity: 8,
          occurrence: 5,
          detection: 3,
        },
        {
          name: "Control Circuit Failure",
          description: "Failure in control circuits, auxiliary contacts, or trip coils preventing proper operation.",
          severity: 9,
          occurrence: 4,
          detection: 3,
        },
        {
          name: "Insulation Degradation",
          description: "Degradation of internal insulation due to partial discharges, contamination, or aging.",
          severity: 7,
          occurrence: 5,
          detection: 6,
        },
      ]

    case "switchgear":
      return [
        {
          name: "Bus Bar Failure",
          description:
            "Insulation failure or joint overheating in bus bars leading to phase-to-phase or phase-to-ground faults.",
          severity: 9,
          occurrence: 4,
          detection: 5,
        },
        {
          name: "Circuit Breaker Failure",
          description: "Failure of embedded circuit breakers to interrupt fault current or unwanted operation.",
          severity: 8,
          occurrence: 5,
          detection: 4,
        },
        {
          name: "Insulation Degradation",
          description: "Degradation of insulation due to partial discharges, contamination, or moisture ingress.",
          severity: 8,
          occurrence: 6,
          detection: 5,
        },
        {
          name: "Control System Failure",
          description: "Failure in protection relays, control circuits, or interlocks leading to improper operation.",
          severity: 7,
          occurrence: 5,
          detection: 3,
        },
        {
          name: "Mechanical Interlock Failure",
          description: "Failure of mechanical interlocks allowing unsafe operations or access.",
          severity: 9,
          occurrence: 3,
          detection: 4,
        },
      ]

    case "overhead_line":
      return [
        {
          name: "Conductor Failure",
          description: "Breakage or damage to conductors due to mechanical stress, corrosion, or overheating.",
          severity: 8,
          occurrence: 5,
          detection: 6,
        },
        {
          name: "Insulator Failure",
          description: "Cracking, flashover, or contamination of insulators leading to phase-to-ground faults.",
          severity: 7,
          occurrence: 7,
          detection: 5,
        },
        {
          name: "Structure Failure",
          description:
            "Failure of poles, towers, or cross-arms due to mechanical stress, corrosion, or foundation issues.",
          severity: 9,
          occurrence: 4,
          detection: 5,
        },
        {
          name: "Vegetation Contact",
          description: "Contact between vegetation and conductors leading to faults or fires.",
          severity: 8,
          occurrence: 8,
          detection: 3,
        },
        {
          name: "Hardware Failure",
          description:
            "Failure of connectors, dampers, or other hardware components leading to mechanical or electrical issues.",
          severity: 6,
          occurrence: 6,
          detection: 5,
        },
      ]

    case "underground_cable":
      return [
        {
          name: "Insulation Breakdown",
          description: "Degradation of cable insulation due to electrical stress, water treeing, or thermal aging.",
          severity: 8,
          occurrence: 6,
          detection: 7,
        },
        {
          name: "Joint Failure",
          description: "Failure at cable joints due to improper installation, water ingress, or thermal cycling.",
          severity: 7,
          occurrence: 7,
          detection: 6,
        },
        {
          name: "Termination Failure",
          description:
            "Failure at cable terminations due to improper installation, contamination, or electrical stress.",
          severity: 7,
          occurrence: 6,
          detection: 5,
        },
        {
          name: "Mechanical Damage",
          description: "External mechanical damage to cables from excavation, crushing, or other physical impacts.",
          severity: 9,
          occurrence: 5,
          detection: 8,
        },
        {
          name: "Water Ingress",
          description: "Water penetration into cable structure leading to accelerated insulation degradation.",
          severity: 7,
          occurrence: 7,
          detection: 7,
        },
      ]

    case "capacitor_bank":
      return [
        {
          name: "Capacitor Unit Failure",
          description: "Internal short circuit or open circuit in individual capacitor units.",
          severity: 6,
          occurrence: 7,
          detection: 4,
        },
        {
          name: "Fuse Operation",
          description: "Operation of unit fuses due to capacitor failure or system transients.",
          severity: 5,
          occurrence: 8,
          detection: 3,
        },
        {
          name: "Bushing Failure",
          description: "Flashover or breakdown of bushings due to contamination or aging.",
          severity: 7,
          occurrence: 5,
          detection: 4,
        },
        {
          name: "Control System Failure",
          description: "Failure in switching or protection controls leading to improper operation.",
          severity: 7,
          occurrence: 5,
          detection: 4,
        },
        {
          name: "Connection Failure",
          description: "Loose or corroded connections leading to overheating and failure.",
          severity: 6,
          occurrence: 6,
          detection: 5,
        },
      ]

    case "reactor":
      return [
        {
          name: "Insulation Failure",
          description: "Breakdown of insulation between windings or to ground due to electrical or thermal stress.",
          severity: 8,
          occurrence: 5,
          detection: 5,
        },
        {
          name: "Core Failure",
          description: "Damage to magnetic core due to overheating, vibration, or manufacturing defects.",
          severity: 7,
          occurrence: 4,
          detection: 6,
        },
        {
          name: "Cooling System Failure",
          description: "Failure of cooling systems leading to overheating and accelerated insulation aging.",
          severity: 7,
          occurrence: 6,
          detection: 4,
        },
        {
          name: "Bushing Failure",
          description: "Flashover or breakdown of bushings due to contamination or aging.",
          severity: 7,
          occurrence: 5,
          detection: 4,
        },
        {
          name: "Connection Failure",
          description: "Loose or corroded connections leading to overheating and failure.",
          severity: 6,
          occurrence: 6,
          detection: 5,
        },
      ]

    case "disconnect_switch":
      return [
        {
          name: "Contact Degradation",
          description: "Corrosion, pitting, or misalignment of contacts leading to increased resistance and heating.",
          severity: 6,
          occurrence: 7,
          detection: 5,
        },
        {
          name: "Operating Mechanism Failure",
          description: "Mechanical failure in the operating mechanism preventing proper opening or closing.",
          severity: 7,
          occurrence: 6,
          detection: 4,
        },
        {
          name: "Insulator Failure",
          description: "Cracking, flashover, or contamination of insulators leading to phase-to-ground faults.",
          severity: 8,
          occurrence: 5,
          detection: 4,
        },
        {
          name: "Corrosion",
          description: "Corrosion of metal parts affecting mechanical integrity and electrical performance.",
          severity: 6,
          occurrence: 7,
          detection: 4,
        },
        {
          name: "Misalignment",
          description: "Misalignment of contacts or blades leading to improper operation or arcing.",
          severity: 7,
          occurrence: 5,
          detection: 5,
        },
      ]

    case "surge_arrester":
      return [
        {
          name: "MOV Degradation",
          description: "Degradation of metal oxide varistors due to multiple operations or aging.",
          severity: 7,
          occurrence: 6,
          detection: 7,
        },
        {
          name: "Moisture Ingress",
          description: "Water penetration into arrester housing leading to internal flashover.",
          severity: 8,
          occurrence: 5,
          detection: 6,
        },
        {
          name: "Housing Damage",
          description: "Cracking or damage to external housing due to environmental factors or improper handling.",
          severity: 7,
          occurrence: 5,
          detection: 4,
        },
        {
          name: "Disconnector Failure",
          description: "Failure of the disconnector to operate when the arrester fails.",
          severity: 8,
          occurrence: 4,
          detection: 7,
        },
        {
          name: "Seal Failure",
          description: "Failure of seals leading to moisture ingress and internal contamination.",
          severity: 7,
          occurrence: 6,
          detection: 6,
        },
      ]

    case "insulator":
      return [
        {
          name: "Surface Contamination",
          description: "Accumulation of pollution, dust, or salt on insulator surface leading to flashover.",
          severity: 7,
          occurrence: 8,
          detection: 5,
        },
        {
          name: "Cracking",
          description: "Mechanical cracking due to thermal cycling, impact, or manufacturing defects.",
          severity: 8,
          occurrence: 5,
          detection: 6,
        },
        {
          name: "Puncture",
          description: "Internal puncture of insulation material due to electrical stress or defects.",
          severity: 8,
          occurrence: 4,
          detection: 7,
        },
        {
          name: "Cement Growth",
          description: "Expansion of cement in porcelain insulators leading to mechanical stress and cracking.",
          severity: 7,
          occurrence: 5,
          detection: 7,
        },
        {
          name: "Hardware Corrosion",
          description: "Corrosion of metal hardware components affecting mechanical integrity.",
          severity: 6,
          occurrence: 7,
          detection: 5,
        },
      ]

    default:
      return [
        {
          name: "Generic Failure Mode 1",
          description: "Generic description of failure mode 1.",
          severity: 7,
          occurrence: 6,
          detection: 5,
        },
        {
          name: "Generic Failure Mode 2",
          description: "Generic description of failure mode 2.",
          severity: 6,
          occurrence: 7,
          detection: 5,
        },
        {
          name: "Generic Failure Mode 3",
          description: "Generic description of failure mode 3.",
          severity: 8,
          occurrence: 5,
          detection: 6,
        },
      ]
  }
}
