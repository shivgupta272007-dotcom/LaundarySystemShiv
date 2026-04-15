// Configurable garment pricing — easy to update
const GARMENT_PRICES = {
  'Shirt':       40,
  'T-Shirt':     35,
  'Pants':       50,
  'Jeans':       60,
  'Shorts':      35,
  'Saree':       120,
  'Suit (2pc)':  200,
  'Suit (3pc)':  280,
  'Blazer':      150,
  'Jacket':      160,
  'Kurta':       60,
  'Kurta Pajama':100,
  'Sherwani':    350,
  'Lehenga':     400,
  'Dress':       120,
  'Skirt':       50,
  'Sweater':     70,
  'Coat':        180,
  'Bedsheet':    80,
  'Blanket':     150,
  'Curtain (per panel)': 100,
  'Towel':       30,
};

// Average processing time in hours per garment type
const PROCESSING_HOURS = {
  default: 24,       // 1 day
  express: 6,        // 6 hours
  heavy:   48,       // 2 days — for sarees, suits, lehengas, etc.
};

const HEAVY_GARMENTS = ['Saree', 'Suit (2pc)', 'Suit (3pc)', 'Blazer', 'Sherwani', 'Lehenga', 'Coat', 'Blanket', 'Curtain (per panel)'];

function getEstimatedDeliveryDate(garments) {
  const hasHeavy = garments.some(g => HEAVY_GARMENTS.includes(g.garmentType));
  const hours = hasHeavy ? PROCESSING_HOURS.heavy : PROCESSING_HOURS.default;
  const delivery = new Date();
  delivery.setHours(delivery.getHours() + hours);
  return delivery;
}

module.exports = { GARMENT_PRICES, PROCESSING_HOURS, HEAVY_GARMENTS, getEstimatedDeliveryDate };
