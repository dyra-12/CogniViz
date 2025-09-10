import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const FiltersContainer = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[6]};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.md};
  margin-bottom: ${props => props.theme.spacing[6]};
  height: fit-content;
`;

const FilterTitle = styled.h3`
  margin-bottom: ${props => props.theme.spacing[4]};
  color: ${props => props.theme.colors.dark};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary};
  font-size: ${props => props.theme.fontSizes.sm};
  cursor: pointer;
  padding: 0;
  text-decoration: underline;

  &:hover {
    color: ${props => props.theme.colors.secondary};
  }
`;

const FilterGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const FilterLabel = styled.label`
  display: block;
  margin-bottom: ${props => props.theme.spacing[3]};
  font-weight: 600;
  color: ${props => props.theme.colors.gray700};
`;

const CheckboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[2]};
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[3]};
  cursor: pointer;
  padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.gray100};
  }
`;

const CheckboxInput = styled.input`
  width: 18px;
  height: 18px;
  accent-color: ${props => props.theme.colors.primary};
`;

// Dual Range Slider Styles
const RangeSliderContainer = styled.div`
  position: relative;
  height: 40px;
  display: flex;
  align-items: center;
  margin: ${props => props.theme.spacing[4]} 0;
`;

const SliderTrack = styled.div`
  position: absolute;
  height: 4px;
  width: 100%;
  background: ${props => props.theme.colors.gray300};
  border-radius: 2px;
  z-index: 1;
`;

const SliderRange = styled.div`
  position: absolute;
  height: 4px;
  background: ${props => props.theme.colors.primary};
  border-radius: 2px;
  z-index: 2;
  left: ${props => props.left}%;
  width: ${props => props.width}%;
`;

const SliderInput = styled.input`
  position: absolute;
  width: 100%;
  height: 0;
  pointer-events: none;
  appearance: none;
  z-index: 3;

  &::-webkit-slider-thumb {
    appearance: none;
    height: 18px;
    width: 18px;
    border-radius: 50%;
    background: ${props => props.theme.colors.primary};
    cursor: pointer;
    pointer-events: all;
    box-shadow: 0 0 0 1px #fff, 0 2px 4px rgba(0,0,0,0.2);
  }

  &::-moz-range-thumb {
    appearance: none;
    height: 18px;
    width: 18px;
    border-radius: 50%;
    background: ${props => props.theme.colors.primary};
    cursor: pointer;
    pointer-events: all;
    box-shadow: 0 0 0 1px #fff, 0 2px 4px rgba(0,0,0,0.2);
    border: none;
  }
`;

const PriceValues = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${props => props.theme.spacing[4]};
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.gray600};
`;

const PriceDisplay = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
`;

const StarRatingFilter = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[2]};
`;

const StarButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
  background: ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.active ? props.theme.colors.white : props.theme.colors.gray700};
  border: 1px solid ${props => props.active ? props.theme.colors.primary : props.theme.colors.gray300};
  padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? props.theme.colors.primary : props.theme.colors.gray100};
  }
`;

const Filters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  brands,
  rams
}) => {
  const minPriceRef = useRef(0);
  const maxPriceRef = useRef(2000);
  const [minVal, setMinVal] = useState(filters.minPrice);
  const [maxVal, setMaxVal] = useState(filters.maxPrice);

  useEffect(() => {
    setMinVal(filters.minPrice);
    setMaxVal(filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), maxVal - 1);
    setMinVal(value);
    onFilterChange('minPrice', value);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), minVal + 1);
    setMaxVal(value);
    onFilterChange('maxPrice', value);
  };

  const minPercent = ((minVal - minPriceRef.current) / (maxPriceRef.current - minPriceRef.current)) * 100;
  const maxPercent = ((maxVal - minPriceRef.current) / (maxPriceRef.current - minPriceRef.current)) * 100;

  return (
    <FiltersContainer>
      <FilterTitle>
        Filters
        <ClearButton onClick={onClearFilters}>
          Clear All
        </ClearButton>
      </FilterTitle>

      {/* Price Range Filter with Dual Slider */}
      <FilterGroup>
        <FilterLabel>Price Range</FilterLabel>
        <RangeSliderContainer>
          <SliderTrack />
          <SliderRange left={minPercent} width={maxPercent - minPercent} />
          
          <SliderInput
            type="range"
            min={minPriceRef.current}
            max={maxPriceRef.current}
            value={minVal}
            onChange={handleMinChange}
            style={{ zIndex: minVal > maxPriceRef.current - 100 ? '4' : '3' }}
          />
          
          <SliderInput
            type="range"
            min={minPriceRef.current}
            max={maxPriceRef.current}
            value={maxVal}
            onChange={handleMaxChange}
          />
        </RangeSliderContainer>

        <PriceValues>
          <div>
            Min: <PriceDisplay>${minVal}</PriceDisplay>
          </div>
          <div>
            Max: <PriceDisplay>${maxVal}</PriceDisplay>
          </div>
        </PriceValues>
      </FilterGroup>

      {/* Brand Filter */}
      <FilterGroup>
        <FilterLabel>Brand</FilterLabel>
        <CheckboxContainer>
          {brands.map(brand => (
            <CheckboxLabel key={brand}>
              <CheckboxInput
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={(e) => onFilterChange('brands', brand, e.target.checked)}
              />
              {brand}
            </CheckboxLabel>
          ))}
        </CheckboxContainer>
      </FilterGroup>

      {/* Rating Filter */}
      <FilterGroup>
        <FilterLabel>Minimum Rating</FilterLabel>
        <StarRatingFilter>
          {[4, 3, 2, 1, 0].map(rating => (
            <StarButton
              key={rating}
              active={filters.minRating === rating}
              onClick={() => onFilterChange('minRating', rating)}
            >
              <span>{rating > 0 ? '★'.repeat(rating) : 'Any'}</span>
              <span>{rating > 0 ? '& up' : 'rating'}</span>
            </StarButton>
          ))}
        </StarRatingFilter>
      </FilterGroup>

      {/* RAM Filter */}
      <FilterGroup>
        <FilterLabel>RAM</FilterLabel>
        <CheckboxContainer>
          {rams.map(ram => (
            <CheckboxLabel key={ram}>
              <CheckboxInput
                type="checkbox"
                checked={filters.rams.includes(ram)}
                onChange={(e) => onFilterChange('rams', ram, e.target.checked)}
              />
              {ram}
            </CheckboxLabel>
          ))}
        </CheckboxContainer>
      </FilterGroup>

      {/* In Stock Filter */}
      <FilterGroup>
        <CheckboxLabel>
          <CheckboxInput
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onFilterChange('inStockOnly', e.target.checked)}
          />
          In Stock Only
        </CheckboxLabel>
      </FilterGroup>
    </FiltersContainer>
  );
};

export default Filters;