import * as geofire from 'geofire-common';

export interface SimulationItem {
  id: string;
  title: string;
  category: 'CRITICAL' | 'IMPORTANT' | 'GENERAL';
  timestamp: string;
  lat: number;
  lng: number;
  distance_km: number;
  location_name: string;
  summary: string;
  full_report: string;
  status: 'LIVE' | 'UPDATING' | 'RESOLVED';
  severity_score: number;
  images: { url: string; caption: string }[];
  tags: string[];
  cluster_id: string;
  is_breaking: boolean;
  read_more_enabled: boolean;
  isSimulation: boolean;
}

const LOCATIONS = [
  { name: 'Connaught Place', lat: 28.6328, lng: 77.2197 },
  { name: 'South Extension', lat: 28.5684, lng: 77.2201 },
  { name: 'Rajouri Garden', lat: 28.6415, lng: 77.1209 },
  { name: 'Greater Kailash', lat: 28.5482, lng: 77.2326 },
  { name: 'Rohini Sector 7', lat: 28.7107, lng: 77.1187 },
  { name: 'Dwarka Sector 10', lat: 28.5834, lng: 77.0654 },
  { name: 'Noida Sector 18', lat: 28.5677, lng: 77.3213 },
  { name: 'Gurgaon Cyber City', lat: 28.4951, lng: 77.0894 },
];

const TEMPLATES = {
  CRITICAL: [
    { title: 'Major Fire in Warehouse', summary: 'Emergency services at the scene. Evacuation in progress.', tags: ['fire', 'emergency', 'danger'] },
    { title: 'Severe Road Accident', summary: 'Multi-vehicle collision on main highway. Traffic diverted.', tags: ['accident', 'traffic', 'medical'] },
    { title: 'Flash Flooding Alert', summary: 'Nearby streets submerged after heavy downpour.', tags: ['flood', 'weather', 'hazard'] },
  ],
  IMPORTANT: [
    { title: 'Traffic Congestion', summary: 'Heavy delays due to stalled vehicle on bridge.', tags: ['traffic', 'delay'] },
    { title: 'Police Checkpoint', summary: 'Routine verification drive in progress. Expect delays.', tags: ['police', 'check'] },
    { title: 'Utility Repair Work', summary: 'Main water line burst. Repairs expected to take 4 hours.', tags: ['utility', 'work'] },
  ],
  GENERAL: [
    { title: 'Weekly Market Day', summary: 'High footfall in local market. Parking limited.', tags: ['market', 'community'] },
    { title: 'Local Park Renovation', summary: 'New equipment installed in children’s area.', tags: ['park', 'update'] },
    { title: 'Street Light Maintenance', summary: 'Team working on replacing non-functional bulbs.', tags: ['utility', 'light'] },
  ]
};

export class SimulationEngine {
  private userLat: number;
  private userLng: number;

  constructor(userLat: number, userLng: number) {
    this.userLat = userLat;
    this.userLng = userLng;
  }

  generateItems(count: number): SimulationItem[] {
    const items: SimulationItem[] = [];
    for (let i = 0; i < count; i++) {
       const categoryRoll = Math.random();
       let category: 'CRITICAL' | 'IMPORTANT' | 'GENERAL' = 'GENERAL';
       if (categoryRoll > 0.85) category = 'CRITICAL';
       else if (categoryRoll > 0.6) category = 'IMPORTANT';

       const template = TEMPLATES[category][Math.floor(Math.random() * TEMPLATES[category].length)];
       const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
       
       // Add some random offset within 5-20km
       const offsetLat = (Math.random() - 0.5) * 0.1;
       const offsetLng = (Math.random() - 0.5) * 0.1;

       const itemLat = location.lat + offsetLat;
       const itemLng = location.lng + offsetLng;
       const dist = geofire.distanceBetween([this.userLat, this.userLng], [itemLat, itemLng]);

       const id = `sim_${Date.now()}_${i}`;
       items.push({
         id,
         title: template.title,
         category: category,
         timestamp: new Date().toISOString(),
         lat: itemLat,
         lng: itemLng,
         distance_km: parseFloat(dist.toFixed(1)),
         location_name: location.name,
         summary: template.summary,
         full_report: `${template.summary} Local authorities are monitoring the situation closely. Citizens are advised to take necessary precautions.`,
         status: 'LIVE',
         severity_score: category === 'CRITICAL' ? 8 + Math.floor(Math.random() * 3) : category === 'IMPORTANT' ? 4 + Math.floor(Math.random() * 4) : 1 + Math.floor(Math.random() * 4),
         images: [
           { url: `https://dummyimage.com/600x400/000/fff&text=${category}+News+Scene`, caption: `Scene at ${location.name}` }
         ],
         tags: template.tags,
         cluster_id: `cluster_${location.name.toLowerCase().replace(/\s/g, '_')}_${category.toLowerCase()}`,
         is_breaking: category === 'CRITICAL',
         read_more_enabled: true,
         isSimulation: true
       });
    }
    return items;
  }

  updateExistingItems(currentItems: SimulationItem[]): SimulationItem[] {
    return currentItems.map(item => {
      if (Math.random() > 0.7 && item.status !== 'RESOLVED') {
        const nextStatus = item.status === 'LIVE' ? 'UPDATING' : 'RESOLVED';
        return {
          ...item,
          status: nextStatus,
          severity_score: nextStatus === 'RESOLVED' ? Math.max(1, item.severity_score - 3) : item.severity_score
        };
      }
      return item;
    });
  }
}
