import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { debounce } from 'lodash';
import { RootState, AppDispatch } from "../../store/store";
import {
  fetchCart,
  incrementQuantity,
  decrementQuantity,
  deleteCartItem,
  updateCart
} from "../../store/cartSlice";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/build/Feather";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";

const C = {
  bgMain: "#C5E0CD",
  white: "#FFFFFF",
  primaryDeep: "#295D38",
  primarySoft: "#3E7B57",
  paleLightGreen: "#F4F8F5",
  textDark: "#223131",
  textMid: "#4E5F5E",
  textLight: "#6E767D",
  mutedText: "#98A2A1",
  borderLight: "#EFEFEF",
  softBg: "#F0F3F1",
  priceDeep: "#1B4332",
};

export default function CartScreen() {
  const dispatch = useDispatch<AppDispatch>();

  const cartId = useSelector((state: RootState) => state.cart.id);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const loading = useSelector((state: RootState) => state.cart.loading);
  const totalPrice = useSelector((state: RootState) => state.cart.totalPrice);

  const shippingFee = cartItems.length > 0 ? 15000 : 0;

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const debouncedSyncCart = useRef(
    debounce((items) => {
      dispatch(updateCart({ items, id: cartId }))
    }, 1500)
  ).current;

  useEffect(() => {
    if (cartItems.length > 0) {
      debouncedSyncCart(cartItems);
    }
  }, [cartItems, debouncedSyncCart]);

  useEffect(() => {
    return () => {
      debouncedSyncCart.cancel();
      if (cartItems.length > 0) {
        dispatch(updateCart({ items: cartItems, id: cartId }));
      }
    }
  }, [debouncedSyncCart]);

  const handleCheckout = async () => {
    // Sync lần cuối trước khi checkout
    await dispatch(updateCart({ items: cartItems, id: cartId })).unwrap();
    router.push('/checkout');
  };

  const groupCartItems = (items: any[]) => {
    const groups: { [key: string]: any[] } = {};
    items.forEach((item) => {
      if (!groups[item.seller]) groups[item.seller] = [];
      groups[item.seller].push(item);
    });
    return Object.keys(groups).map((seller) => ({
      seller,
      items: groups[seller],
    }));
  };

  const cartGroups = groupCartItems(cartItems);
  // const subtotal = cartItems.reduce(
  //   (sum, item) => sum + item.price * item.quantity,
  //   0,
  // );
  const total = totalPrice + shippingFee;

  if (loading && cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color={C.primaryDeep} />
          <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Text style={styles.headerTitle}>Giỏ hàng của tôi</Text>
          <View style={styles.headerSide} />
        </View>

        {cartItems.length === 0 ? (
          <View style={[styles.emptyWrapper, styles.center]}>
            <View style={styles.emptyIconBox}>
              <Feather name="shopping-cart" size={34} color={C.primaryDeep} />
            </View>
            <Text style={styles.emptyTitle}>Giỏ hàng của bạn đang trống</Text>
            <Text style={styles.emptyText}>
              Thêm món yêu thích để bắt đầu đặt hàng nhé.
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: "space-between" }}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Feather name="map-pin" size={18} color={C.primaryDeep} />
                  <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
                </View>
                <Text style={styles.addressName}>
                  Nguyễn Văn A | 0901234567
                </Text>
                <Text style={styles.addressDetail}>
                  Cổng sau KTX Khu B - ĐHQG TPHCM, Thạnh Xuân, Quận 12, Hồ Chí
                  Minh
                </Text>
              </View>

              {cartGroups.map((group) => (
                <View key={group.seller} style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Feather
                      name="shopping-bag"
                      size={18}
                      color={C.primaryDeep}
                    />
                    <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>
                  </View>

                  <Text style={styles.restaurantName}>
                    {group.seller}
                  </Text>

                  {group.items.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.foodItemRow,
                        index === group.items.length - 1 &&
                          styles.foodItemRowLast,
                      ]}
                    >
                      <Image
                        source={
                          typeof item.image === "string"
                            ? { uri: item.image }
                            : item.image
                        }
                        style={styles.foodImage}
                      />

                      <View style={styles.foodInfo}>
                        <Text style={styles.foodName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.foodUnitPrice}>
                          {item.price.toLocaleString("vi-VN")}đ / món
                        </Text>

                        <View style={styles.quantityContainer}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            activeOpacity={0.75}
                            onPress={() => {
                              if (item.quantity > 1) {
                                dispatch(decrementQuantity({ id: item.id, price: item.price }));
                              } else {
                                dispatch(deleteCartItem(item.id));
                              }
                            }}
                          >
                            <Feather
                              name={item.quantity > 1 ? "minus" : "trash-2"}
                              size={14}
                              color={C.textMid}
                            />
                          </TouchableOpacity>

                          <Text style={styles.quantityText}>
                            {item.quantity}
                          </Text>

                          <TouchableOpacity
                            style={styles.quantityButton}
                            activeOpacity={0.75}
                            onPress={() => dispatch(incrementQuantity({ id: item.id, price: item.price }))}
                          >
                            <Feather name="plus" size={14} color={C.textMid} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.itemRightCol}>
                        <TouchableOpacity
                          style={styles.deleteIconButton}
                          activeOpacity={0.7}
                          onPress={() => dispatch(deleteCartItem(item.id))}
                        >
                          <Feather name="x" size={16} color={C.textLight} />
                        </TouchableOpacity>
                        <Text style={styles.foodTotalPrice}>
                          {(item.price * item.quantity).toLocaleString("vi-VN")}
                          đ
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Feather name="file-text" size={18} color={C.primaryDeep} />
                  <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
                </View>

                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Tổng tiền món ăn</Text>
                  <Text style={styles.pricingValue}>
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </Text>
                </View>

                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>
                    Phí vận chuyển tạm tính
                  </Text>
                  <Text style={styles.pricingValue}>
                    {shippingFee.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.cartFooter}>
              <View style={styles.footerPriceBlock}>
                <Text style={styles.footerLabel}>Tổng cộng</Text>
                <Text style={styles.footerTotal}>
                  {total.toLocaleString("vi-VN")}đ
                </Text>
              </View>

              <TouchableOpacity
                style={styles.nextButton}
                activeOpacity={0.85}
                onPress={handleCheckout}
              >
                <Text style={styles.nextButtonText}>Mua hàng</Text>
                <Feather name="arrow-right" size={15} color={C.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.white,
  },
  container: {
    flex: 1,
    backgroundColor: C.bgMain,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  headerSide: {
    width: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.textDark,
    paddingBottom: 11,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: C.textLight,
  },
  emptyWrapper: {
    flex: 1,
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textDark,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: C.textLight,
    textAlign: "center",
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.textDark,
  },
  addressName: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textDark,
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 13,
    color: C.textLight,
    lineHeight: 18,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textMid,
    marginBottom: 12,
  },
  foodItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.softBg,
  },
  foodItemRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: C.softBg,
  },
  foodInfo: {
    flex: 1,
    justifyContent: "center",
  },
  foodName: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textDark,
    marginBottom: 3,
  },
  foodUnitPrice: {
    fontSize: 12,
    color: C.mutedText,
    marginBottom: 8,
  },
  foodTotalPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: C.priceDeep,
    letterSpacing: 0.2,
    textAlign: "right",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F9F8",
    borderRadius: 8,
    alignSelf: "flex-start",
    padding: 2,
  },
  quantityButton: {
    width: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textDark,
    paddingHorizontal: 12,
    textAlign: "center",
  },
  itemRightCol: {
    minWidth: 92,
    alignItems: "flex-end",
    alignSelf: "stretch",
    justifyContent: "space-between",
  },
  deleteIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.softBg,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    gap: 12,
  },
  pricingLabel: {
    fontSize: 13,
    color: C.textLight,
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textDark,
  },
  cartFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    paddingHorizontal: 32,
    paddingVertical: 24,
    gap: 20,
  },
  footerPriceBlock: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    color: C.textMid,
    marginBottom: 4,
  },
  footerTotal: {
    fontSize: 28,
    fontWeight: "900",
    color: C.priceDeep,
    letterSpacing: 0.3,
  },
  nextButton: {
    backgroundColor: C.primarySoft,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 9999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.white,
  },
});
