import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const productValidate = async (productId: number) => {
      const stockListResponse = await api.get(`/stock?id=${productId}`);
      const productInStock: Stock = stockListResponse.data[0];
      
      return productInStock
  }

  const addProduct = async (productId: number) => {
    try {
      const itemOnCart = cart.find(item => item.id === productId)      

      if (itemOnCart) {
        await updateProductAmount({
          productId: itemOnCart.id, 
          amount: itemOnCart.amount + 1,
        })
      }

      else {
        const getProductResponse = await api.get(`/product?id=${productId}`);
        const getProduct = getProductResponse.data[0];

        if(getProduct) {
          const newProduct: Product = {...getProduct, amount: 1}
          const newCartList = [...cart, newProduct];

          setCart(newCartList);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartList));
        }
        else {
          throw Error
        }
      }
    }
    catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const isValidProduct = cart.find(item => item.id === productId)
      if(isValidProduct) {
        const newCartList = cart.filter((item: Product) => {
          return item.id !== productId
        });

        setCart(newCartList);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartList))
      }
      else {
        throw Error
      }
    } 
    
    catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    try {
      const APIstockAmountResponse = await api.get(`/stock?id=${productId}`)
      const stockList = APIstockAmountResponse.data[0];

      if(stockList) {
        if(amount > stockList.amount) {
          toast.error('Quantidade solicitada fora de estoque');
        }

        else {
          const newCartList = cart.map((item: Product) => {
            if(productId === item.id) {
              item.amount = amount;
            }

            return item
          });

          setCart(newCartList);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartList))
        }
      }
      else {
        throw Error
      }
    }
    catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
