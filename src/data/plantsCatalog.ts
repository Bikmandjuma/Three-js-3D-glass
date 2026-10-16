/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FloraSpeciesType, PlantSpecimenData } from '../types/terrarium';

export const BOTANICAL_DATABASE: Record<
  FloraSpeciesType,
  {
    commonName: string;
    botanicalName: string;
    family: string;
    lightReq: 'Bright Indirect' | 'Full Sun' | 'Dappled Shade' | 'Low Light';
    moistureReq: 'Low' | 'Moderate' | 'High' | 'Bog / Saturated';
    idealTemp: string;
    nativeRegion: string;
    description: string;
    funFact: string;
    careTip: string;
  }
> = {
  fern: {
    commonName: 'Southern Maidenhair Fern',
    botanicalName: 'Adiantum capillus-veneris',
    family: 'Pteridaceae',
    lightReq: 'Dappled Shade',
    moistureReq: 'High',
    idealTemp: '18°C – 24°C',
    nativeRegion: 'Moist limestone grottos and waterfall ravines worldwide',
    description:
      'Renowned for its gossamer lace fronds and lustrous ebony-black stems. Unfurls via coiled crosiers (fiddleheads) driven by internal hydraulic turgor pressure.',
    funFact:
      'The genus name Adiantum stems from Greek for "unwetted", as water drops bead and slip instantly off the waxy pinnae without dampening them.',
    careTip:
      'Requires constant ambient humidity above 65%. If leaf edges curl, mist promptly.',
  },
  bonsai: {
    commonName: 'Miniature Dwarf Juniper',
    botanicalName: 'Juniperus procumbens ‘Nana’',
    family: 'Cupressaceae',
    lightReq: 'Bright Indirect',
    moistureReq: 'Moderate',
    idealTemp: '16°C – 22°C',
    nativeRegion: 'Alpine rocky hillsides of southern Japan',
    description:
      'Sculpted with gnarled sinuous trunks and layered needle cloud pads. Serves as the ancient structural backbone and focal centerpiece of the vivarium.',
    funFact:
      'Bonsai masterworks can live for over 400 years in miniature form through disciplined root pruning and directional branch wiring.',
    careTip:
      'Allow the top layer of substrate to dry slightly between thorough watering to safeguard delicate root hairs.',
  },
  succulent: {
    commonName: 'Mexican Snowball',
    botanicalName: 'Echeveria elegans',
    family: 'Crassulaceae',
    lightReq: 'Bright Indirect',
    moistureReq: 'Low',
    idealTemp: '19°C – 26°C',
    nativeRegion: 'Semi-desert rocky scree of Hidalgo, Mexico',
    description:
      'Presents tight architectural rosettes of fleshy alabaster-blue leaves. In intense sun or cool nights, the leaf margins blush into vivid coral pinks.',
    funFact:
      'Its powdery frosted coat is called "farina" or epicuticular wax, which acts as natural sunscreen and water repellant.',
    careTip:
      'Terrarium humidity must not linger directly in the rosette core to prevent crown rot; plant upon elevated gravel mounds.',
  },
  pitcher: {
    commonName: 'Purple Pitcher Plant',
    botanicalName: 'Sarracenia purpurea',
    family: 'Sarraceniaceae',
    lightReq: 'Bright Indirect',
    moistureReq: 'Bog / Saturated',
    idealTemp: '15°C – 25°C',
    nativeRegion: 'Peat bogs and nutrient-poor wetlands of Eastern North America',
    description:
      'Carnivorous trumpet pitcher with crimson reticulate veins and a nectar-scented peristome rim that lures micro-insects into its enzyme-rich digestive reservoir.',
    funFact:
      'Unlike tropical pitcher plants, Sarracenia relies on passive rainwater collection and symbiotic microbes to digest prey rather than active acid secretions alone.',
    careTip:
      'Never fertilize with standard soil nutrients! Thrives exclusively in pure mineral-free peat and perpetual substrate saturation.',
  },
  biomushroom: {
    commonName: 'Ghost Lantern Fungi',
    botanicalName: 'Mycena chlorophos',
    family: 'Mycenaceae',
    lightReq: 'Low Light',
    moistureReq: 'High',
    idealTemp: '20°C – 27°C',
    nativeRegion: 'Subtropical rainforests of Japan, Polynesia, and Java',
    description:
      'A nocturnal bioluminescent marvel whose slender parasol caps emit a continuous ethereal green light (wavelength 522 nm) fueled by the luciferin enzyme.',
    funFact:
      'Bioluminescence in fungi peaks at approximately 27°C and is believed to attract night insects that disperse spores through windless jungle canopies.',
    careTip:
      'Reaches peak luminescence during warm twilight hours with rich decomposed wood humus.',
  },
  cushion_moss: {
    commonName: 'Velvet Broom Fork Moss',
    botanicalName: 'Dicranum scoparium',
    family: 'Dicranaceae',
    lightReq: 'Dappled Shade',
    moistureReq: 'High',
    idealTemp: '14°C – 21°C',
    nativeRegion: 'Ancient temperate coniferous woodlands and moist forest floors',
    description:
      'Forms plush, velvety emerald emerald cushions that retain up to 20 times their dry weight in ambient water vapor.',
    funFact:
      'Mosses lack true vascular xylem and roots, absorbing all hydration and atmospheric nitrogen directly through microscopic surface cell walls.',
    careTip:
      'Lightly spritz daily to keep the cushion springy and radiant.',
  },
};

/**
 * Generate starter flora specimens for a given random seed
 */
export function generateStarterFlora(seed: number = 42): PlantSpecimenData[] {
  // Pseudorandom generator based on seed
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const starter: PlantSpecimenData[] = [
    {
      id: 'specimen_bonsai_center',
      species: 'bonsai',
      commonName: BOTANICAL_DATABASE.bonsai.commonName,
      botanicalName: BOTANICAL_DATABASE.bonsai.botanicalName,
      position: [-0.6 + (rand() - 0.5) * 0.4, 0, -0.4 + (rand() - 0.5) * 0.4],
      rotationY: rand() * Math.PI * 2,
      scale: 1.05,
      growthStage: 1.0,
      health: 98,
      moistureReq: BOTANICAL_DATABASE.bonsai.moistureReq,
      lightReq: BOTANICAL_DATABASE.bonsai.lightReq,
      description: BOTANICAL_DATABASE.bonsai.description,
      funFact: BOTANICAL_DATABASE.bonsai.funFact,
    },
    {
      id: 'specimen_fern_left',
      species: 'fern',
      commonName: BOTANICAL_DATABASE.fern.commonName,
      botanicalName: BOTANICAL_DATABASE.fern.botanicalName,
      position: [-1.8 + (rand() - 0.5) * 0.3, 0, 0.4 + (rand() - 0.5) * 0.3],
      rotationY: rand() * Math.PI * 2,
      scale: 0.95,
      growthStage: 1.1,
      health: 95,
      moistureReq: BOTANICAL_DATABASE.fern.moistureReq,
      lightReq: BOTANICAL_DATABASE.fern.lightReq,
      description: BOTANICAL_DATABASE.fern.description,
      funFact: BOTANICAL_DATABASE.fern.funFact,
    },
    {
      id: 'specimen_succulent_front',
      species: 'succulent',
      commonName: BOTANICAL_DATABASE.succulent.commonName,
      botanicalName: BOTANICAL_DATABASE.succulent.botanicalName,
      position: [0.8 + (rand() - 0.5) * 0.3, 0, 1.4 + (rand() - 0.5) * 0.3],
      rotationY: rand() * Math.PI * 2,
      scale: 0.85,
      growthStage: 0.95,
      health: 96,
      moistureReq: BOTANICAL_DATABASE.succulent.moistureReq,
      lightReq: BOTANICAL_DATABASE.succulent.lightReq,
      description: BOTANICAL_DATABASE.succulent.description,
      funFact: BOTANICAL_DATABASE.succulent.funFact,
    },
    {
      id: 'specimen_pitcher_right',
      species: 'pitcher',
      commonName: BOTANICAL_DATABASE.pitcher.commonName,
      botanicalName: BOTANICAL_DATABASE.pitcher.botanicalName,
      position: [1.6 + (rand() - 0.5) * 0.3, 0, -0.2 + (rand() - 0.5) * 0.3],
      rotationY: rand() * Math.PI * 2,
      scale: 0.9,
      growthStage: 1.0,
      health: 92,
      moistureReq: BOTANICAL_DATABASE.pitcher.moistureReq,
      lightReq: BOTANICAL_DATABASE.pitcher.lightReq,
      description: BOTANICAL_DATABASE.pitcher.description,
      funFact: BOTANICAL_DATABASE.pitcher.funFact,
    },
    {
      id: 'specimen_shroom_cave',
      species: 'biomushroom',
      commonName: BOTANICAL_DATABASE.biomushroom.commonName,
      botanicalName: BOTANICAL_DATABASE.biomushroom.botanicalName,
      position: [-1.1 + (rand() - 0.5) * 0.2, 0, -1.3 + (rand() - 0.5) * 0.2],
      rotationY: rand() * Math.PI * 2,
      scale: 0.85,
      growthStage: 1.0,
      health: 100,
      moistureReq: BOTANICAL_DATABASE.biomushroom.moistureReq,
      lightReq: BOTANICAL_DATABASE.biomushroom.lightReq,
      description: BOTANICAL_DATABASE.biomushroom.description,
      funFact: BOTANICAL_DATABASE.biomushroom.funFact,
    },
    {
      id: 'specimen_moss_driftwood',
      species: 'cushion_moss',
      commonName: BOTANICAL_DATABASE.cushion_moss.commonName,
      botanicalName: BOTANICAL_DATABASE.cushion_moss.botanicalName,
      position: [-0.1 + (rand() - 0.5) * 0.3, 0, 0.7 + (rand() - 0.5) * 0.3],
      rotationY: rand() * Math.PI * 2,
      scale: 0.9,
      growthStage: 1.0,
      health: 97,
      moistureReq: BOTANICAL_DATABASE.cushion_moss.moistureReq,
      lightReq: BOTANICAL_DATABASE.cushion_moss.lightReq,
      description: BOTANICAL_DATABASE.cushion_moss.description,
      funFact: BOTANICAL_DATABASE.cushion_moss.funFact,
    },
  ];

  return starter;
}
