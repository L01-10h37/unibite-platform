import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { readAuthTokens } from "@/services/auth-session";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";
const DEFAULT_FOOD_ID = "69f73f1b97a704ff41e13e32";
const COMMENT_PAGE_SIZE = 5;
const DEFAULT_REVIEW_AVATAR = require("@/assets/images/review-avatar.png");

const FALLBACK_FOOD_IMAGES = [
  require("@/assets/images/bun-bo-hue-detail-1.png"),
  require("@/assets/images/bun-bo-hue-detail-2.png"),
  require("@/assets/images/bun-bo-hue-detail-3.png"),
];

type FoodDetail = {
  id: string;
  name: string;
  description: string;
  shopId: string;
  shopName: string;
  listUrlImg: string[];
  price: number;
  specialPrice?: number | null;
  startTime?: string;
  endTime?: string;
  average_rating?: number;
  rating_count?: number;
};

type FoodDetailResponse = {
  success: boolean;
  message: string;
  data: FoodDetail;
};

type FoodCommentUser = {
  _id?: string;
  username?: string;
  name?: string;
  avatar?: string | null;
};

type FoodComment = {
  id: string;
  postId: string;
  userId: FoodCommentUser | string;
  content: string;
  rating?: number;
  likeCount?: number;
  likes?: string[];
  image?: string | null;
  reply?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type CommentListResponse = {
  success: boolean;
  message: string;
  data: FoodComment[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
};

type CommentResponse = {
  success: boolean;
  message: string;
  data: FoodComment;
};

type CartAddResponse = {
  success: boolean;
  message?: string;
};

function formatPrice(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function getCommentUserName(user: FoodComment["userId"]) {
  if (typeof user === "string") {
    return "Người dùng";
  }

  return user.name || user.username || "Người dùng";
}

function getCommentAvatar(user: FoodComment["userId"]) {
  if (typeof user === "string") {
    return null;
  }

  return user.avatar?.trim() || null;
}

function formatCommentTime(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function decodeJwtPayload(token: string): { id?: string; _id?: string; userId?: string; sub?: string } | null {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = globalThis.atob(padded);

    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getUserIdFromToken(token: string | null) {
  if (!token) {
    return "";
  }

  const payload = decodeJwtPayload(token);
  return payload?.id || payload?._id || payload?.userId || payload?.sub || "";
}

function isCommentLikedByUser(comment: FoodComment, userId: string) {
  if (!userId) {
    return false;
  }

  return (comment.likes ?? []).some((id) => id?.toString() === userId);
}

function isCurrentTimeInRange(startTime?: string, endTime?: string) {
  if (!startTime || !endTime) {
    return false;
  }

  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }

  return start <= end
    ? current >= start && current <= end
    : current >= start || current <= end;
}

export default function FoodDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const foodId = id ?? DEFAULT_FOOD_ID;
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [food, setFood] = useState<FoodDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [comments, setComments] = useState<FoodComment[]>([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [likingCommentIds, setLikingCommentIds] = useState<Set<string>>(
    () => new Set()
  );
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentRating, setNewCommentRating] = useState(5);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [failedAvatarIds, setFailedAvatarIds] = useState<Set<string>>(
    () => new Set()
  );
  const commentsLoadingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadFood = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(`${API_URL}/api/foods/${foodId}`, {
          headers: { accept: "application/json" },
        });
        const payload = (await response.json()) as FoodDetailResponse;

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Không lấy được chi tiết món ăn");
        }

        if (isMounted) {
          setFood(payload.data);
          setActiveImage(0);
          setQuantity(1);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Không lấy được chi tiết món ăn"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFood();

    return () => {
      isMounted = false;
    };
  }, [foodId]);

  const loadComments = useCallback(
    async (pageToLoad = 1) => {
      if (commentsLoadingRef.current) {
        return;
      }

      commentsLoadingRef.current = true;
      setIsCommentsLoading(true);
      setCommentsError("");

      try {
        const tokens = await readAuthTokens("tokens");
        const accessToken = tokens?.accessToken ?? null;

        if (!accessToken) {
          throw new Error("Vui lòng đăng nhập để xem bình luận");
        }

        setCurrentUserId(getUserIdFromToken(accessToken));

        const response = await fetch(
          `${API_URL}/api/comment/${foodId}?page=${pageToLoad}&limit=${COMMENT_PAGE_SIZE}`,
          {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const payload = (await response.json()) as CommentListResponse;

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Không lấy được bình luận");
        }

        const nextComments = payload.data ?? [];
        const nextPage = payload.pagination?.page ?? pageToLoad;
        const totalPages =
          payload.pagination?.pages ??
          Math.ceil(
            (payload.pagination?.total ?? nextComments.length) /
              COMMENT_PAGE_SIZE
          );

        setComments((current) => {
          if (pageToLoad === 1) {
            return nextComments;
          }

          const existingIds = new Set(current.map((comment) => comment.id));
          return [
            ...current,
            ...nextComments.filter((comment) => !existingIds.has(comment.id)),
          ];
        });
        setCommentsPage(nextPage);
        setHasMoreComments(nextPage < totalPages);
      } catch (error) {
        setCommentsError(
          error instanceof Error ? error.message : "Không lấy được bình luận"
        );
      } finally {
        commentsLoadingRef.current = false;
        setIsCommentsLoading(false);
      }
    },
    [foodId]
  );

  useEffect(() => {
    setComments([]);
    setCommentsPage(1);
    setHasMoreComments(true);
    setCommentsError("");
    setFailedAvatarIds(new Set());
    loadComments(1);
  }, [foodId, loadComments]);

  const unitPrice =
    food?.specialPrice != null &&
    isCurrentTimeInRange(food.startTime, food.endTime)
      ? food.specialPrice
      : (food?.price ?? 0);
  const totalPrice = useMemo(() => unitPrice * quantity, [quantity, unitPrice]);
  const foodImages: ImageSourcePropType[] = food?.listUrlImg?.length
    ? food.listUrlImg.map((uri) => ({ uri }))
    : FALLBACK_FOOD_IMAGES;
  const rating = food?.average_rating ? food.average_rating.toFixed(1) : "0.0";

  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveImage(nextIndex);
  };

  const handlePageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (
      distanceFromBottom < 180 &&
      hasMoreComments &&
      !commentsLoadingRef.current
    ) {
      loadComments(commentsPage + 1);
    }
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const increaseQuantity = () => {
    setQuantity((current) => current + 1);
  };

  const handleToggleCommentLike = async (comment: FoodComment) => {
    if (likingCommentIds.has(comment.id)) {
      return;
    }

    const tokens = await readAuthTokens("tokens");
    const accessToken = tokens?.accessToken ?? null;

    if (!accessToken) {
      setCommentsError("Vui lòng đăng nhập để thích bình luận");
      return;
    }

    const alreadyLiked = isCommentLikedByUser(comment, currentUserId);
    const type = alreadyLiked ? "dec" : "inc";

    setLikingCommentIds((current) => new Set(current).add(comment.id));

    try {
      const response = await fetch(`${API_URL}/api/comment/${foodId}/like`, {
        method: "PUT",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ cmtId: comment.id, type }),
      });
      const payload = (await response.json()) as CommentResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Không cập nhật được lượt thích");
      }

      setComments((current) =>
        current.map((item) => (item.id === comment.id ? payload.data : item))
      );
      setCommentsError("");
    } catch (error) {
      setCommentsError(
        error instanceof Error ? error.message : "Không cập nhật được lượt thích"
      );
    } finally {
      setLikingCommentIds((current) => {
        const next = new Set(current);
        next.delete(comment.id);
        return next;
      });
    }
  };

  const handleSubmitComment = async () => {
    const content = newCommentText.trim();

    const tokens = await readAuthTokens("tokens");
    const accessToken = tokens?.accessToken ?? null;

    if (!accessToken) {
      setCommentsError("Vui lòng đăng nhập để bình luận");
      return;
    }

    if (!content) {
      setCommentsError("Vui lòng nhập nội dung bình luận");
      return;
    }

    if (isSubmittingComment) {
      return;
    }

    setIsSubmittingComment(true);
    setCommentsError("");

    try {
      const response = await fetch(`${API_URL}/api/comment/${foodId}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          content,
          rating: newCommentRating,
        }),
      });
      const payload = (await response.json()) as CommentResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Không thêm được bình luận");
      }

      setComments((current) => [payload.data, ...current]);
      setNewCommentText("");
      setNewCommentRating(5);
    } catch (error) {
      setCommentsError(
        error instanceof Error ? error.message : "Không thêm được bình luận"
      );
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (cmtId: string) => {
    try {
      const tokens = await readAuthTokens("tokens");
      const accessToken = tokens?.accessToken ?? null;

      if (!accessToken) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để thực hiện xóa");
        return;
      }

      const response = await fetch(`${API_URL}/api/comment/${foodId}/remove`, {
        method: "DELETE",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ cmtId }),
      });

      const payload = await response.json();

      if (response.ok && payload.success) {
        Alert.alert("Thành công", "Đã xóa bình luận!");
        setComments((current) => current.filter((c) => c.id !== cmtId));
      } else {
        Alert.alert("Thất bại", payload.message || "Không thể xóa bình luận");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi xóa bình luận");
    }
  };

  const handleCommentAvatarError = (commentId: string) => {
    setFailedAvatarIds((current) => new Set(current).add(commentId));
  };

  const openShop = () => {
    if (!food?.shopId) {
      return;
    }

    router.push({
      pathname: "/shop-detail",
      params: { id: food.shopId },
    });
  };

  const handleAddToCart = async () => {
    if (!foodId || isAddingToCart) {
      return;
    }

    const tokens = await readAuthTokens("tokens");
    const accessToken = tokens?.accessToken ?? null;

    if (!accessToken) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }

    setIsAddingToCart(true);

    try {
      const response = await fetch(`${API_URL}/api/cart/items`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          foodId,
          quantity,
        }),
      });
      const payload = (await response.json().catch(() => null)) as CartAddResponse | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Không thêm được món vào giỏ hàng");
      }

      Alert.alert("Thành công", "Đã thêm món vào giỏ hàng");
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error instanceof Error ? error.message : "Không thêm được món vào giỏ hàng"
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pageContent}
        scrollEventThrottle={16}
        onScroll={handlePageScroll}
      >
        <View style={styles.hero}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageScroll}
          >
            {foodImages.map((image, index) => (
              <Image key={index} source={image} style={styles.heroImage} />
            ))}
          </ScrollView>

          <SafeAreaView edges={["top"]} style={styles.heroOverlay}>
            <TouchableOpacity
              style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          </SafeAreaView>

          <View style={styles.dots}>
            {foodImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === activeImage ? styles.dotActive : null,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.content}>
            {isLoading ? (
              <View style={styles.stateBox}>
                <ActivityIndicator size="large" color="#43A560" />
                <Text style={styles.stateText}>Đang tải món ăn...</Text>
              </View>
            ) : errorMessage ? (
              <View style={styles.stateBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.title}>{food?.name ?? "Món ăn"}</Text>

            <View style={styles.shopRow}>
              <TouchableOpacity activeOpacity={0.75} onPress={openShop}>
                <Text style={styles.shopName}>{food?.shopName ?? "Unibite"}</Text>
              </TouchableOpacity>
              <MaterialCommunityIcons name="star" size={17} color="#F7A714" />
              <Text style={styles.rating}>{rating}</Text>
            </View>

            <Text style={styles.description}>
              {food?.description ?? "Đang cập nhật mô tả món ăn."}
            </Text>

            <View style={styles.orderRow}>
              <Text style={styles.price}>{formatPrice(unitPrice)}</Text>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  activeOpacity={0.75}
                  onPress={decreaseQuantity}
                >
                  <Text style={styles.quantityIcon}>-</Text>
                </TouchableOpacity>
                <View style={styles.quantityValue}>
                  <Text style={styles.quantityValueText}>{quantity}</Text>
                </View>
                <TouchableOpacity
                  style={styles.quantityButton}
                  activeOpacity={0.75}
                  onPress={increaseQuantity}
                >
                  <Text style={styles.quantityIcon}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0 }]}>Bình luận</Text>
              <TouchableOpacity
                style={styles.writeReviewHeaderButton}
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: "/review",
                  params: { id: foodId, name: food?.name, image: food?.listUrlImg?.[0] }
                })}
              >
                <MaterialCommunityIcons name="pencil-box-outline" size={16} color="#43A560" />
                <Text style={styles.writeReviewHeaderText}>Viết đánh giá chi tiết</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.commentComposer}>
              <View style={styles.composerStars}>
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;

                  return (
                    <TouchableOpacity
                      key={value}
                      activeOpacity={0.75}
                      onPress={() => setNewCommentRating(value)}
                    >
                      <MaterialCommunityIcons
                        name="star"
                        size={20}
                        color={value <= newCommentRating ? "#F7A714" : "#D9DEE8"}
                        style={styles.composerStar}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.composerInputRow}>
                <TextInput
                  value={newCommentText}
                  onChangeText={setNewCommentText}
                  placeholder="Viết bình luận..."
                  placeholderTextColor="#9AA1AD"
                  style={styles.commentInput}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.sendCommentButton,
                    (!newCommentText.trim() || isSubmittingComment)
                      ? styles.sendCommentButtonDisabled
                      : null,
                  ]}
                  activeOpacity={0.85}
                  disabled={!newCommentText.trim() || isSubmittingComment}
                  onPress={handleSubmitComment}
                >
                  {isSubmittingComment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {commentsError ? (
              <Text style={styles.commentStateText}>{commentsError}</Text>
            ) : null}

            {!comments.length && isCommentsLoading ? (
              <View style={styles.commentStateBox}>
                <ActivityIndicator size="small" color="#43A560" />
              </View>
            ) : null}

            {!comments.length && !isCommentsLoading && !commentsError ? (
              <Text style={styles.commentStateText}>Chưa có bình luận</Text>
            ) : null}

            {comments.map((comment) => {
              const avatar = getCommentAvatar(comment.userId);
              const starCount = Math.round(comment.rating ?? 0);
              const isLiked = isCommentLikedByUser(comment, currentUserId);
              const isLiking = likingCommentIds.has(comment.id);
              const avatarSource =
                avatar && !failedAvatarIds.has(comment.id)
                  ? { uri: avatar }
                  : DEFAULT_REVIEW_AVATAR;

              const commentOwnerId = typeof comment.userId === 'object' && comment.userId !== null
                ? comment.userId._id
                : comment.userId;
              const isOwner = currentUserId && commentOwnerId && commentOwnerId.toString() === currentUserId.toString();

              return (
                <TouchableOpacity
                  key={comment.id}
                  style={styles.comment}
                  activeOpacity={0.9}
                  onLongPress={() => {
                    if (isOwner) {
                      Alert.alert(
                        "Xóa bình luận",
                        "Bạn có chắc chắn muốn xóa bình luận này không?",
                        [
                          { text: "Hủy", style: "cancel" },
                          {
                            text: "Xóa",
                            style: "destructive",
                            onPress: () => handleDeleteComment(comment.id),
                          },
                        ]
                      );
                    }
                  }}
                >
                  <Image
                    source={avatarSource}
                    style={styles.avatar}
                    onError={() => handleCommentAvatarError(comment.id)}
                  />
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentName}>
                        {getCommentUserName(comment.userId)}
                      </Text>
                      <Text style={styles.commentTime}>
                        {formatCommentTime(comment.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.stars}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <MaterialCommunityIcons
                          key={index}
                          name="star"
                          size={14}
                          color={index < starCount ? "#F7A714" : "#D9DEE8"}
                          style={styles.star}
                        />
                      ))}
                    </View>
                    
                    {/* Content text */}
                    <Text style={styles.commentText}>{comment.content}</Text>

                    {/* Attached Image (Optional) */}
                    {comment.image && (
                      <Image source={{ uri: comment.image }} style={styles.reviewAttachedImage} />
                    )}

                    <View style={styles.commentActions}>
                      <TouchableOpacity
                        style={styles.likeRow}
                        activeOpacity={0.75}
                        disabled={isLiking}
                        onPress={() => handleToggleCommentLike(comment)}
                      >
                        <MaterialCommunityIcons
                          name={isLiked ? "heart" : "heart-outline"}
                          size={16}
                          color={isLiked ? "#42A55D" : "#806D6D"}
                        />
                        <Text
                          style={[
                            styles.likeText,
                            !isLiked ? styles.likeTextInactive : null,
                          ]}
                        >
                          {comment.likeCount ?? 0} lượt thích
                        </Text>
                      </TouchableOpacity>
                      <MaterialCommunityIcons
                        name="reply-outline"
                        size={18}
                        color="#806D6D"
                      />
                    </View>

                    {/* Seller response drawer */}
                    {comment.reply && (
                      <View style={styles.merchantReplyBox}>
                        <View style={styles.replyConnectorLine} />
                        <View style={styles.merchantReplyContent}>
                          <View style={styles.merchantReplyHeader}>
                            <MaterialCommunityIcons name="storefront" size={12} color="#43A560" />
                            <Text style={styles.merchantReplyTitle}>Phản hồi từ quán</Text>
                          </View>
                          <Text style={styles.merchantReplyText}>{comment.reply}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {comments.length && isCommentsLoading ? (
              <View style={styles.commentStateBox}>
                <ActivityIndicator size="small" color="#43A560" />
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.bottomBar}>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>{formatPrice(totalPrice)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, isAddingToCart ? styles.primaryButtonDisabled : null]}
          activeOpacity={0.9}
          disabled={isAddingToCart}
          onPress={handleAddToCart}
        >
          {isAddingToCart ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={styles.cartIcon} />
          ) : (
            <MaterialCommunityIcons
              name="cart-outline"
              size={24}
              color="#FFFFFF"
              style={styles.cartIcon}
            />
          )}
          <Text style={styles.primaryButtonText}>
            {isAddingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  pageContent: {
    paddingBottom: 92,
  },
  hero: {
    height: 292,
    backgroundColor: "#77A952",
  },
  heroImage: {
    width,
    height: 292,
    resizeMode: "cover",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  backButton: {
    width: 42,
    height: 42,
    marginLeft: 24,
    marginTop: 32,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#43A560",
  },
  dots: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 26,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.65)",
  },
  dotActive: {
    width: 18,
    backgroundColor: "#FFFFFF",
  },
  sheet: {
    minHeight: 560,
    marginTop: -16,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 22,
  },
  stateBox: {
    minHeight: 74,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    marginTop: 10,
    color: "#8993AA",
    fontSize: 13,
    fontFamily: "Montserrat-Medium",
  },
  errorText: {
    color: "#C54040",
    fontSize: 13,
    textAlign: "center",
    fontFamily: "Montserrat-SemiBold",
  },
  title: {
    color: "#101010",
    fontSize: 20,
    lineHeight: 28,
    fontFamily: "Montserrat-Bold",
  },
  shopRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  shopName: {
    marginRight: 14,
    color: "#727A91",
    fontSize: 13,
    fontFamily: "Montserrat-Medium",
  },
  rating: {
    marginLeft: 5,
    color: "#24252A",
    fontSize: 13,
    fontFamily: "Montserrat-Medium",
  },
  description: {
    marginTop: 19,
    color: "#8993AA",
    fontSize: 13,
    lineHeight: 21,
    fontFamily: "Montserrat-Medium",
  },
  orderRow: {
    marginTop: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    color: "#3F9F57",
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
  },
  quantityControl: {
    width: 100,
    height: 31,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8E6E7",
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  quantityButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityIcon: {
    color: "#2A2A2A",
    fontSize: 18,
    lineHeight: 22,
    fontFamily: "Montserrat-Medium",
  },
  quantityValue: {
    width: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#43A560",
  },
  quantityValueText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
  },
  divider: {
    height: 1,
    marginTop: 16,
    backgroundColor: "#ECECEC",
  },
  sectionTitle: {
    marginTop: 14,
    color: "#8A94AA",
    fontSize: 14,
    fontFamily: "Montserrat-Bold",
  },
  commentStateBox: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  commentStateText: {
    paddingVertical: 18,
    color: "#8993AA",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Montserrat-Medium",
  },
  commentComposer: {
    marginTop: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEF0F2",
    borderRadius: 8,
    backgroundColor: "#FAFBFC",
  },
  composerStars: {
    flexDirection: "row",
    alignItems: "center",
  },
  composerStar: {
    marginRight: 5,
  },
  composerInputRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  commentInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 90,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#E2E6EC",
    borderRadius: 8,
    color: "#192851",
    backgroundColor: "#FFFFFF",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Montserrat-Medium",
  },
  sendCommentButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#43A560",
  },
  sendCommentButtonDisabled: {
    opacity: 0.55,
  },
  comment: {
    flexDirection: "row",
    paddingTop: 17,
    paddingBottom: 19,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F2",
  },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    marginLeft: 0,
    marginRight: 14,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commentName: {
    flex: 1,
    color: "#192851",
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
  },
  commentTime: {
    marginLeft: 10,
    color: "#8993AA",
    fontSize: 12,
    fontFamily: "Montserrat-Medium",
  },
  stars: {
    flexDirection: "row",
    marginTop: 7,
  },
  star: {
    marginRight: 4,
  },
  commentText: {
    marginTop: 13,
    color: "#192851",
    fontSize: 12,
    lineHeight: 19,
    fontFamily: "Montserrat-Medium",
  },
  commentActions: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  likeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeText: {
    marginLeft: 6,
    color: "#42A55D",
    fontSize: 12,
    fontFamily: "Montserrat-Bold",
  },
  likeTextInactive: {
    color: "#806D6D",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
  },
  secondaryButton: {
    width: 86,
    height: 49,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0F0F0F",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#111111",
    fontSize: 14,
    fontFamily: "Montserrat-Bold",
  },
  primaryButton: {
    flex: 1,
    height: 49,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    backgroundColor: "#43A560",
    paddingHorizontal: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.72,
  },
  cartIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
  },
  reviewAttachedImage: {
    marginTop: 10,
    width: "90%",
    height: 140,
    borderRadius: 10,
    resizeMode: "cover",
    backgroundColor: "#F0F3F1",
  },
  merchantReplyBox: {
    marginTop: 10,
    flexDirection: "row",
    paddingRight: 0,
  },
  replyConnectorLine: {
    width: 2,
    backgroundColor: "#43A560",
    opacity: 0.3,
    marginRight: 8,
    borderRadius: 1,
  },
  merchantReplyContent: {
    flex: 1,
    backgroundColor: "#F7F9F7",
    borderRadius: 10,
    padding: 10,
  },
  merchantReplyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  merchantReplyTitle: {
    fontSize: 11,
    fontFamily: "Montserrat-Bold",
    color: "#43A560",
  },
  merchantReplyText: {
    fontSize: 11,
    fontFamily: "Montserrat-Medium",
    color: "#536078",
    lineHeight: 15,
  },
  writeReviewHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 0,
  },
  writeReviewHeaderText: {
    fontSize: 11,
    color: "#43A560",
    fontFamily: "Montserrat-Bold",
  },
});
