'use client';

import { useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { useCartStore, useNavigationStore } from '@/lib/store';

export function CartDrawer() {
  const { items, isOpen, setCartOpen, removeItem, updateQuantity, total } =
    useCartStore();
  const { navigate } = useNavigationStore();

  // Sync sheet open state with cart store
  useEffect(() => {
    // The sheet's open state is managed by the store
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    setCartOpen(open);
  };

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('checkout');
  };

  const handleViewCart = () => {
    setCartOpen(false);
    navigate('cart');
  };

  const handleAddMeasurements = (itemId: string) => {
    setCartOpen(false);
    navigate('checkout');
  };

  const cartTotal = total();

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" />
            Your Cart
          </SheetTitle>
          <SheetDescription>
            {items.length === 0
              ? 'Your cart is empty'
              : `${items.length} item${items.length > 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
            <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-heading text-lg font-semibold text-foreground">
                Your cart is empty
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Discover our collection and add something beautiful.
              </p>
            </div>
            <Button
              onClick={() => {
                setCartOpen(false);
                navigate('products');
              }}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Browse Collection
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-1 max-h-[calc(100vh-280px)]">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                  {/* Item Image */}
                  <div className="h-20 w-16 shrink-0 rounded-lg overflow-hidden bg-secondary">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-medium text-foreground line-clamp-1">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.size && (
                            <span className="text-xs text-muted-foreground">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              {item.size && <span>·</span>}
                              {item.colorHex ? (
                                <span
                                  className="inline-block h-3 w-3 rounded-full border border-border/50"
                                  style={{ backgroundColor: item.colorHex }}
                                />
                              ) : null}
                              {item.color}
                            </span>
                          )}
                          {!item.color && !item.size && (
                            <span className="text-xs text-muted-foreground capitalize">
                              {item.itemType}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <span className="text-sm font-semibold text-accent">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Service Item: Add Measurements */}
                    {item.itemType === 'service' && !item.measurementData && (
                      <button
                        onClick={() => handleAddMeasurements(item.id)}
                        className="flex items-center gap-1 mt-2 text-xs text-accent hover:underline"
                      >
                        <Ruler className="h-3 w-3" />
                        Add Measurements
                      </button>
                    )}

                    {/* Requires Appointment Badge */}
                    {item.requiresAppointment && !item.appointmentDate && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        Fitting appointment required
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Cart Footer */}
            <SheetFooter className="space-y-3">
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-bold font-heading text-accent">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
                >
                  Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleViewCart}
                  className="w-full"
                >
                  View Cart
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
