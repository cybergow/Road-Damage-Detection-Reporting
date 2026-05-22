const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Report = require('../models/Report');
const Detection = require('../models/Detection');

// Load environment variables
dotenv.config();

const users = [
  {
    name: 'RoadGuard Admin',
    email: 'admin@roadguard.ai',
    password: 'admin123',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  },
  {
    name: 'John Doe',
    email: 'user@roadguard.ai',
    password: 'user123',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  },
];

const sampleReports = [
  // Mumbai
  {
    title: 'Severe Pothole on Western Express Highway',
    description: 'A deep and hazardous pothole has formed in the middle lane near the Andheri flyover. Several vehicles have damaged their tires and it is causing massive traffic backups.',
    images: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [72.853244, 19.115456], // [longitude, latitude]
    },
    address: 'Western Express Highway, Andheri East, Mumbai, Maharashtra 400069',
    severity: 'high',
    status: 'pending',
  },
  {
    title: 'Major Alligator Crack near Marine Drive',
    description: 'Significant alligator cracking covering a 10-meter stretch of the road, causing uneven driving surface and water pooling during high tides.',
    images: ['https://images.unsplash.com/photo-1599740831119-07284763eff2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [72.822765, 18.940567],
    },
    address: 'Marine Drive, Netaji Subhash Chandra Bose Road, Churchgate, Mumbai 400020',
    severity: 'medium',
    status: 'approved',
  },
  {
    title: 'Pothole cluster at Bandra West',
    description: 'Multiple small potholes clustered together near Carter Road promenade. Highly unsafe for two-wheelers.',
    images: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [72.820888, 19.063124],
    },
    address: 'Carter Road, Bandra West, Mumbai 400050',
    severity: 'medium',
    status: 'in_progress',
  },
  {
    title: 'Transverse Crack on Link Road',
    description: 'Long transverse crack spanning across two lanes in front of Infinity Mall. Needs joint sealing.',
    images: ['https://images.unsplash.com/photo-1599740831119-07284763eff2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [72.835123, 19.141234],
    },
    address: 'Link Road, Oshiwara, Andheri West, Mumbai 400053',
    severity: 'low',
    status: 'resolved',
    adminNotes: 'Repaired by sealing the crack using polymer modified bitumen on May 20, 2026.',
  },

  // Delhi
  {
    title: 'Deep Pothole on Ring Road near Lajpat Nagar',
    description: 'Dangerous pothole on the inner ring road, right after the flyover exit. High speed traffic makes this extremely risky.',
    images: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [77.243567, 28.567891],
    },
    address: 'Ring Road, Lajpat Nagar III, New Delhi 110024',
    severity: 'high',
    status: 'in_progress',
  },
  {
    title: 'Sunken road surface near Connaught Place',
    description: 'The road pavement has sunk by several inches near Outer Circle, causing vehicles to bounce violently.',
    images: ['https://images.unsplash.com/photo-1599740831119-07284763eff2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [77.218944, 28.629012],
    },
    address: 'Connaught Circus, Outer Circle, New Delhi 110001',
    severity: 'medium',
    status: 'pending',
  },
  {
    title: 'Longitudinal cracks in Dwarka Sector 10',
    description: 'Continuous longitudinal cracking along the shoulder of the main sector road. Water is seeping into the sub-base.',
    images: ['https://images.unsplash.com/photo-1599740831119-07284763eff2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [77.060123, 28.581234],
    },
    address: 'Sector 10 Road, Dwarka, New Delhi 110075',
    severity: 'low',
    status: 'approved',
  },
  {
    title: 'Massive pothole near Karol Bagh metro station',
    description: 'Huge pothole occupying almost half of the narrow service lane, causing traffic blockages and splash damage to pedestrians.',
    images: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [77.189567, 28.644123],
    },
    address: 'Pusa Road, Karol Bagh, New Delhi 110005',
    severity: 'high',
    status: 'resolved',
    adminNotes: 'Filled with asphalt concrete mix and compacted. Level checked and restored.',
  },

  // Bangalore
  {
    title: 'Huge pothole in Outer Ring Road (ORR) Bellandur',
    description: 'Classic ORR Bangalore pothole. Extremely wide and deep, filled with muddy water. Bumper-to-bumper traffic is worsening due to this.',
    images: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [77.674512, 12.927931],
    },
    address: 'Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
    severity: 'high',
    status: 'pending',
  },
  {
    title: 'Eroded road surface near Indiranagar 100ft road',
    description: 'Upper asphalt layer has completely worn off, exposing the underlying gravel and stones. Loose gravel causing two-wheelers to slip.',
    images: ['https://images.unsplash.com/photo-1599740831119-07284763eff2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [77.641234, 12.968945],
    },
    address: '100 Feet Road, Indiranagar, Bengaluru 560038',
    severity: 'medium',
    status: 'approved',
  },
  {
    title: 'Edge Cracking on Koramangala 80ft road',
    description: 'Road edge is breaking off near the drainage line. Heavy buses turning are further disintegrating the edge.',
    images: ['https://images.unsplash.com/photo-1599740831119-07284763eff2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [77.618956, 12.934123],
    },
    address: '80 Feet Road, Koramangala 4th Block, Bengaluru 560034',
    severity: 'medium',
    status: 'in_progress',
  },
  {
    title: 'Hazardous Manhole depression in Whitefield',
    description: 'A storm water drain manhole lid is sunken by 6 inches compared to the road level, forming a square pit on the road.',
    images: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [77.749567, 12.971234],
    },
    address: 'Whitefield Main Road, Pattandur Agrahara, Whitefield, Bengaluru 560066',
    severity: 'high',
    status: 'rejected',
    adminNotes: 'This manhole falls under the jurisdiction of BWSSB water authority, not BBMP road authority. Forwarded to BWSSB.',
  },
  {
    title: 'Crack sealing required in Jayanagar',
    description: 'Fine longitudinal cracks appearing near 4th Block main market. Sealing now will prevent major potholes next monsoon.',
    images: ['https://images.unsplash.com/photo-1599740831119-07284763eff2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [77.581234, 12.928956],
    },
    address: '9th Main Road, Jayanagar 4th Block, Bengaluru 560011',
    severity: 'low',
    status: 'resolved',
    adminNotes: 'Cracks filled with warm bitumen sealant. Smooth road condition restored.',
  },
  {
    title: 'Series of potholes in Electronic City Phase 1',
    description: 'Three consecutive potholes on the flyover down ramp. Vehicles are braking suddenly, making it a crash-prone zone.',
    images: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [77.662345, 12.851234],
    },
    address: 'Velankani Drive, Electronic City Phase 1, Bengaluru 560100',
    severity: 'high',
    status: 'approved',
  },
  {
    title: 'Pothole on MG Road near Metro Pillar 130',
    description: 'Deep circular pothole next to the metro column. Water pools here when it rains.',
    images: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80'],
    location: {
      type: 'Point',
      coordinates: [77.609567, 12.974123],
    },
    address: 'Mahatma Gandhi Road, Bengaluru 560001',
    severity: 'medium',
    status: 'pending',
  },
];

const seedData = async () => {
  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB for seeding...');

    // 2. Clear Existing Collections
    await User.deleteMany({});
    await Report.deleteMany({});
    await Detection.deleteMany({});
    console.log('🗑️ Cleared existing database tables');

    // 3. Create Users
    // Users are saved individually to trigger the pre-save bcrypt hook
    const createdUsers = [];
    for (const u of users) {
      const user = new User(u);
      await user.save();
      createdUsers.push(user);
    }
    console.log('👤 Seeded Auth Users:');
    createdUsers.forEach((u) => console.log(`   - ${u.name} (${u.email}) [Role: ${u.role}]`));

    const adminUser = createdUsers.find((u) => u.role === 'admin');
    const standardUser = createdUsers.find((u) => u.role === 'user');

    // 4. Create Reports and mock Detections
    console.log('📝 Seeding Reports & Detections...');
    for (let i = 0; i < sampleReports.length; i++) {
      const reportData = sampleReports[i];
      // Alternate reporters between user and admin
      reportData.user = i % 2 === 0 ? standardUser._id : adminUser._id;

      const report = new Report(reportData);
      await report.save();

      // Create a mock detection for 60% of reports
      if (i % 3 !== 0) {
        const classes = ['pothole', 'longitudinal_crack', 'transverse_crack', 'alligator_crack'];
        const damageClass = classes[i % classes.length];
        
        const detection = new Detection({
          report: report._id,
          originalImage: report.images[0],
          processedImage: report.images[0], // Demo fallback uses same image
          detections: [
            {
              class: damageClass,
              confidence: 0.72 + (i % 10) * 0.02,
              bbox: [100, 150 + i * 10, 200, 150],
              severity: report.severity,
            },
          ],
          summary: {
            totalDamages: 1,
            overallSeverity: report.severity,
            damageTypes: [damageClass],
          },
          processingTime: 120 + i * 15,
        });

        await detection.save();

        // Link detection back to report
        report.detectionResults = detection._id;
        await report.save();
      }
    }

    console.log(`✅ Seeded ${sampleReports.length} reports successfully!`);
    console.log('👋 Seeding complete. Exiting...');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
