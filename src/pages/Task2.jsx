import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { products, getUniqueCategories } from '../data/products';
import ProductCard from '../components/ProductCard';
import Filters from '../components/Filters';
import useLogger from '../hooks/useLogger';

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

const Task2 = () => {
  const { log } = useLogger();
  const categories = getUniqueCategories();
  
  const [filters, setFilters] = useState({
    categories: [],
    maxPrice: 500,
    minRating: 0,
    inStockOnly: false,
    sortBy: 'name'
  });

  const [filteredProducts, setFilteredProducts] = useState(products);

  // Log initial view
  useEffect(() => {
    log('catalog_view', { totalProducts: products.length });
  }, [log]);

  // Filter and sort products
  useMemo(() => {
    let result = [...products];

    // Apply category filter
    if (filters.categories.length > 0) {
      result = result.filter(product => 
        filters.categories.includes(product.category)
      );
    }

    // Apply price filter
    result = result.filter(product => product.price <= filters.maxPrice);

    // Apply rating filter
    if (filters.minRating > 0) {
      result = result.filter(product => product.rating >= filters.minRating);
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

    if (filterType === 'categories') {
      newValue = isChecked 
        ? [...filters.categories, value]
        : filters.categories.filter(cat => cat !== value);
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
      categories: [],
      maxPrice: 500,
      minRating: 0,
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
      category: product.category,
      price: product.price
    });
    // In a real app, you might navigate to a product detail page
    alert(`Viewing details for: ${product.name}`);
  };

  return (
    <PageContainer>
      <PageTitle>Product Catalog</PageTitle>
      
      <ContentLayout>
        <Filters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          categories={categories}
        />
        
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
      </ContentLayout>
    </PageContainer>
  );
};

export default Task2;