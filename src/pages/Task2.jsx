import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { products, getUniqueBrands, getUniqueRAM } from '../data/products';
import ProductCard from '../components/ProductCard';
import Filters from '../components/Filters';
import useLogger from '../hooks/useLogger';
import { useTaskProgress } from '../contexts/TaskProgressContext';

const PageContainer = styled.div`
  padding: ${props => props.theme.spacing[6]} 0;
`;

const PageTitle = styled.h1`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing[8]};
  color: ${props => props.theme.colors.primary};
`;

const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: ${props => props.theme.spacing[8]};
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 ${props => props.theme.spacing[4]};

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing[6]};
  align-items: start;
`;

const ResultsInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing[6]};
  padding: ${props => props.theme.spacing[4]};
  background: ${props => props.theme.colors.gray100};
  border-radius: ${props => props.theme.borderRadius.lg};
`;

const ResultsCount = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.gray700};
`;

const SortSelect = styled.select`
  padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
  border: 1px solid ${props => props.theme.colors.gray300};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.white};
  font-size: ${props => props.theme.fontSizes.sm};
`;

const NoProducts = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: ${props => props.theme.spacing[12]};
  color: ${props => props.theme.colors.gray600};
`;

const SuccessMessage = styled.div`
  grid-column: 1 / -1;
  background: ${props => props.theme.colors.success}15;
  color: ${props => props.theme.colors.success};
  padding: ${props => props.theme.spacing[6]};
  border-radius: ${props => props.theme.borderRadius.xl};
  text-align: center;
  border: 1px solid ${props => props.theme.colors.success}30;
  margin: ${props => props.theme.spacing[8]} auto;
  max-width: 500px;
`;

const Container = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: ${props => props.theme.spacing[6]};
`;

const Task2 = () => {
  const { log } = useLogger();
  const { completeCurrentTask } = useTaskProgress();
  const brands = getUniqueBrands();
  const rams = getUniqueRAM();
  
  const [filters, setFilters] = useState({
    maxPrice: 1200,
    brands: [],
    minRating: 4,
    rams: ['16GB', '32GB', '64GB'],
    inStockOnly: false,
    sortBy: 'name'
  });

  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState('browsing'); // browsing, cart, checkout

  // Log initial view
  useEffect(() => {
    log('catalog_view', { 
      catalogType: 'laptops',
      totalProducts: products.length 
    });
  }, [log]);

  // Filter and sort products
  useMemo(() => {
    let result = [...products];

    // Apply price filter ($800-$1200 range)
    result = result.filter(product => product.price >= 800 && product.price <= filters.maxPrice);

    // Apply brand filter (Dell or Lenovo)
    if (filters.brands.length > 0) {
      result = result.filter(product => 
        filters.brands.includes(product.brand)
      );
    }

    // Apply rating filter
    if (filters.minRating > 0) {
      result = result.filter(product => product.rating >= filters.minRating);
    }

    // Apply RAM filter (at least 16GB)
    if (filters.rams.length > 0) {
      result = result.filter(product => 
        filters.rams.includes(product.ram)
      );
    }

    // Apply stock filter
    if (filters.inStockOnly) {
      result = result.filter(product => product.inStock);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredProducts(result);
  }, [filters]);

  const handleFilterChange = (filterType, value, isChecked = null) => {
    const previousFilters = { ...filters };
    let newValue = value;

    if (filterType === 'brands' || filterType === 'rams') {
      newValue = isChecked 
        ? [...filters[filterType], value]
        : filters[filterType].filter(item => item !== value);
    }

    setFilters(prev => ({
      ...prev,
      [filterType]: newValue
    }));

    // Log the filter interaction
    log('filter_apply', {
      filterType,
      value: newValue,
      previousValue: previousFilters[filterType]
    });
  };

  const handleClearFilters = () => {
    log('filters_clear', { previousFilters: filters });
    setFilters({
      maxPrice: 1200,
      brands: [],
      minRating: 4,
      rams: ['16GB', '32GB', '64GB'],
      inStockOnly: false,
      sortBy: 'name'
    });
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    log('sort_apply', { sortBy: newSort, previousSort: filters.sortBy });
    setFilters(prev => ({ ...prev, sortBy: newSort }));
  };

  const handleProductClick = (product) => {
    log('product_click', {
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      price: product.price,
      rating: product.rating,
      ram: product.ram
    });
    setSelectedProduct(product);
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      log('add_to_cart', {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        brand: selectedProduct.brand,
        price: selectedProduct.price,
        rating: selectedProduct.rating,
        ram: selectedProduct.ram
      });
      setCheckoutStep('cart');
    }
  };

  const handleProceedToCheckout = () => {
    log('proceed_to_checkout', {
      product: selectedProduct
    });
    setCheckoutStep('checkout');
  };

  const handleCompletePurchase = () => {
    log('purchase_complete', {
      product: selectedProduct,
      totalAmount: selectedProduct.price
    });
    completeCurrentTask();
  };

  // Checkout Steps
  if (checkoutStep === 'cart') {
    return (
      <Container>
        <SuccessMessage>
          <h3>🛒 Added to Cart!</h3>
          <p>Your selected laptop has been added to the shopping cart.</p>
          <button 
            onClick={handleProceedToCheckout}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4361ee',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '1rem'
            }}
          >
            Proceed to Checkout
          </button>
        </SuccessMessage>
      </Container>
    );
  }

  if (checkoutStep === 'checkout') {
    return (
      <Container>
        <SuccessMessage>
          <h3>✅ Order Complete!</h3>
          <p>Thank you for your purchase. Your order has been processed successfully.</p>
          <button 
            onClick={handleCompletePurchase}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4361ee',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '1rem'
            }}
          >
            Continue to Next Task
          </button>
        </SuccessMessage>
      </Container>
    );
  }

  return (
    <PageContainer>
      <PageTitle>Find Your Perfect Laptop</PageTitle>
      
      <ContentLayout>
        <Filters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          brands={brands}
          rams={rams}
        />
        
        <div>
          <ResultsInfo>
            <ResultsCount>
              Showing {filteredProducts.length} of {products.length} laptops
            </ResultsCount>
            <SortSelect value={filters.sortBy} onChange={handleSortChange}>
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </SortSelect>
          </ResultsInfo>

          <ProductsGrid>
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={handleProductClick}
              />
            ))}
          </ProductsGrid>

          {filteredProducts.length === 0 && (
            <NoProducts>
              <h3>No laptops found</h3>
              <p>Try adjusting your filters to see more results.</p>
              <p>Remember: You need a laptop between $800-$1200, Dell or Lenovo, 4+ stars, and at least 16GB RAM.</p>
            </NoProducts>
          )}
        </div>
      </ContentLayout>

      {/* Selected Product Action Panel */}
      {selectedProduct && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          padding: '1rem',
          borderTop: '2px solid #4361ee',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 1rem'
          }}>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Selected: {selectedProduct.name}</h4>
              <p style={{ margin: 0, color: '#666' }}>
                ${selectedProduct.price} • {selectedProduct.ram} • ⭐{selectedProduct.rating}
              </p>
            </div>
            <button 
              onClick={handleAddToCart}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4361ee',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default Task2;