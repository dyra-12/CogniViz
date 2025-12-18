import { useState, useEffect, useMemo, useRef } from 'react';
import useTask2Logger from '../hooks/useTask2Logger';
import styled from 'styled-components';
import { products, getUniqueBrands, getUniqueRAM } from '../data/products';
import ProductCard from '../components/ProductCard';
import Filters from '../components/Filters';
import RequirementsChecklist from '../components/RequirementsChecklist';
import useLogger from '../hooks/useLogger';
import { useTaskProgress } from '../contexts/TaskProgressContext';
import { useCognitiveLoad } from '../contexts/CognitiveLoadContext';
import { boostSimulationActivity, setSimulationTask } from '../telemetry/wsClient';
import CognitiveLoadGauge from '../components/CognitiveLoadGauge';
import ExplanationBanner from '../components/ExplanationBanner';
import TopFactorsList from '../components/TopFactorsList';

const LOW_EXPLANATION = 'Low cognitive load detected. Decisive selection behavior observed.';
const MEDIUM_EXPLANATION = 'Moderate cognitive load detected due to active comparison across multiple options.';


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
  gap: ${props => props.theme.spacing[3]};
  flex-wrap: wrap;
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

const AdaptiveNotice = styled.div`
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing[4]};
  border: 1px solid ${props => props.theme.colors.gray200};
  background: ${props => props.$load === 'High'
    ? 'rgba(247,37,133,0.08)'
    : props.$load === 'Medium'
      ? 'rgba(247,127,0,0.08)'
      : 'rgba(67,97,238,0.05)'};
  margin-bottom: ${props => props.theme.spacing[5]};
`;

const NoticeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: ${props => props.theme.colors.dark};
`;

const InsightChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing[2]};
  margin-top: ${props => props.theme.spacing[3]};
`;

const InsightChip = styled.span`
  font-size: ${props => props.theme.fontSizes.sm};
  padding: ${props => props.theme.spacing[1]} ${props => props.theme.spacing[3]};
  border-radius: 999px;
  background: ${props => props.theme.colors.white};
  border: 1px solid ${props => props.theme.colors.gray200};
`;

const QuickActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing[2]};
  margin-top: ${props => props.theme.spacing[3]};
`;

const QuickActionButton = styled.button`
  border: none;
  background: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: 600;
`;

const FocusTag = styled.span`
  background: ${props => props.theme.colors.warning}15;
  color: ${props => props.theme.colors.warning};
  border-radius: 999px;
  padding: ${props => props.theme.spacing[1]} ${props => props.theme.spacing[2]};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: 600;
`;

const ShowAllButton = styled.button`
  margin-top: ${props => props.theme.spacing[3]};
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  font-weight: 600;
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
  const logger = useTask2Logger();
  const { updateState: updateCognitiveLoad } = useCognitiveLoad();
  const [loadState, setLoadState] = useState('MEDIUM');
  const isHighLoad = false; // Task 2 never goes High
  const insights = [];
  const loadTitle = loadState === 'LOW' ? 'Decisive selection' : 'Active exploration';
  const loadMessage = loadState === 'LOW' ? LOW_EXPLANATION : MEDIUM_EXPLANATION;
  // Expose logger globally for ProductCard click precision
  if (typeof window !== 'undefined') {
    window.__task2Logger = logger;
  }
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
  const [presetApplied, setPresetApplied] = useState(false);
  const [showFullResults, setShowFullResults] = useState(true);

  // Exploration metrics (local heuristic for Task 2 only)
  const metricsRef = useRef({
    startTs: performance.now(),
    uniqueProducts: new Set(),
    uniqueFilters: new Set(),
    hoverOscillations: 0,
    hoverSwitches: 0,
    filterChanges: 0,
    actionTimestamps: [],
    lastHoverProduct: null,
    prevHoverProduct: null,
    decisionMade: false,
    timeToDecisionMs: null,
  });

  const ACTION_WINDOW_MS = 30000;

  const recordAction = () => {
    const now = performance.now();
    metricsRef.current.actionTimestamps.push(now);
    // prune
    metricsRef.current.actionTimestamps = metricsRef.current.actionTimestamps.filter(ts => now - ts <= ACTION_WINDOW_MS);
  };

  const updateLoadMetrics = () => {
    const now = performance.now();
    const m = metricsRef.current;
    const actionDensity = m.actionTimestamps.length / 10; // normalized simple proxy
    const explorationBreadth = m.uniqueProducts.size + m.uniqueFilters.size;
    const loadLevel = (() => {
      // Default MEDIUM
      // LOW when decisive: low breadth, no oscillations, quick decision
      const decisive = m.decisionMade
        && m.timeToDecisionMs !== null
        && m.timeToDecisionMs < 20000
        && m.uniqueProducts.size <= 2
        && m.hoverOscillations === 0
        && m.filterChanges <= 1;
      return decisive ? 'LOW' : 'MEDIUM';
    })();
    setLoadState(loadLevel);

    const topFactors = loadLevel === 'MEDIUM'
      ? ['Decision Uncertainty', 'Exploration Breadth', 'Multitasking Load']
      : ['Focused Exploration ↓', 'Decisive Action'];

    const metricsPayload = {
      'Decision Uncertainty': loadLevel === 'MEDIUM' ? Math.min(1, m.hoverOscillations / 5) : 0,
      'Exploration Breadth': loadLevel === 'MEDIUM' ? Math.min(1, explorationBreadth / 6) : 0,
      'Multitasking Load': loadLevel === 'MEDIUM' ? Math.min(1, (m.filterChanges + m.hoverSwitches) / 10 + actionDensity / 5) : 0,
      'Focused Exploration': loadLevel === 'LOW' ? Math.max(0, 1 - explorationBreadth / 4) : 0,
    };

    const explanation = loadLevel === 'LOW' ? LOW_EXPLANATION : MEDIUM_EXPLANATION;

    updateCognitiveLoad({
      loadLevel,
      metrics: metricsPayload,
      topFactors,
      explanation,
    });
  };

  useEffect(() => {
    if (isHighLoad) {
      setShowFullResults(false);
    } else {
      setShowFullResults(true);
    }
  }, [isHighLoad]);

  // Log initial view
  useEffect(() => {
    log('catalog_view', { totalProducts: products.length });
    logger.markStart();
    updateLoadMetrics();
  }, [log]);

  useEffect(() => {
    setSimulationTask(2);
  }, []);

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

  const handleFilterChange = (filterType, value, isChecked = null, action = null) => {
    const previousFilters = { ...filters };
    let newValue = value;
    let filterAction = action;
    if (!filterAction) {
      filterAction = (filterType === 'brands' || filterType === 'rams') ? 'checkbox_click' : (filterType === 'minPrice' || filterType === 'maxPrice') ? 'slider_drag' : 'dropdown_select';
    }
    if (filterType === 'brands' || filterType === 'rams') {
      newValue = isChecked 
        ? [...filters[filterType], value]
        : filters[filterType].filter(item => item !== value);
    }
    logger.logFilterUse(filterType, filterAction, previousFilters[filterType], newValue);
    metricsRef.current.uniqueFilters.add(filterType);
    metricsRef.current.filterChanges += 1;
    recordAction();
    updateLoadMetrics();
    setFilters(prev => ({
      ...prev,
      [filterType]: newValue
    }));
    log('filter_apply', {
      filterType,
      value: newValue,
      previousValue: previousFilters[filterType]
    });
    boostSimulationActivity(0.2);
  };

  const applyRecommendedPreset = () => {
    const preset = {
      minPrice: 800,
      maxPrice: 1200,
      brands: ['Dell', 'Lenovo'],
      minRating: 4,
      rams: ['16GB'],
      inStockOnly: true,
      sortBy: 'rating'
    };
    setFilters(preset);
    setPresetApplied(true);
    log('adaptive_filter_preset', { source: 'cognitive_load', loadState, preset });
    boostSimulationActivity(0.3);
  };

  useEffect(() => {
    if (!isHighLoad) {
      setPresetApplied(false);
    }
  }, [isHighLoad]);

  const handleClearFilters = () => {
    logger.logFilterReset();
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
    boostSimulationActivity(0.15);
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    log('sort_apply', { sortBy: newSort, previousSort: filters.sortBy });
    setFilters(prev => ({ ...prev, sortBy: newSort }));
    boostSimulationActivity(0.1);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    metricsRef.current.decisionMade = true;
    metricsRef.current.timeToDecisionMs = performance.now() - metricsRef.current.startTs;
    recordAction();
    updateLoadMetrics();
    log('product_click', {
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price
    });
    // Optionally: logger.logProductClick(product.id);
    boostSimulationActivity(0.25);
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
      logger.logFilterError();
      return;
    }
    setSelectedProduct(product);
    metricsRef.current.decisionMade = true;
    metricsRef.current.timeToDecisionMs = performance.now() - metricsRef.current.startTs;
    recordAction();
    updateLoadMetrics();
    log('add_to_cart', {
      productId: product.id,
      productName: product.name,
      price: product.price
    });
    boostSimulationActivity(0.35);
    logger.markEnd();
    logger.saveToLocalStorage(true);
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
    boostSimulationActivity(0.4);
    completeCurrentTask();
  };

  const displayedProducts = showFullResults ? filteredProducts : filteredProducts.slice(0, 6);
  const clampedResults = !showFullResults && filteredProducts.length > displayedProducts.length;

  // Product hover/click logging for exploration
  // Attach these to ProductCard via props if needed

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

      <AdaptiveNotice $load={loadState}>
        <NoticeHeader>
          <span>{loadTitle}</span>
          <span style={{ fontSize: '0.85rem', color: '#475569' }}>{loadState}</span>
        </NoticeHeader>
        <p style={{ marginTop: '0.35rem', fontSize: '0.9rem', color: '#475569' }}>{loadMessage}</p>
        {/* insights removed due to missing cognitiveLoadHints */}
        {isHighLoad && (
          <QuickActions>
            <QuickActionButton type="button" onClick={applyRecommendedPreset}>
              {presetApplied ? 'Preset Applied' : 'Apply Laptop Preset'}
            </QuickActionButton>
            <QuickActionButton
              type="button"
              onClick={() => {
                setShowFullResults(true);
                log('adaptive_show_all_products', { loadState });
              }}
            >
              Show All Results
            </QuickActionButton>
          </QuickActions>
        )}
      </AdaptiveNotice>
      
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
              Showing {displayedProducts.length} of {filteredProducts.length} filtered products
            </ResultsCount>
            {isHighLoad && (
              <FocusTag>Focus Mode</FocusTag>
            )}
            <SortSelect value={filters.sortBy} onChange={handleSortChange}>
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </SortSelect>
          </ResultsInfo>

          <ProductsGrid>
            {displayedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={handleProductClick}
                onAddToCart={handleAddToCart}
                onProductHoverStart={() => {
                  const last = metricsRef.current.lastHoverProduct;
                  const prev = metricsRef.current.prevHoverProduct;
                  if (last && last !== product.id) {
                    metricsRef.current.hoverSwitches += 1;
                    if (prev && prev === product.id) {
                      metricsRef.current.hoverOscillations += 1; // A->B->A pattern
                    }
                    metricsRef.current.prevHoverProduct = last;
                  }
                  metricsRef.current.lastHoverProduct = product.id;
                  metricsRef.current.uniqueProducts.add(product.id);
                  recordAction();
                  updateLoadMetrics();
                  logger.logProductHoverStart(product.id);
                }}
                onProductHoverEnd={() => logger.logProductHoverEnd(product.id)}
              />
            ))}
          </ProductsGrid>

          {filteredProducts.length === 0 && (
            <NoProducts>
              <h3>No products found</h3>
              <p>Try adjusting your filters to see more results.</p>
            </NoProducts>
          )}

          {clampedResults && (
            <ShowAllButton
              type="button"
              onClick={() => {
                setShowFullResults(true);
                log('adaptive_show_all_products', { loadState, mode: 'from_hint' });
              }}
            >
              Show all {filteredProducts.length} products
            </ShowAllButton>
          )}
        </div>

        {/* Right Sidebar - Requirements Checklist */}
        <Sidebar>
          <CognitiveLoadGauge />
          <ExplanationBanner />
          <TopFactorsList />
          <RequirementsChecklist 
            filters={filters}
            selectedProduct={selectedProduct}
            checkoutStep={checkoutStep}
            onAction={handleChecklistAction}
            highlight={isHighLoad}
          />
        </Sidebar>
      </ContentLayout>
    </PageContainer>
  );
};

export default Task2;