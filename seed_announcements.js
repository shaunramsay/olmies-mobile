const http = require('http');

const announcements = [
  {
    Title: 'Welcome back for Semester 2!',
    Message: 'We are excited to see everyone back on campus. Please ensure your registration is finalized by Friday.',
    TargetAudience: 'Global',
    // No image
  },
  {
    Title: 'Food Menu: Jerk Chicken Thursday!',
    Message: 'The main cafeteria is serving our famous spicy Jerk Chicken with rice and peas. Arrive before 1:30 PM before it sells out!',
    TargetAudience: 'Global',
    // Using a reliable URL for the local test
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1d4075c6f5?auto=format&fit=crop&w=400&q=80'
  },
  {
    Title: 'Global Leadership Summit 2026',
    Message: 'The annual Global Leadership Summit is coming to the main auditorium! We are thrilled to invite all students to submit their applications for the Student Panel. This is a monumental opportunity to represent UTech Jamaica on a global stage, network with industry pioneers, and develop your leadership skills. Registration closes this Friday. Ensure your portfolio is updated before applying. We expect a massive turnout, so please arrive early on the day of the event to secure your seating. Note: Business casual attire is strictly enforced.',
    TargetAudience: 'Global',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

// Helper to post multipart form data without external libraries
function postAnnouncement(announcement) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary7x9M2yG8bK5mP3jL';
    let data = '';

    for (const [key, value] of Object.entries(announcement)) {
      if (value) {
        data += `--${boundary}\r\n`;
        data += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
        data += `${value}\r\n`;
      }
    }
    
    // Add dummy image data if imageUrl exists just to satisfy the form if needed, 
    // but the API also accepts the direct imageUrl param based on the C# code 
    // (We will just append the imageUrl to the form data for testing the DB insertion)
    
    data += `--${boundary}--\r\n`;

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/mobile/announcements',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Seeded: ${announcement.Title}`);
          resolve(responseBody);
        } else {
          console.error(`❌ Failed: ${announcement.Title} (Status ${res.statusCode}) - ${responseBody}`);
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    });

    req.on('error', error => {
      console.error('Error connecting to API:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function seedData() {
  console.log('Starting Announcement Seeding Process...');
  for (const item of announcements) {
    try {
      await postAnnouncement(item);
    } catch (e) {
      // ignore
    }
  }
  console.log('Seeding Complete.');
}

seedData();
