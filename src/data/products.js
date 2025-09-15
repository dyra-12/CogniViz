// Generate laptop products instead of generic ones
const generateProducts = () => {
  const brands = ['Dell', 'Lenovo', 'HP', 'Apple', 'Asus', 'Acer', 'MSI'];
  const cpus = ['Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9'];
  const rams = ['8GB', '16GB', '32GB', '64GB'];
  const storages = ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'];
  const gpus = ['Integrated', 'NVIDIA GTX 1650', 'NVIDIA RTX 3050', 'NVIDIA RTX 4060', 'AMD Radeon RX 6600'];
  
  const products = Array.from({ length: 24 }, (_, index) => {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const basePrice = Math.random() > 0.5 ? 600 + Math.random() * 1400 : 800 + Math.random() * 1200;
    const price = parseFloat(basePrice.toFixed(2));
    
    return {
      id: `laptop_${index + 1}`,
      name: `${brand} ${cpus[Math.floor(Math.random() * cpus.length)]} Laptop`,
      description: `High-performance ${brand} laptop with ${rams[Math.floor(Math.random() * rams.length)]} RAM and ${storages[Math.floor(Math.random() * storages.length)]} storage. Perfect for work and entertainment.`,
      price: price,
      originalPrice: parseFloat((price * (1 + Math.random() * 0.3)).toFixed(2)),
      brand: brand,
      category: 'Laptops',
      cpu: cpus[Math.floor(Math.random() * cpus.length)],
      ram: rams[Math.floor(Math.random() * rams.length)],
      storage: storages[Math.floor(Math.random() * storages.length)],
      gpu: gpus[Math.floor(Math.random() * gpus.length)],
      rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0 - 5.0
      reviewCount: Math.floor(Math.random() * 200),
      imageUrl: `https://picsum.photos/300/200?random=${index + 100}`,
      inStock: Math.random() > 0.2, // 80% chance in stock
      screenSize: `${13 + Math.floor(Math.random() * 6)} inch` // 13-18 inch
    };
  });

  // Add the specific Lenovo laptop as the 25th product
  products.push({
    id: 'laptop_lenovo_special',
    name: 'Lenovo ThinkPad X1 Carbon',
    description: 'Premium business laptop with Intel i7 processor, 16GB RAM, and 512GB SSD. Excellent build quality and performance.',
    price: 950,
    originalPrice: 1199,
    brand: 'Lenovo',
    category: 'Laptops',
    cpu: 'Intel i7',
    ram: '16GB',
    storage: '512GB SSD',
    gpu: 'Integrated',
    rating: 4.0,
    reviewCount: 147,
    imageUrl: 'https://picsum.photos/300/200?random=250',
    inStock: true,
    screenSize: '14 inch'
  });

  return products;
};

// Create the products array
const products = generateProducts();

// Get unique brands for filters
const getUniqueBrands = () => {
  return [...new Set(products.map(product => product.brand))].sort();
};

// Get unique RAM options
const getUniqueRAM = () => {
  return [...new Set(products.map(product => product.ram))].sort((a, b) => 
    parseInt(a) - parseInt(b)
  );
};

// Export everything
export { products, getUniqueBrands, getUniqueRAM };