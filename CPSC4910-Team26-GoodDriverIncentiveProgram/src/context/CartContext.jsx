import { createContext, use, useContext, useEffect, useState } from "react";

const CartContext = createContext();


export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    useEffect(() => {
        const storedCart = localStorage.getItem("cart");
        if (storedCart) {
            setCartItems(JSON.parse(storedCart));
        }
    }, []);
    
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev;
            }
            return [...prev, { ...product, quantity: 1 }];
        
        });
    };
    const removeFromCart = (productId) => {
        setCartItems((prev) => prev.filter((item) => item.id !== productId));
    };


    const clearCart = () => setCartItems([]);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);