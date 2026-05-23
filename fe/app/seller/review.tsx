/**
 * review-list.tsx – Màn hình Đánh giá (người bán)
 *
 * API: GET /api/comment/:shopId  (xem danh sách)
 *      PUT /api/comment/:shopId/like  (like/unlike)
 *      POST /api/comment/:shopId  (phản hồi)
 *
 * Auth: JWT từ SecureStore "tokens"
 */

import {
  addReview,
  formatOrderTime,
  getReviewerAvatar,
  getReviewerName,
  getReviews,
  likeReview,
  type SellerReview,
} from "@/services/seller-api";
import { parseSellerTokens } from "@/services/seller-shop";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Design tokens ───────────────────────────
const PRIMARY = "#1EA64A";
const BG = "#F0F7F2";
const CARD_BG = "#FFFFFF";
const BORDER = "#E2EDE5";
const YELLOW = "#F7B500";
const SOFT_GREEN = "#EAF6EE";
const FALLBACK_AVATAR = "https://i.pravatar.cc/100?img=0";

type ReviewTab = "all" | "pending" | "replied";

// ─── Star row ────────────────────────────────
function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <MaterialCommunityIcons
          key={s}
          name={s <= rating ? "star" : "star-outline"}
          size={size}
          color={s <= rating ? YELLOW : "#D8E4DA"}
        />
      ))}
    </View>
  );
}

// ─── Skeleton loader ─────────────────────────
function ReviewSkeleton() {
  return (
    <View style={[styles.reviewCard, { gap: 10 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={[styles.skeletonCircle, { width: 42, height: 42 }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[styles.skeletonLine, { width: "50%", height: 12 }]} />
          <View style={[styles.skeletonLine, { width: "30%", height: 10 }]} />
        </View>
        <View style={[styles.skeletonLine, { width: 70, height: 10 }]} />
      </View>
      <View style={[styles.skeletonLine, { width: "90%", height: 12 }]} />
      <View style={[styles.skeletonLine, { width: "70%", height: 12 }]} />
    </View>
  );
}

// ─── Review card ─────────────────────────────
function ReviewCard({
  item,
  myUserId,
  shopId,
  token,
  onLikeChange,
  onReply,
}: {
  item: SellerReview;
  myUserId: string;
  shopId: string;
  token: string;
  onLikeChange: (id: string, delta: number, liked: boolean) => void;
  onReply: (review: SellerReview) => void;
}) {
  const alreadyLiked = Array.isArray(item.likes) && item.likes.includes(myUserId);
  const [liked, setLiked] = useState(alreadyLiked);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [likePending, setLikePending] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const name = getReviewerName(item.userId);
  const avatar = getReviewerAvatar(item.userId) ?? FALLBACK_AVATAR;
  const isLongText = item.content.length > 90;
  const displayText =
    isLongText && !expanded ? item.content.slice(0, 90) + " ..." : item.content;

  const handleLike = async () => {
    if (likePending) return;
    setLikePending(true);
    const type = liked ? "dec" : "inc";
    const newLiked = !liked;
    const delta = newLiked ? 1 : -1;

    // Optimistic UI
    setLiked(newLiked);
    setLikeCount((c) => c + delta);
    onLikeChange(item.id, delta, newLiked);

    try {
      await likeReview(shopId, item.id, type, token);
    } catch {
      // Rollback on error
      setLiked(liked);
      setLikeCount((c) => c - delta);
      onLikeChange(item.id, -delta, liked);
    } finally {
      setLikePending(false);
    }
  };

  return (
    <View style={styles.reviewCard}>
      {/* Header */}
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: avatar }}
          style={styles.avatar}
          defaultSource={{ uri: FALLBACK_AVATAR }}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.reviewerName}>{name}</Text>
          <StarRow rating={0} />
        </View>
        <Text style={styles.reviewTime}>{formatOrderTime(item.createdAt)}</Text>
      </View>

      {/* Content */}
      <TouchableOpacity
        activeOpacity={isLongText ? 0.7 : 1}
        onPress={() => isLongText && setExpanded((p) => !p)}
      >
        <Text style={styles.reviewText}>{displayText}</Text>
        {isLongText && (
          <Text style={styles.readMore}>
            {expanded ? "Thu gọn" : "Xem thêm"}
          </Text>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={handleLike}
          activeOpacity={0.8}
          disabled={likePending}
        >
          <MaterialCommunityIcons
            name={liked ? "heart" : "heart-outline"}
            size={15}
            color={liked ? "#E84040" : "#B0C4B4"}
          />
          <Text style={[styles.likeCount, liked && { color: "#E84040" }]}>
            {likeCount} lượt thích
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onReply(item)}
          activeOpacity={0.8}
          style={styles.replyIconBtn}
        >
          <MaterialCommunityIcons name="reply-outline" size={18} color="#B0C4B4" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Reply modal ─────────────────────────────
function ReplyModal({
  visible,
  targetReview,
  shopId,
  token,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  targetReview: SellerReview | null;
  shopId: string;
  token: string;
  onClose: () => void;
  onSuccess: (comment: SellerReview) => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSend = async () => {
    if (!text.trim() || !targetReview) return;
    setSending(true);
    try {
      const comment = await addReview(shopId, text.trim(), token);
      onSuccess(comment);
      setText("");
      onClose();
    } catch {
      Alert.alert("Lỗi", "Không thể gửi phản hồi. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: CARD_BG }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Modal header */}
        <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Phản hồi đánh giá</Text>
          <TouchableOpacity
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={PRIMARY} />
            ) : (
              <Text
                style={[
                  styles.sendBtn,
                  { color: text.trim() ? PRIMARY : "#B0C4B4" },
                ]}
              >
                Gửi
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Original review preview */}
        {targetReview && (
          <View style={styles.replyPreview}>
            <View style={styles.replyPreviewBar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.replyPreviewName}>
                {getReviewerName(targetReview.userId)}
              </Text>
              <Text style={styles.replyPreviewText} numberOfLines={2}>
                {targetReview.content}
              </Text>
            </View>
          </View>
        )}

        <TextInput
          style={styles.replyInput}
          placeholder="Nhập phản hồi của bạn..."
          placeholderTextColor="#A8B8AC"
          multiline
          value={text}
          onChangeText={setText}
          maxLength={500}
          textAlignVertical="top"
          autoFocus
        />
        <Text style={[styles.charCount, { marginHorizontal: 16 }]}>
          {text.length}/500
        </Text>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────
export default function ReviewListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ReviewTab>("all");
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [replyTarget, setReplyTarget] = useState<SellerReview | null>(null);
  const [replyModalVisible, setReplyModalVisible] = useState(false);

  // Auth & shop info
  const tokenRef = useRef<string>("");
  const shopIdRef = useRef<string>("");
  const myUserIdRef = useRef<string>("");

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const LIMIT = 20;

  // ── Load token & shopId ──
  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync("sellerTokens");
        const tokens = parseSellerTokens(raw);
        if (!tokens?.accessToken) {
          setError("Bạn cần đăng nhập để xem đánh giá.");
          setLoading(false);
          return;
        }
        tokenRef.current = tokens.accessToken;

        // Lấy shopId từ my-shop
        const API_BASE =
          process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";
        const shopRes = await fetch(`${API_BASE}/api/shops/my-shop`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
        if (!shopRes.ok) {
          const text = await shopRes.text().catch(() => "");
          const err: any = new Error(`HTTP ${shopRes.status}: ${text}`);
          err.statusCode = shopRes.status;
          throw err;
        }
        const shopJson = await shopRes.json().catch(() => null);
        const shop = shopJson?.data ?? shopJson;
        if (!shop) {
          throw new Error("Không tìm thấy thông tin cửa hàng.");
        }
        shopIdRef.current = shop?.id ?? shop?._id ?? "";
        // userId từ token (decode hoặc lấy từ shop.userId)
        myUserIdRef.current = shop?.userId ?? "";

        await fetchReviews(true);
      } catch (e: any) {
        if (e.statusCode === 401 || e.message?.includes("401")) {
          router.replace("/seller/signin" as any);
          return;
        }
        setError(e.message ?? "Đã xảy ra lỗi.");
        setLoading(false);
      }
    })();
  }, []);

  const fetchReviews = useCallback(async (reset = false) => {
    if (!shopIdRef.current) return;
    if (reset) {
      pageRef.current = 1;
      hasMoreRef.current = true;
    }
    if (!hasMoreRef.current && !reset) return;

    try {
      const { reviews: fetched, pagination } = await getReviews(
        shopIdRef.current,
        tokenRef.current,
        pageRef.current,
        LIMIT
      );

      setReviews((prev) =>
        reset ? fetched : [...prev, ...fetched]
      );

      const totalLoaded =
        ((pageRef.current - 1) * LIMIT) + fetched.length;
      hasMoreRef.current = totalLoaded < (pagination.total ?? 0);
      pageRef.current += 1;
    } catch (e: any) {
      if (e.statusCode === 401 || e.message?.includes("401")) {
        router.replace("/seller/signin" as any);
        return;
      }
      setError(e.message ?? "Không thể tải đánh giá.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setError(null);
    fetchReviews(true);
  };

  const onLoadMore = () => {
    if (loadingMore || !hasMoreRef.current) return;
    setLoadingMore(true);
    fetchReviews(false);
  };

  // ── Filter theo tab ──
  const filtered = reviews.filter((r) => {
    // "pending" = chưa có reply nào từ seller; "replied" = có reply
    // Vì BE không phân biệt reply riêng, ta dùng toàn bộ list
    return true; // BE-side filtering sẽ cần endpoint riêng
  });

  const TABS: { key: ReviewTab; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chưa phản hồi" },
    { key: "replied", label: "Đã phản hồi" },
  ];

  // ─── Render ───────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
              {activeTab === tab.key && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sortRow}>
          <View style={styles.sortBtn}>
            <MaterialCommunityIcons name="sort-descending" size={14} color="#5A6E5E" />
            <Text style={styles.sortText}>Mới nhất</Text>
          </View>
          <View style={styles.filterBtn}>
            <Text style={styles.totalBadge}>
              {filtered.length} đánh giá
            </Text>
          </View>
        </View>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#E84040" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} activeOpacity={0.8}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map((k) => (
            <ReviewSkeleton key={k} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReviewCard
              item={item}
              myUserId={myUserIdRef.current}
              shopId={shopIdRef.current}
              token={tokenRef.current}
              onLikeChange={() => { }}
              onReply={(r) => {
                setReplyTarget(r);
                setReplyModalVisible(true);
              }}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PRIMARY}
              colors={[PRIMARY]}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={{ marginVertical: 16 }}
                color={PRIMARY}
              />
            ) : null
          }
          ListEmptyComponent={
            !loading && !error ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="comment-off-outline"
                  size={52}
                  color="#C0D4C4"
                />
                <Text style={styles.emptyTitle}>Chưa có đánh giá nào</Text>
                <Text style={styles.emptySubtitle}>
                  Khi khách hàng đánh giá, chúng sẽ xuất hiện tại đây.
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Reply Modal */}
      <ReplyModal
        visible={replyModalVisible}
        targetReview={replyTarget}
        shopId={shopIdRef.current}
        token={tokenRef.current}
        onClose={() => setReplyModalVisible(false)}
        onSuccess={(comment) => {
          setReviews((prev) => [comment, ...prev]);
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F2F7F3",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Montserrat-Bold",
    color: "#1A1A1A",
  },

  // Tabs
  tabsWrapper: {
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  tab: {
    marginRight: 24,
    paddingBottom: 12,
    paddingTop: 8,
    position: "relative",
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
    color: "#9EB4A4",
  },
  tabTextActive: { color: PRIMARY },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: PRIMARY,
    borderRadius: 2,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sortText: {
    fontSize: 12,
    fontFamily: "Montserrat-Medium",
    color: "#5A6E5E",
  },
  filterBtn: {
    borderRadius: 8,
    backgroundColor: SOFT_GREEN,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  totalBadge: {
    fontSize: 11,
    fontFamily: "Montserrat-SemiBold",
    color: PRIMARY,
  },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF0F0",
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFD0D0",
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    color: "#C0303030",
  },
  retryText: {
    fontSize: 12,
    fontFamily: "Montserrat-Bold",
    color: "#E84040",
  },

  // List
  listContent: { padding: 14, gap: 0 },

  // Review card
  reviewCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "#D0EAD8",
    backgroundColor: "#EDF7F0",
  },
  reviewerName: {
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
    color: "#1A1A1A",
    marginBottom: 3,
  },
  reviewTime: {
    fontSize: 11,
    fontFamily: "Montserrat-Regular",
    color: "#A8B8AC",
  },
  reviewText: {
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
    color: "#3A4A3C",
    lineHeight: 20,
    marginBottom: 2,
  },
  readMore: {
    fontSize: 12,
    fontFamily: "Montserrat-SemiBold",
    color: PRIMARY,
    marginBottom: 8,
  },
  reviewActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#EEF4EF",
    marginTop: 10,
    paddingTop: 10,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  likeCount: {
    fontSize: 12,
    fontFamily: "Montserrat-SemiBold",
    color: "#B0C4B4",
  },
  replyIconBtn: { padding: 4 },

  // Skeleton
  skeletonCircle: {
    borderRadius: 999,
    backgroundColor: "#E8F0EA",
  },
  skeletonLine: {
    borderRadius: 6,
    backgroundColor: "#E8F0EA",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: "Montserrat-SemiBold",
    color: "#7A9E82",
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
    color: "#A0B4A4",
    textAlign: "center",
    lineHeight: 20,
  },

  // Modal
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
    color: "#1A1A1A",
  },
  sendBtn: {
    fontSize: 15,
    fontFamily: "Montserrat-Bold",
  },
  replyPreview: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: SOFT_GREEN,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  replyPreviewBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: PRIMARY,
    alignSelf: "stretch",
  },
  replyPreviewName: {
    fontSize: 12,
    fontFamily: "Montserrat-Bold",
    color: "#1A4A28",
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    color: "#3A5A40",
    lineHeight: 18,
  },
  replyInput: {
    margin: 16,
    marginBottom: 4,
    minHeight: 120,
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
    color: "#1A1A1A",
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 11,
    fontFamily: "Montserrat-Regular",
    color: "#A0B4A4",
    textAlign: "right",
    marginBottom: 8,
  },
});
