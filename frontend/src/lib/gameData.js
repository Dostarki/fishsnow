export const CREW = [
  { id: 'rod', name: 'The Angler', role: 'ROD FISHERMAN', subtitle: 'A rod. A quiet spot. A fresh start.', daily_yield: 100, capacity: 5, color: '#db884e', location: 'Whispering Bank', trait: 'Slow & steady' },
  { id: 'net', name: 'The Netter', role: 'NET FISHERMAN', subtitle: 'Cast a little wider. Catch a little more.', daily_yield: 250, capacity: 8, color: '#56a7a0', location: 'Frostwater Dock', trait: 'A bigger catch' },
  { id: 'boat', name: 'The Captain', role: 'BOAT FISHERMAN', subtitle: 'Good things wait beyond the shore.', daily_yield: 600, capacity: 12, color: '#617cad', location: 'Driftwood Harbor', trait: 'Open-water explorer' },
];
export const SPOTS = { rod: [-3.3, 1.02, 4], net: [-4.5, 1.02, -1.6], boat: [7.7, .43, 15.5] };
export const MARKET = [.4, 1, 2.4];
export const ROUTES = {
  rod: [[-3.3,1.02,4],[-1.3,1.02,4.4],[.8,1.02,4.1]],
  net: [[-4.5,1.02,-1.6],[-2.7,1.02,-1.6],[-2.7,1.02,4.3],[.8,1.02,4.1]],
  boat: [[7.7,.43,15.5],[7.7,.43,12.7],[8.8,1.02,12.7],[8.8,1.02,5.6],[.8,1.02,5.6],[.8,1.02,4.1]],
};