const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const DATA_FILE = path.join(__dirname, '../data/reservations.json');
const CONTACT_FILE = path.join(__dirname, '../data/contacts.json');

function readData(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── Menu Data ──────────────────────────────────────────────────
const MENU = {
  signatures: [
    { id: 1, name: "Lebanese Breaking Balloon", category: "Starters", price: 580, tag: "Must Try", desc: "A theatrical presentation — crispy dough balloon shattering over vibrant mezze, hummus & spiced lamb filling.", veg: false, image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80" },
    { id: 2, name: "Basko Surf & Turf Wings", category: "Starters", price: 620, tag: "Chef's Special", desc: "Crispy chicken wings paired with juicy tiger prawns, tossed in our secret smoky glaze.", veg: false, image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80" },
    { id: 3, name: "Sesame Crusted Tofu Teriyaki", category: "Starters", price: 440, tag: "Veg Star", desc: "Golden sesame tofu, rich teriyaki glaze, microgreens — a delightful union of crisp and umami.", veg: true, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" },
    { id: 4, name: "Balochistan Raan", category: "Mains", price: 1480, tag: "Slow Cooked", desc: "18-hour slow-cooked whole lamb leg, fragrant with a blend of Baloch spices. Melt-in-mouth perfection.", veg: false, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80" },
    { id: 5, name: "Picante Twist", category: "Cocktails", price: 380, tag: "Bestseller", desc: "Our signature cocktail — a fiery blend of bold chilli notes with tangy citrus and smoky mezcal.", veg: true, image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" },
    { id: 6, name: "Basko Ball", category: "Cocktails", price: 360, tag: "Unique", desc: "Where buttered popcorn meets a refreshingly cool spirit base. Cinema magic in a glass.", veg: true, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80" },
    { id: 7, name: "Pan-Asian Ramen Bowl", category: "Mains", price: 540, tag: "Comfort", desc: "Rich tonkotsu-style broth, hand-pulled noodles, chashu pork, marinated egg, nori & bamboo shoots.", veg: false, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80" },
    { id: 8, name: "Turkish Mezze Platter", category: "Starters", price: 680, tag: "Share", desc: "A journey to Istanbul — hummus, baba ganoush, falafel, pita & assorted dips for the whole table.", veg: true, image: "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&q=80" },
  ],
  packages: [
    { id: "couple", name: "Couple's Night", price: 999, original: 1600, desc: "Reserved rooftop table, welcome drinks, 1 signature starter, dessert on special occasions", guests: "2" },
    { id: "group", name: "Group Celebration", price: 3499, original: 5200, desc: "Dedicated section, cocktail round, 2 sharing starters, custom cake, dedicated host", guests: "6" },
    { id: "corporate", name: "Corporate Dining", price: 1800, original: 2800, desc: "Private area, welcome mocktails, 3-course set menu, AV setup available", guests: "10" }
  ]
};

// ── API Routes ─────────────────────────────────────────────────
app.get('/api/menu', (req, res) => {
  res.json({ success: true, data: MENU });
});

app.post('/api/reservations', (req, res) => {
  const { name, phone, email, date, time, guests, occasion, requests, package: pkg } = req.body;
  if (!name || !phone || !date || !time || !guests) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
  }
  const reservations = readData(DATA_FILE);
  const newRes = {
    id: Date.now(),
    name, phone, email, date, time, guests, occasion,
    specialRequests: requests || '',
    package: pkg || 'standard',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };
  reservations.push(newRes);
  writeData(DATA_FILE, reservations);
  res.json({
    success: true,
    message: `Booking confirmed! Your table for ${guests} on ${date} at ${time} is reserved.`,
    bookingId: `BASKO-${newRes.id.toString().slice(-6)}`
  });
});

app.get('/api/reservations', (req, res) => {
  const reservations = readData(DATA_FILE);
  res.json({ success: true, data: reservations });
});

app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !message) return res.status(400).json({ success: false, message: 'Name and message required.' });
  const contacts = readData(CONTACT_FILE);
  contacts.push({ id: Date.now(), name, email, phone, message, createdAt: new Date().toISOString() });
  writeData(CONTACT_FILE, contacts);
  res.json({ success: true, message: "Message received! We'll get back to you within 2 hours." });
});

app.get('/api/availability', (req, res) => {
  const { date } = req.query;
  const reservations = readData(DATA_FILE);
  const dayReservations = reservations.filter(r => r.date === date);
  const slots = ['12:00', '13:00', '14:00', '15:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
  const availability = slots.map(slot => ({
    time: slot,
    available: dayReservations.filter(r => r.time === slot).length < 6
  }));
  res.json({ success: true, data: availability });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Basko server running on http://localhost:${PORT}`));
