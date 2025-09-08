// Generate a robust set of mock products
export const generateProducts = () => {
  const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Sports'];
  const brands = ['Acme', 'Stark', 'Wayne', 'Oz', 'Wonka'];
  
  return Array.from({ length: 30 }, (_, index) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const price = parseFloat((Math.random() * 500 + 10).toFixed(2)); // $10 - $510
    const rating = parseFloat((Math.random() * 3 + 2).toFixed(1)); // 2.0 - 5.0
    
    return {
      id: `prod_${index + 1}`,
      name: `${brands[Math.floor(Math.random() * brands.length)]} ${category.substring(0, 4)}-${index + 100}`,
      description: `High-quality ${category.toLowerCase()} product designed for modern needs. Features premium materials and excellent craftsmanship.`,
      price: price,
      originalPrice: parseFloat((price * (1 + Math.random() * 0.3)).toFixed(2)), // Original price 0-30% higher
      category: category,
      rating: rating,
      reviewCount: Math.floor(Math.random() * 200),
      imageUrl: `https://picsum.photos/300/200?random=${index}`, // Random image for each product
      inStock: Math.random() > 0.1, // 90% chance in stock
      featured: Math.random() > 0.7, // 30% chance featured
      tags: ['new', 'sale', 'popular'].filter(() => Math.random() > 0.7)
    };
  });
};

export const products = generateProducts();

// Get unique categories for filters
export const getUniqueCategories = () => {
  return [...new Set(products.map(product => product.category))].sort();
};