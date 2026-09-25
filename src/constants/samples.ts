/**
 * High-resolution sample presets for instant testing without manual upload.
 */

import retroSunsetImg from '../assets/images/pin_sample_retro_sunset_1790306689489.jpg';
import spaceAstronautImg from '../assets/images/pin_sample_space_astronaut_1790306698735.jpg';
import coffeeClubImg from '../assets/images/pin_sample_coffee_club_1790306706732.jpg';

export interface SampleBadge {
  id: string;
  title: string;
  tagline: string;
  src: string;
}

export const SAMPLE_BADGES: SampleBadge[] = [
  {
    id: 'retro_sunset',
    title: 'Synthwave 1984',
    tagline: 'Vector 80s gradient sunset',
    src: retroSunsetImg,
  },
  {
    id: 'space_astronaut',
    title: 'Astro Nebula',
    tagline: 'Ilustración cósmica detallada',
    src: spaceAstronautImg,
  },
  {
    id: 'coffee_club',
    title: 'Artisan Coffee',
    tagline: 'Emblema vintage de cafetería',
    src: coffeeClubImg,
  },
];
