import { LocationPoint } from '../types';

export const CALAMBA_POBLACION_CENTER: [number, number] = [14.2138, 121.1645];

export const CALAMBA_LANDMARKS: LocationPoint[] = [
  {
    name: 'City College of Calamba (CCC Main)',
    lat: 14.2148,
    lng: 121.1648,
  },
  {
    name: 'Calamba Town Plaza / Rizal Shrine',
    lat: 14.2132,
    lng: 121.1662,
  },
  {
    name: 'St. John the Baptist Parish Church',
    lat: 14.2139,
    lng: 121.1669,
  },
  {
    name: 'Calamba Crossing Terminal',
    lat: 14.2085,
    lng: 121.1558,
  },
  {
    name: 'JP Rizal St. cor. Burgos St. (Brgy 2)',
    lat: 14.2135,
    lng: 121.1638,
  },
  {
    name: 'San Juan River Bridge / Poblacion 4',
    lat: 14.2162,
    lng: 121.1651,
  },
];

export const BARANGAYS_LIST = [
  { id: 1, name: 'Barangay 1 (Poblacion 1)', shortName: 'Brgy 1', landmark: 'Elepaño St. & Old Market Zone' },
  { id: 2, name: 'Barangay 2 (Poblacion 2)', shortName: 'Brgy 2', landmark: 'Burgos St. & JP Rizal Central' },
  { id: 3, name: 'Barangay 3 (Poblacion 3)', shortName: 'Brgy 3', landmark: 'Bandola St. & Plaza Vicinity' },
  { id: 4, name: 'Barangay 4 (Poblacion 4)', shortName: 'Brgy 4', landmark: 'San Juan Riverfront & Rizal Heritage' },
  { id: 5, name: 'Barangay 5 (Poblacion 5)', shortName: 'Brgy 5', landmark: 'Kinsville St. & L.E. Blvd' },
  { id: 6, name: 'Barangay 6 (Poblacion 6)', shortName: 'Brgy 6', landmark: 'City College of Calamba & Burgos West' },
  { id: 7, name: 'Barangay 7 (Poblacion 7)', shortName: 'Brgy 7', landmark: 'Ilang-Ilang St. & St. John Baptist East' },
];
