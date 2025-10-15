import styled from 'styled-components';
import Button from './Button';
import { useState } from 'react';
const DetailsPanel = styled.div`
  position: absolute;
  top: 0;
  left: 100%;
  z-index: 10;
  min-width: 320px;
  background: ${props => props.theme.colors.white};
  border: 1px solid ${props => props.theme.colors.gray300};
  box-shadow: ${props => props.theme.shadows.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing[5]};
  margin-left: ${props => props.theme.spacing[4]};
  color: ${props => props.theme.colors.dark};
  font-size: ${props => props.theme.fontSizes.md};
  pointer-events: auto;
`;

const Card = styled.div`
  background: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.xl};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.md};
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
`;

const ImageContainer = styled.div`
  position: relative;
  height: 200px;
  overflow: hidden;
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;

  ${Card}:hover & {
    transform: scale(1.05);
  }
`;

const StockBadge = styled.span`
  position: absolute;
  top: ${props => props.theme.spacing[3]};
  right: ${props => props.theme.spacing[3]};
  background: ${props => (props.inStock ? props.theme.colors.success : props.theme.colors.danger)};
  color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[1]} ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSizes.xs};
  font-weight: 600;
`;

const CardContent = styled.div`
  padding: ${props => props.theme.spacing[5]};
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const Category = styled.span`
  color: ${props => props.theme.colors.primary};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing[2]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ProductName = styled.h3`
  font-size: ${props => props.theme.fontSizes.lg};
  margin-bottom: ${props => props.theme.spacing[3]};
  color: ${props => props.theme.colors.dark};
  line-height: 1.4;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[3]};
  margin-bottom: ${props => props.theme.spacing[3]};
`;

const CurrentPrice = styled.span`
  font-size: ${props => props.theme.fontSizes.xl};
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
`;

const OriginalPrice = styled.span`
  font-size: ${props => props.theme.fontSizes.md};
  color: ${props => props.theme.colors.gray600};
  text-decoration: line-through;
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
  margin-bottom: ${props => props.theme.spacing[4]};
`;

const Stars = styled.div`
  display: flex;
  gap: 2px;
`;

const Star = styled.span`
  color: ${props => (props.filled ? '#ffc107' : props.theme.colors.gray300)};
  font-size: ${props => props.theme.fontSizes.sm};
`;

const RatingText = styled.span`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.gray600};
`;


const ProductCard = ({ product, onProductClick, onAddToCart, onProductHoverStart, onProductHoverEnd }) => {
  const [showDetails, setShowDetails] = useState(false);
  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, index) => (
      <Star key={index} filled={index < Math.floor(rating)}>
        ★
      </Star>
    ));

  const handleClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation(); // prevent triggering card click
    // Click precision logging if logger is passed as prop
    if (typeof window !== 'undefined' && window.__task2Logger) {
      const rect = e.target.getBoundingClientRect();
      const click_pos = { x: e.clientX, y: e.clientY };
      const center_pos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      window.__task2Logger.logClickPrecision('add_to_cart', click_pos, center_pos);
    }
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  // Show details on hover
  const handleMouseEnter = () => {
    setShowDetails(true);
    if (typeof onProductHoverStart === 'function') onProductHoverStart();
  };
  const handleMouseLeave = () => {
    setShowDetails(false);
    if (typeof onProductHoverEnd === 'function') onProductHoverEnd();
  };

  return (
    <div style={{ position: 'relative', height: '100%' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Card onClick={handleClick}>
        <ImageContainer>
          <ProductImage src={product.imageUrl} alt={product.name} />
          <StockBadge inStock={product.inStock}>
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </StockBadge>
        </ImageContainer>

        <CardContent>
          <Category>{product.category}</Category>
          <ProductName>{product.name}</ProductName>

          <PriceContainer>
            <CurrentPrice>${product.price}</CurrentPrice>
            {product.originalPrice > product.price && (
              <OriginalPrice>${product.originalPrice}</OriginalPrice>
            )}
          </PriceContainer>

          <RatingContainer>
            <Stars>{renderStars(product.rating)}</Stars>
            <RatingText>({product.reviewCount})</RatingText>
          </RatingContainer>

          <Button
            onClick={handleAddToCart}
            variant={!product.inStock ? 'outline' : 'primary'}
            disabled={!product.inStock}
            style={{ marginTop: 'auto' }}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </CardContent>
      </Card>
      {showDetails && (
        <DetailsPanel>
          <div style={{ fontWeight: 600, fontSize: '1.1em', marginBottom: 8 }}>{product.name}</div>
          <div style={{ marginBottom: 8 }}>{product.description}</div>
          <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
            <li><b>Brand:</b> {product.brand}</li>
            <li><b>CPU:</b> {product.cpu}</li>
            <li><b>RAM:</b> {product.ram}</li>
            <li><b>Storage:</b> {product.storage}</li>
            <li><b>GPU:</b> {product.gpu}</li>
            <li><b>Screen Size:</b> {product.screenSize}</li>
            <li><b>Rating:</b> {product.rating} ({product.reviewCount} reviews)</li>
            <li><b>Price:</b> ${product.price}</li>
            {product.originalPrice > product.price && (
              <li><b>Original Price:</b> ${product.originalPrice}</li>
            )}
            <li><b>Stock:</b> {product.inStock ? 'In Stock' : 'Out of Stock'}</li>
          </ul>
        </DetailsPanel>
      )}
    </div>
  );
};

export default ProductCard;
