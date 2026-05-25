import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator, // Thêm component này để làm loading spinner
} from 'react-native';
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

interface FoodShop {
  _id: string;
  name: string;
  avatar: string;
  address: string;
}

interface FoodDetails {
  _id: string;
  name: string;
  description: string;
  shop: FoodShop;
  listUrlImg: string[];
  price: number;
}

interface CartItem {
  id: string;
  name: string;
  restaurant: string;
  price: number;
  quantity: number;
  image: string;
}

// Cấu trúc nhóm theo từng Shop
interface CartGroup {
  restaurantName: string;
  items: CartItem[];
}

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const shippingFee = 15000;

  const fetchCartData = useCallback(async () => {
    try {
      const tokensRaw = await SecureStore.getItemAsync("tokens");
      const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;
      const accessToken = tokens?.accessToken;

      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/cart/`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const json = await response.json();

      // console.log("Dữ liệu giỏ hàng nhận được từ API:", json.data);
      
      if (json.success && json.data && json.data.items) {
        // Map chuẩn từ cấu trúc API của bạn sang State
        const mappedItems = json.data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          restaurant: item.food?.shop?.name || item.restaurant || "Quán ăn",
          price: item.price, // Tính toán theo giá gốc 'price' theo yêu cầu trước của bạn
          quantity: item.quantity,
          image: item.image,
        }));
        setCartItems(mappedItems);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Lỗi khi fetch giỏ hàng:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCartData();
    }, [fetchCartData])
  );

  // Hàm cập nhật số lượng (Bạn nên tối ưu gọi thêm API update số lượng ở đây nếu cần)
  const updateQuantity = (id: string, change: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const groupCartItems = (items: CartItem[]): CartGroup[] => {
    const groups: { [key: string]: CartItem[] } = {};
    
    items.forEach(item => {
      if (!groups[item.restaurant]) {
        groups[item.restaurant] = [];
      }
      groups[item.restaurant].push(item);
    });

    return Object.keys(groups).map(restaurantName => ({
      restaurantName,
      items: groups[restaurantName],
    }));
  };

  const cartGroups = groupCartItems(cartItems);

  // Tính toán dựa trên finalPrice của API thay vì price gốc
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shippingFee;

  // Trả về màn hình loading nếu đang fetch dữ liệu
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#09AB0D" />
        <Text style={{ marginTop: 10, color: '#484C52' }}>Đang tải giỏ hàng...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Kiểm tra giỏ hàng trống bằng cách đưa ra ngoài hẳn ScrollView */}
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Địa chỉ giao hàng luôn cố định */}
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.locationIconContainer}>
                  <Image
                    source={require('../../assets/images/location-icon.png')}
                    style={styles.locationIcon}
                  />
                </View>
                <Text style={styles.addressTitle}>Địa chỉ giao hàng</Text>
                <TouchableOpacity>
                  <Text style={styles.changeButton}>Thay đổi</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.addressText}>Cổng sau KTX Khu B - ĐHQG TPHCM</Text>
            </View>

            {cartGroups.map(group => (
              <ShopCartGroupCard
                key={group.restaurantName}
                group={group}
                onIncrease={updateQuantity}
                onDecrease={updateQuantity}
                onRemove={removeItem}
              />
            ))}

            {/* Price Summary */}
            <View style={styles.priceSummary}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tạm tính</Text>
                <Text style={styles.priceValue}>{subtotal.toLocaleString('vi-VN')}đ</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Phí vận chuyển</Text>
                <Text style={styles.priceValue}>{shippingFee.toLocaleString('vi-VN')}đ</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng cộng</Text>
                <Text style={styles.totalValue}>{total.toLocaleString('vi-VN')}đ</Text>
              </View>
            </View>
          </ScrollView>

          {/* Checkout Footer dính liền sát Bottom Bar không hardcode */}
          <View style={styles.checkoutFooter}>
            <View style={styles.footerContent}>
              <View>
                <Text style={styles.footerLabel}>Tổng tiền</Text>
                <Text style={styles.footerTotal}>{total.toLocaleString('vi-VN')}đ</Text>
              </View>
              <TouchableOpacity style={styles.orderButton}>
                <Text style={styles.orderButtonText}>Đặt hàng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

interface ShopCartGroupCardProps {
  group: CartGroup;
  onIncrease: (id: string, change: number) => void;
  onDecrease: (id: string, change: number) => void;
  onRemove: (id: string) => void;
}

function ShopCartGroupCard({ group, onIncrease, onDecrease, onRemove }: ShopCartGroupCardProps) {
  return (
    <View style={styles.cartItemCard}>
      <View style={styles.cartItemHeader}>
        <Text style={styles.restaurantName}>{group.restaurantName}</Text>
      </View>

      {group.items.map((item, index) => (
        <View key={item.id}>
          {index > 0 && <View style={styles.itemDivider} />}

          <View style={styles.cartItemContent}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.image }} style={styles.foodImage} resizeMode="cover" />
            </View>

            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
            </View>

            <TouchableOpacity style={styles.deleteButton} onPress={() => onRemove(item.id)}>
              <Image
                source={require('../../assets/images/delete-icon.png')}
                style={styles.deleteIcon}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Số lượng</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity style={styles.quantityButton} onPress={() => onDecrease(item.id, -1)}>
                <Image source={require('../../assets/images/minus-icon.png')} style={styles.quantityIcon} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={() => onIncrease(item.id, 1)}>
                <Image source={require('../../assets/images/plus-icon.png')} style={styles.quantityIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C5E0CD',
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C5E0CD',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80, // Tránh đè lên tabbar
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6E767D',
    textAlign: 'center',
  },
  addressCard: {
    backgroundColor: 'white',
    marginHorizontal: 11,
    marginTop: 10,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: '#C5E0CD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationIcon: {
    width: 20,
    height: 20,
  },
  addressTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  changeButton: {
    fontSize: 18,
    fontWeight: '700',
    color: '#09AB0D',
  },
  addressText: {
    fontSize: 15,
    color: '#484C52',
    marginLeft: 52,
  },
  cartItemCard: {
    backgroundColor: 'white',
    marginHorizontal: 11,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartItemHeader: {
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  cartItemContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    color: '#000',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#09AB0D',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: '#C5E0CD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    width: 20,
    height: 20,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 15,
    color: '#484C52',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#08AA0C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityIcon: {
    width: 20,
    height: 20,
  },
  quantityText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#09AB0D',
    minWidth: 20,
    textAlign: 'center',
  },
  priceSummary: {
    backgroundColor: 'white',
    marginHorizontal: 8,
    marginTop: 12,
    padding: 24,
    borderRadius: 32,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 16,
    color: '#4E5F5E',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#223131',
  },
  divider: {
    height: 1,
    backgroundColor: '#C8E2E1',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#223131',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#176A21',
  },
  checkoutFooter: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#223131',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    paddingBottom: 5, // Đẩy phần content lên trên thanh absolute tab bar của bạn
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  footerLabel: {
    fontSize: 12,
    color: '#4E5F5E',
    marginBottom: 4,
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#223131',
  },
  orderButton: {
    backgroundColor: '#295D38',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 9999,
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: '#FEFFFE',
    paddingHorizontal: 12,
    paddingBottom: 34,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navItem: {
    alignItems: 'center',
    gap: 6,
  },
  navIcon: {
    fontSize: 20,
  },
  navLabel: {
    fontSize: 12,
    color: '#484C52',
  },
  navItemActive: {
    alignItems: 'center',
    position: 'relative',
  },
  navActiveIcon: {
    width: 52,
    height: 52,
    borderRadius: 100,
    backgroundColor: '#3E8C55',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    marginBottom: -18,
  },
  navActiveIconText: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF0000',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F0F2F1',
    marginVertical: 16,
  },
});
