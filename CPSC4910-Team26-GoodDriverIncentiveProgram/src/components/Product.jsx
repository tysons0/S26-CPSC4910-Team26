function ProductCard({ 
  title,
  imageUrl,
  price,
  currency,
  points,
  condition,
  children
 }) {
  return (
    <div className="product-card">
      <div className="product-image">
        <img src={imageUrl} alt={title} />
      </div>
      <div className="product-info">
        <h3>{title}</h3>
        {price && (
          <p>
            ${price} {currency}
          </p>
        )}
        
        {points !== undefined && <p>Points: {points}</p>}
        {condition && <p>Condition: {condition}</p>}
        {children}
      </div>
    </div>
  );
}

export default ProductCard;
