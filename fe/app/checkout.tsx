import { router, useFocusEffect,  } from 'expo-router';
import Feather from '@expo/vector-icons/build/Feather';
import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { type VoucherDto, getSelectedVoucherCode, lookupVoucherByCode, clearSelectedVoucherCode } from "@/services/voucher-service";
import { API_BASE_URL } from "@/constants/api";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import * as SecureStore from "expo-secure-store";

type PaymentMethod = 'ewallet' | 'bankcard' | 'cash';

export default function CheckoutScreen() {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('ewallet');

  const [appliedVoucher, setAppliedVoucher] = useState<VoucherDto | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [voucherModalVisible, setVoucherModalVisible] = useState(false);
  const [voucherModalMessage, setVoucherModalMessage] = useState("");

  // Lấy dữ liệu giỏ hàng thực tế từ Redux Store
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalPrice = useSelector((state: RootState) => state.cart.totalPrice);
  const cartId = useSelector((state: RootState) => state.cart.id);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      async function checkAppliedVoucher() {
        try {
          const code = await getSelectedVoucherCode();

          if (!isActive) return;

          if (code) {
            const voucherDetail = await lookupVoucherByCode(code);
            if (!isActive) return;

            if (totalPrice < voucherDetail.minOrderValue) {
              await clearSelectedVoucherCode();

              setAppliedVoucher(null);
              setVoucherError(null);

              setVoucherModalMessage(
                `Đơn hàng cần tối thiểu ${voucherDetail.minOrderValue.toLocaleString("vi-VN")}đ để áp dụng voucher này.`
              );
              setVoucherModalVisible(true);

              return;
            }

            setAppliedVoucher(voucherDetail);
            setVoucherError(null);
          } else {
            setAppliedVoucher(null);
          }
        } catch (err: any) {
          if (!isActive) return;

          console.error("Lỗi nạp voucher áp dụng:", err);
          setVoucherError("Mã giảm giá không hợp lệ hoặc đã hết hạn");
          setAppliedVoucher(null);
        }
      }

      checkAppliedVoucher();

      return () => {
        isActive = false;
        clearSelectedVoucherCode();
        setAppliedVoucher(null);
        setVoucherError(null);
      };
    }, [cartItems])
  );

  // Hàm gom nhóm sản phẩm theo nhà hàng
  const groupCartItems = (items: any[]) => {
    const groups: { [key: string]: any[] } = {};
    items.forEach(item => {
      if (!groups[item.seller]) groups[item.seller] = [];
      groups[item.seller].push(item);
    });
    return Object.keys(groups).map(seller => ({
      seller,
      items: groups[seller],
    }));
  };

  const cartGroups = groupCartItems(cartItems);

  // Tự động tính toán giá tiền dựa trên giỏ hàng thực tế
  const shippingFee = cartItems.length > 0 ? 15000 : 0;
  const orderDiscount = useMemo(() => {
    if (!appliedVoucher || totalPrice < appliedVoucher.minOrderValue) return 0;
    
    if (appliedVoucher.type === 'PERCENT') {
      return -Math.round((totalPrice * appliedVoucher.value) / 100);
    }
    if (appliedVoucher.type === 'FIXED') {
      return -appliedVoucher.value;
    }
    if (appliedVoucher.type === 'FREE_SHIPPING') {
      return -shippingFee;
    }
    return 0;
  }, [appliedVoucher, totalPrice]);
  const total = totalPrice + shippingFee + orderDiscount;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || isPaying) return;

    setIsPaying(true);

    try {
      const orderPayload = {
        phone: "0901234567",
        deliveryAddress: "Cổng sau KTX Khu B - ĐHQG TPHCM, Thạnh Xuân, Quận 12, Hồ Chí Minh",
        cartId,
        groupItems: cartGroups
      };

      const tokensRaw = await SecureStore.getItemAsync("tokens");
      const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;
      const accessToken = tokens?.accessToken;

      const ordersRes = await fetch(`${API_BASE_URL}/api/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const ordersJson = await ordersRes.json();

      if (!ordersRes.ok) {
        throw new Error(ordersJson.message || "Không thể tạo đơn hàng");
      }

      const orders = ordersJson.data;
      const orderIds = orders.map((order: any) => order.id);

      const paymentMethod =
        selectedPayment === "cash"
          ? "COD"
          : selectedPayment === "bankcard"
            ? "VNPAY"
            : "MOMO";

      const paymentPayload = {
        orderIds: orderIds,
        method: paymentMethod,
        voucherCode: appliedVoucher?.code,
        shippingFee,
      };

      const paymentRes = await fetch(`${API_BASE_URL}/api/payments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(paymentPayload),
      });

      const paymentJson = await paymentRes.json();

      if (!paymentRes.ok) {
        throw new Error(paymentJson.message || "Không thể tạo thanh toán");
      }

      const paymentData = paymentJson.data;

      if (paymentMethod === "VNPAY") {
        const paymentUrl = String(paymentData.paymentUrl || "")
          .replace(/^"+|"+$/g, "")
          .trim();

        if (!paymentUrl.startsWith("http")) {
          throw new Error("URL thanh toán VNPay không hợp lệ");
        }

        await Linking.openURL(paymentUrl);
        return;
      }

      setSuccessModalVisible(true);
    } catch (error: any) {
      Alert.alert("Thanh toán thất bại", error.message || "Vui lòng thử lại sau");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView style={{ backgroundColor: 'white' }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color="#223131" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Địa chỉ giao hàng */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Feather name="map-pin" size={18} color="#295D38" />
              <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
            </View>
            <Text style={styles.addressName}>Nguyễn Văn A | 0901234567</Text>
            <Text style={styles.addressDetail}>Cổng sau KTX Khu B - ĐHQG TPHCM, Thạnh Xuân, Quận 12, Hồ Chí Minh</Text>
          </View>

          {/* Tóm tắt đơn hàng */}
          {cartGroups.length === 0 ? (
            <View style={styles.sectionCard}>
              <Text style={{ textAlign: 'center', color: '#6E767D', paddingVertical: 10 }}>
                Không có sản phẩm nào để thanh toán.
              </Text>
            </View>
          ) : (
            cartGroups.map((group, groupIdx) => (
              <View style={styles.sectionCard} key={groupIdx}>
                <View style={styles.sectionHeader}>
                  <Feather name="shopping-bag" size={18} color="#295D38" />
                  <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
                </View>
                <Text style={styles.restaurantName}>{group.seller}</Text>
                
                {group.items.map((item) => (
                  <View style={[styles.orderItemRow, { marginBottom: 12 }]} key={item.id}>
                    <Image 
                      source={typeof item.image === 'string' ? { uri: item.image } : item.image} 
                      style={styles.itemImage} 
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</Text>
                    
                  </View>
                ))}

                <View style={styles.noteContainer}>
                  <Text style={styles.noteLabel}>Ghi chú</Text>

                  <TextInput
                    placeholder="Để lại lời nhắn"
                    placeholderTextColor="#A0A5A8"
                    value={orderNotes[group.seller] || ""}
                    onChangeText={(text) =>
                      setOrderNotes((prev) => ({
                        ...prev,
                        [group.seller]: text,
                      }))
                    }
                    style={styles.noteInput}
                  />
                </View>
              </View>
            ))
          )}

          {/* Phương thức thanh toán */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Feather name="credit-card" size={18} color="#295D38" />
              <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            </View>

            <TouchableOpacity 
              style={[styles.paymentOption, selectedPayment === 'ewallet' && styles.paymentOptionSelected]}
              onPress={() => setSelectedPayment('ewallet')}
            >
              <Feather name="smartphone" size={20} color={selectedPayment === 'ewallet' ? '#295D38' : '#6E767D'} />
              <Text style={[styles.paymentText, selectedPayment === 'ewallet' && styles.paymentTextSelected]}>Ví điện tử (Momo/ZaloPay)</Text>
              <View style={[styles.radio, selectedPayment === 'ewallet' && styles.radioSelected]} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.paymentOption, selectedPayment === 'bankcard' && styles.paymentOptionSelected]}
              onPress={() => setSelectedPayment('bankcard')}
            >
              <Feather name="credit-card" size={20} color={selectedPayment === 'bankcard' ? '#295D38' : '#6E767D'} />
              <Text style={[styles.paymentText, selectedPayment === 'bankcard' && styles.paymentTextSelected]}>Thẻ ngân hàng / Thẻ tín dụng</Text>
              <View style={[styles.radio, selectedPayment === 'bankcard' && styles.radioSelected]} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.paymentOption, selectedPayment === 'cash' && styles.paymentOptionSelected]}
              onPress={() => setSelectedPayment('cash')}
            >
              <Feather name="dollar-sign" size={20} color={selectedPayment === 'cash' ? '#295D38' : '#6E767D'} />
              <Text style={[styles.paymentText, selectedPayment === 'cash' && styles.paymentTextSelected]}>Tiền mặt khi nhận hàng (COD)</Text>
              <View style={[styles.radio, selectedPayment === 'cash' && styles.radioSelected]} />
            </TouchableOpacity>
          </View>

          {/* ================= KHU VỰC VOUCHER ĐÃ ĐƯỢC BỔ SUNG CỦA BẠN ================= */}
          <View style={styles.sectionCard}>
            <TouchableOpacity 
              style={styles.voucherContainer} 
              onPress={() => router.push('/voucher')}
            >
              <View style={styles.voucherLeft}>
                <Feather name="tag" size={20} color="#295D38" />
                <Text style={styles.voucherTitle}>
                  {appliedVoucher ? `Mã: ${appliedVoucher.code}` : "Chọn mã giảm giá"}
                </Text>
              </View>
              <View style={styles.voucherRight}>
                <Text style={styles.voucherStatusText}>
                  {appliedVoucher 
                    ? (appliedVoucher.type === 'PERCENT' ? `Giảm ${appliedVoucher.value}%` : (appliedVoucher.type === 'FREE_SHIPPING' ? "Miễn phí vận chuyển" : `Giảm ${(appliedVoucher.value).toLocaleString('vi-VN')}đ`))
                    : "Xem ưu đãi"
                  }
                </Text>
                <Feather name="chevron-right" size={16} color="#295D38" />
              </View>
            </TouchableOpacity>

            {voucherError && <Text style={{ color: 'red', fontSize: 12, marginLeft: 16 }}>{voucherError}</Text>}
          </View>
          {/* ========================================================================= */}

          {/* Chi tiết hóa đơn */}
          <View style={styles.sectionCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Tạm tính</Text>
              <Text style={styles.pricingValue}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Phí vận chuyển</Text>
              <Text style={styles.pricingValue}>{shippingFee.toLocaleString('vi-VN')}đ</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Khuyến mãi áp dụng</Text>
              <Text style={[styles.discountValue]}>{orderDiscount.toLocaleString('vi-VN')}đ</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.checkoutFooter}>
          <View>
            <Text style={styles.footerLabel}>Tổng thanh toán</Text>
            <Text style={styles.footerTotal}>{total.toLocaleString('vi-VN')}đ</Text>
          </View>
          <TouchableOpacity 
            style={[styles.checkoutButton, isPaying && styles.checkoutButtonDisabled]}
            disabled={cartItems.length === 0 || isPaying}
            onPress={handlePlaceOrder}
          >
            {isPaying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text style={styles.checkoutButtonText}>Thanh toán</Text>
                <Feather name="lock" size={14} color="white" style={styles.lockIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>

      </View>

      <Modal
        visible={voucherModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVoucherModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setVoucherModalVisible(false)}
            >
              <Feather name="x" size={18} color="#6E767D" />
            </TouchableOpacity>

            <View style={[styles.successIconCircle, { backgroundColor: "#FFF4E5" }]}>
              <Feather name="alert-circle" size={24} color="#E67700" />
            </View>

            <Text style={[styles.successTitle, { color: "#E67700" }]}>
              Voucher không đủ điều kiện
            </Text>

            <Text style={styles.successMessage}>
              {voucherModalMessage}
            </Text>

            <TouchableOpacity
              style={styles.orderBtn}
              onPress={() => setVoucherModalVisible(false)}
            >
              <Text style={styles.orderBtnText}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Feather name="x" size={18} color="#6E767D" />
            </TouchableOpacity>

            <View style={styles.successIconCircle}>
              <Feather name="check-circle" size={24} color="#2F9E44" />
            </View>

            <Text style={styles.successTitle}>Đã đặt hàng thành công</Text>
            <Text style={styles.successMessage}>
              Hãy chờ một chút để cửa hàng xác nhận đơn hàng của bạn nhé!
            </Text>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.homeBtn}
                onPress={() => {
                  setSuccessModalVisible(false);
                  router.replace('/');
                }}
              >
                <Text style={styles.homeBtnText}>Trang chủ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.orderBtn}
                onPress={() => {
                  setSuccessModalVisible(false);
                  router.push('/history-order');
                }}
              >
                <Text style={styles.orderBtnText}>Đơn mua</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C5E0CD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F3F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#223131',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#223131',
  },
  addressName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#223131',
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 13,
    color: '#6E767D',
    lineHeight: 18,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4E5F5E',
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F0F3F1',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#223131',
  },
  itemQuantity: {
    fontSize: 11,
    color: '#98A2A1',
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1B4332',
    letterSpacing: 0.2,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F1',
    gap: 12,
  },

  noteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#223131',
  },

  noteInput: {
    flex: 1,
    fontSize: 13,
    color: '#223131',
    paddingVertical: 4,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: 8,
    gap: 12,
  },
  paymentOptionSelected: {
    borderColor: '#295D38',
    backgroundColor: '#F4F8F5',
  },
  paymentText: {
    fontSize: 13,
    color: '#4E5F5E',
    flex: 1,
  },
  paymentTextSelected: {
    color: '#295D38',
    fontWeight: '600',
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CCD2D1',
  },
  radioSelected: {
    borderColor: '#295D38',
    borderWidth: 5,
  },
  /* STYLE MỚI CHO VOUCHER */
  voucherContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voucherTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#223131',
  },
  voucherRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voucherStatusText: {
    fontSize: 13,
    color: '#295D38',
    fontWeight: '600',
  },
  /* ==================== */
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  pricingLabel: {
    fontSize: 13,
    color: '#6E767D',
  },
  pricingValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#223131',
  },
  checkoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    paddingHorizontal: 32,
    paddingVertical: 24,
    gap: 20
  },
  footerLabel: {
    fontSize: 12,
    color: '#4E5F5E',
    marginBottom: 4,
  },
  footerTotal: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1B4332',
    letterSpacing: 0.3,
  },
  checkoutButton: {
    backgroundColor: '#3E7B57',
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  checkoutButtonDisabled: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  lockIcon: {
    fontSize: 14,
  },
  discountValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B5E20',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  successModal: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 20,
    position: 'relative',
  },

  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
  },

  successIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E9F8ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  successTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2F7D46',
    marginBottom: 6,
  },

  successMessage: {
    fontSize: 12,
    color: '#6E767D',
    lineHeight: 17,
    marginBottom: 18,
  },

  successActions: {
    flexDirection: 'row',
    gap: 10,
  },

  homeBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDE3E1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  homeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4E5F5E',
  },

  orderBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#3E9B5F',
    justifyContent: 'center',
    alignItems: 'center',
  },

  orderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },
});
