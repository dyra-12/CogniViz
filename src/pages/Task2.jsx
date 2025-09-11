import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { products, getUniqueBrands, getUniqueRAM } from '../data/products';
import ProductCard from '../components/ProductCard';
import Filters from '../components/Filters';
import RequirementsChecklist from '../components/RequirementsChecklist';
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
  grid-template-columns: 300px 1fr 350px;
  gap: ${props => props.theme.spacing[8]};
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 ${props => props.theme.spacing[4]};

  @media (max-width: 1200px) {
    grid-template-columns: 300px 1fr;
  }

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

const Container = styled.div`
  max-width: 500px;
  margin: 2rem auto;
  padding: ${props => props.theme.spacing[6]};
`;

const SuccessMessage = styled.div`
  padding: ${props => props.theme.spacing[6]};
  background-color: ${props => props.theme.colors.success}15;
  color: ${props => props.theme.colors.success};
  border-radius: ${props => props.theme.borderRadius.xl};
  text-align: center;
  border: 1px solid ${props => props.theme.colors.success}30;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[6]};
  position: sticky;
  top: ${props => props.theme.spacing[4]};
  height: fit-content;
  max-height: calc(100vh - 100px);
  overflow-y: auto;

  @media (max-width: 1200px) {
    grid-column: 1 / -1;
    position: relative;
    top: 0;
    max-height: none;
  }
`;

const Task2 = () => {
  const { log } = useLogger();
  const { completeCurrentTask } = useTaskProgress();
  const brands = getUniqueBrands();
  const rams = getUniqueRAM();
  
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 2000,
    brands: [],
    minRating: 0,
    rams: [],
    inStockOnly: false,
    sortBy: 'name'
  });

  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState('browsing');

  // Log initial view
  useEffect(() => {
    log('catalog_view', { totalProducts: products.length });
  }, [log]);

  // Filter and sort products
  useMemo(() => {
    let result = [...products];

    // Apply price filter (both min and max)
    result = result.filter(product => 
      product.price >= filters.minPrice && product.price <= filters.maxPrice
    );

    // Apply brand filter
    if (filters.brands.length > 0) {
      result = result.filter(product => filters.brands.includes(product.brand));
    }

    // Apply rating filter
    if (filters.minRating > 0) {
      result = result.filter(product => product.rating >= filters.minRating);
    }

    // Apply RAM filter
    if (filters.rams.length > 0) {
      result = result.filter(product => filters.rams.includes(product.ram));
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

    log('filter_apply', {
      filterType,
      value: newValue,
      previousValue: previousFilters[filterType]
    });
  };

  const handleClearFilters = () => {
    log('filters_clear', { previousFilters: filters });
    setFilters({
      minPrice: 0,
      maxPrice: 2000,
      brands: [],
      minRating: 0,
      rams: [],
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
    setSelectedProduct(product);
    log('product_click', {
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price
    });
  };

  const handleAddToCart = (product) => {
    // Validate that the selected product meets all filter requirements
    const meetsPrice = product.price >= 800 && product.price <= 1200;
    const meetsBrand = ['Dell', 'Lenovo'].includes(product.brand);
    const meetsRating = product.rating >= 4;
    const meetsRAM = ['16GB', '32GB', '64GB'].includes(product.ram);
    
    if (!meetsPrice || !meetsBrand || !meetsRating || !meetsRAM) {
      log('add_to_cart_failed', {
        productId: product.id,
        meetsPrice,
        meetsBrand,
        meetsRating,
        meetsRAM
      });
      return;
    }

    setSelectedProduct(product);
    log('add_to_cart', {
      productId: product.id,
      productName: product.name,
      price: product.price
    });
    setCheckoutStep('cart');
  };

  const handleChecklistAction = () => {
    switch (checkoutStep) {
      case 'browsing':
        if (selectedProduct) {
          handleAddToCart(selectedProduct);
        }
        break;
      case 'cart':
        handleCompleteTask();
        break;
      case 'checkout':
        handleCompleteTask();
        break;
    }
  };

  const handleCompleteTask = () => {
    // Final validation - ensure ALL requirements are met
    const meetsPrice = selectedProduct && selectedProduct.price >= 800 && selectedProduct.price <= 1200;
    const meetsBrand = selectedProduct && ['Dell', 'Lenovo'].includes(selectedProduct.brand);
    const meetsRating = selectedProduct && selectedProduct.rating >= 4;
    const meetsRAM = selectedProduct && ['16GB', '32GB', '64GB'].includes(selectedProduct.ram);
    const hasSelectedProduct = !!selectedProduct;

    if (!meetsPrice || !meetsBrand || !meetsRating || !meetsRAM || !hasSelectedProduct) {
      log('task_failed_validation', {
        meetsPrice,
        meetsBrand,
        meetsRating,
        meetsRAM,
        hasSelectedProduct
      });
      return;
    }

    log('task_complete', {
      product: selectedProduct,
      totalCost: selectedProduct.price
    });
    completeCurrentTask();
  };

  // Checkout UI steps
  if (checkoutStep === 'cart') {
    return (
      <Container>
        <SuccessMessage>
          <h3>🛒 Added to Cart!</h3>
          <p>Your selected laptop has been added to the shopping cart.</p>
          <button 
            onClick={handleCompleteTask}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#4361ee',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              marginTop: '1rem'
            }}
          >
            Complete Task
          </button>
        </SuccessMessage>
      </Container>
    );
  }

  return (
    <PageContainer>
      <PageTitle>Find the Perfect Laptop</PageTitle>
      
      <ContentLayout>
        {/* Left Sidebar - Filters */}
        <div>
          <Filters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            brands={brands}
            rams={rams}
          />
        </div>
        
        {/* Main Content - Products */}
        <div>
          <ResultsInfo>
            <ResultsCount>
              Showing {filteredProducts.length} of {products.length} products
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
                onAddToCart={handleAddToCart}
              />
            ))}
          </ProductsGrid>

          {filteredProducts.length === 0 && (
            <NoProducts>
              <h3>No products found</h3>
              <p>Try adjusting your filters to see more results.</p>
            </NoProducts>
          )}
        </div>

        {/* Right Sidebar - Requirements Checklist */}
        <Sidebar>
          <RequirementsChecklist 
            filters={filters}
            selectedProduct={selectedProduct}
            checkoutStep={checkoutStep}
            onAction={handleChecklistAction}
          />
        </Sidebar>
      </ContentLayout>
    </PageContainer>
  );
};

export default Task2;