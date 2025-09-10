import styled from 'styled-components';

const FiltersContainer = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[6]};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.md};
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

const RangeInput = styled.input`
  width: 100%;
  margin: ${props => props.theme.spacing[3]} 0;
  accent-color: ${props => props.theme.colors.primary};
`;

const RangeValues = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.gray600};
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
  return (
    <FiltersContainer>
      <FilterTitle>
        Filters
        <ClearButton onClick={onClearFilters}>
          Clear All
        </ClearButton>
      </FilterTitle>

      {/* Price Range Filter */}
      <FilterGroup>
        <FilterLabel>Price Range</FilterLabel>
        <RangeInput
          type="range"
          min="0"
          max="2000"
          value={filters.maxPrice}
          onChange={(e) => onFilterChange('maxPrice', parseInt(e.target.value))}
        />
        <RangeValues>
          <span>$0</span>
          <span>Up to ${filters.maxPrice}</span>
          <span>$2000</span>
        </RangeValues>
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
          {[4, 3, 2, 1].map(rating => (
            <StarButton
              key={rating}
              active={filters.minRating === rating}
              onClick={() => onFilterChange('minRating', filters.minRating === rating ? 0 : rating)}
            >
              <span>{'★'.repeat(rating)}</span>
              <span>&amp; up</span>
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