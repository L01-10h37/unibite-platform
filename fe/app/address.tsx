import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://20.255.57.186:8080';
const SEARCH_DEBOUNCE_MS = 450;
const REVERSE_GEOCODE_DEBOUNCE_MS = 600;

const C = {
  bgMain: '#C5E0CD',
  white: '#FFFFFF',
  primaryDark: '#176A21',
  primaryDarker: '#005F31',
  primaryDeep: '#295D38',
  lightGreen: '#9DF197',
  paleLightGreen: 'rgba(157, 241, 151, 0.3)',
  textDark: '#223131',
  textMid: '#4E5F5E',
  textLight: '#697A79',
  borderLight: '#C8E2E1',
  tealLight: '#D7EDEC',
};

type AddressType = 'home' | 'school' | 'office' | 'other';

interface SavedAddress {
  id: string;
  icon: AddressType;
  title: string;
  address: string;
  displayAddress?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

interface UserProfileAddressApi {
  id?: string;
  _id?: string;
  title?: string;
  type?: AddressType;
  address?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

interface UserProfileApi {
  addresses?: UserProfileAddressApi[];
  defaultDeliveryAddressId?: string | null;
}

interface PlaceSuggestion {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

function isCoordinateString(value?: string) {
  if (!value) {
    return false;
  }
  return /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(value.trim());
}

function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function isSameRegion(a: Region, b: Region) {
  return (
    Math.abs(a.latitude - b.latitude) < 0.00001 &&
    Math.abs(a.longitude - b.longitude) < 0.00001 &&
    Math.abs(a.latitudeDelta - b.latitudeDelta) < 0.00001 &&
    Math.abs(a.longitudeDelta - b.longitudeDelta) < 0.00001
  );
}

function getSavedAddressText(item: SavedAddress) {
  if (item.displayAddress) {
    return item.displayAddress;
  }

  if (item.address && !isCoordinateString(item.address)) {
    return item.address;
  }

  return 'Đang xác định địa chỉ...';
}

function RealMap({
  region,
  mapRef,
  onRegionChangeComplete,
  currentAddress,
  isFetchingAddress,
}: {
  region: Region;
  mapRef: React.RefObject<MapView | null>;
  onRegionChangeComplete: (nextRegion: Region) => void;
  currentAddress: string;
  isFetchingAddress: boolean;
}) {
  return (
    <View style={mapStyles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        provider={PROVIDER_GOOGLE}
      />

      <View style={mapStyles.centerPinPointer} pointerEvents="none">
        <View style={mapStyles.pinOuter}>
          <Feather name="map-pin" size={24} color={C.primaryDark} />
        </View>
        <View style={mapStyles.pinShadow} />
      </View>

      <View style={mapStyles.locationBadge}>
        {isFetchingAddress ? (
          <ActivityIndicator size="small" color={C.primaryDark} />
        ) : (
          <>
            <Feather name="map-pin" size={11} color={C.primaryDark} />
            <Text style={mapStyles.locationText} numberOfLines={1}>
              {currentAddress || 'Đang xác định...'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const mapStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#223131',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
    position: 'relative',
  },
  centerPinPointer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinOuter: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  pinShadow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: 4,
  },
  locationBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    color: C.textDark,
    fontFamily: 'BeVietnamPro-SemiBold',
  },
});

function AddressItem({
  item,
  onSetDefault,
  onEdit,
  onDelete,
}: {
  item: SavedAddress;
  onSetDefault: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const iconName =
    item.icon === 'home'
      ? 'home'
      : item.icon === 'school'
        ? 'book-open'
        : item.icon === 'office'
          ? 'briefcase'
          : 'map-pin';

  const iconBg = item.icon === 'home' ? C.primaryDark : item.icon === 'school' ? C.tealLight : C.borderLight;
  const iconColor = item.icon === 'home' ? '#D1FFC8' : C.textMid;

  return (
    <View style={addressStyles.card}>
      <View style={[addressStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Feather name={iconName as any} size={18} color={iconColor} />
      </View>

      <View style={addressStyles.content}>
        <View style={addressStyles.titleRow}>
          <Text style={addressStyles.title}>{item.title}</Text>
          <View style={addressStyles.actionBtns}>
            <TouchableOpacity onPress={onSetDefault} style={addressStyles.actionBtn}>
              <Feather
                name={item.isDefault ? 'check-circle' : 'circle'}
                size={15}
                color={item.isDefault ? C.primaryDark : C.textLight}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onEdit} style={addressStyles.actionBtn}>
              <Feather name="edit-2" size={14} color={C.textLight} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={addressStyles.actionBtn}>
              <Feather name="trash-2" size={13} color={C.textLight} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={addressStyles.address} numberOfLines={2}>
          {getSavedAddressText(item)}
        </Text>
        {item.isDefault && <Text style={addressStyles.defaultLabel}>MẶC ĐỊNH</Text>}
      </View>
    </View>
  );
}

const addressStyles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    gap: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    color: C.textDark,
    lineHeight: 24,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
  address: {
    fontSize: 14,
    color: C.textMid,
    lineHeight: 20,
    fontFamily: 'BeVietnamPro-Medium',
  },
  defaultLabel: {
    fontSize: 10,
    color: C.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
    fontFamily: 'BeVietnamPro-Bold',
  },
});

function AddNewAddressButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={addNewStyles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={addNewStyles.iconCircle}>
        <Feather name="plus" size={16} color={C.textMid} />
      </View>
      <Text style={addNewStyles.label}>Thêm địa chỉ mới</Text>
    </TouchableOpacity>
  );
}

const addNewStyles = StyleSheet.create({
  container: {
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.4)',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    gap: 12,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    color: C.textMid,
    fontFamily: 'BeVietnamPro-Bold',
  },
});

function AddressEditorModal({
  visible,
  mode,
  currentAddress,
  titleValue,
  typeValue,
  errorText,
  onTitleChange,
  onTypeChange,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  mode: 'add' | 'edit';
  currentAddress: string;
  titleValue: string;
  typeValue: AddressType;
  errorText: string;
  onTitleChange: (value: string) => void;
  onTypeChange: (type: AddressType) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const title = mode === 'add' ? 'Thêm địa chỉ mới' : 'Chỉnh sửa địa chỉ';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <SafeAreaView style={editorStyles.safeArea}>
        <View style={editorStyles.container}>
          <View style={editorStyles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Feather name="x" size={24} color={C.textDark} />
            </TouchableOpacity>
            <Text style={editorStyles.headerTitle}>{title}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={editorStyles.content}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={editorStyles.section}>
              <Text style={editorStyles.sectionLabel}>Địa chỉ đang chọn</Text>
              <View style={editorStyles.addressBox}>
                <Feather name="map-pin" size={16} color={C.primaryDark} />
                <Text style={editorStyles.addressText} numberOfLines={2}>
                  {currentAddress || 'Chưa có địa chỉ hợp lệ'}
                </Text>
              </View>
            </View>

            <View style={editorStyles.section}>
              <Text style={editorStyles.sectionLabel}>Tên địa chỉ</Text>
              <TextInput
                style={editorStyles.input}
                placeholder="VD: Nhà riêng, Chỗ làm..."
                placeholderTextColor={C.textLight}
                value={titleValue}
                onChangeText={onTitleChange}
              />
            </View>

            <View style={editorStyles.section}>
              <Text style={editorStyles.sectionLabel}>Loại địa chỉ</Text>
              <View style={editorStyles.typeSelector}>
                {[
                  { type: 'home', label: 'Nhà', icon: 'home' },
                  { type: 'school', label: 'Trường', icon: 'book-open' },
                  { type: 'office', label: 'Công việc', icon: 'briefcase' },
                  { type: 'other', label: 'Khác', icon: 'map-pin' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      editorStyles.typeBtn,
                      typeValue === option.type && editorStyles.typeBtnActive,
                    ]}
                    onPress={() => onTypeChange(option.type as AddressType)}
                  >
                    <Feather
                      name={option.icon as any}
                      size={18}
                      color={typeValue === option.type ? C.white : C.textMid}
                    />
                    <Text
                      style={[
                        editorStyles.typeBtnText,
                        typeValue === option.type && editorStyles.typeBtnTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {!!errorText && <Text style={editorStyles.errorText}>{errorText}</Text>}
          </ScrollView>

          <View style={editorStyles.footer}>
            <TouchableOpacity style={editorStyles.cancelBtn} onPress={onCancel}>
              <Text style={editorStyles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={editorStyles.confirmBtn} onPress={onConfirm}>
              <Text style={editorStyles.confirmBtnText}>
                {mode === 'add' ? 'Thêm địa chỉ' : 'Lưu thay đổi'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const editorStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bgMain,
  },
  container: {
    flex: 1,
    backgroundColor: C.bgMain,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    color: C.textDark,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: C.textDark,
    fontFamily: 'BeVietnamPro-Bold',
    marginBottom: 8,
  },
  addressBox: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: C.textMid,
    fontFamily: 'BeVietnamPro-Medium',
  },
  input: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: C.textDark,
    fontFamily: 'BeVietnamPro-Regular',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeBtn: {
    width: '47%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.borderLight,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  typeBtnActive: {
    backgroundColor: C.primaryDark,
    borderColor: C.primaryDark,
  },
  typeBtnText: {
    fontSize: 14,
    color: C.textMid,
    fontFamily: 'BeVietnamPro-Medium',
  },
  typeBtnTextActive: {
    color: C.white,
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
    marginBottom: 12,
    fontFamily: 'BeVietnamPro-Medium',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: C.borderLight,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    color: C.textDark,
    fontFamily: 'BeVietnamPro-Bold',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: C.primaryDeep,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 16,
    color: C.white,
    fontFamily: 'BeVietnamPro-Bold',
  },
});

function ConfirmActionModal({
  visible,
  title,
  description,
  confirmText,
  loading,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmText: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={confirmStyles.backdrop} onPress={onCancel}>
        <Pressable style={confirmStyles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={confirmStyles.title}>{title}</Text>
          <Text style={confirmStyles.description}>{description}</Text>
          <View style={confirmStyles.actions}>
            <TouchableOpacity style={confirmStyles.cancelBtn} onPress={onCancel}>
              <Text style={confirmStyles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={confirmStyles.confirmBtn} onPress={onConfirm}>
              {loading ? (
                <ActivityIndicator size="small" color={C.white} />
              ) : (
                <Text style={confirmStyles.confirmText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const confirmStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 24, 27, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    color: C.textDark,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  description: {
    fontSize: 14,
    color: C.textMid,
    lineHeight: 20,
    fontFamily: 'BeVietnamPro-Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.borderLight,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    color: C.textDark,
    fontSize: 15,
    fontFamily: 'BeVietnamPro-Bold',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: C.primaryDeep,
    alignItems: 'center',
    paddingVertical: 12,
  },
  confirmText: {
    color: C.white,
    fontSize: 15,
    fontFamily: 'BeVietnamPro-Bold',
  },
});

function PromoCard() {
  return (
    <View style={promoStyles.card}>
      <View style={promoStyles.textSection}>
        <Text style={promoStyles.tagText}>MẸO GIAO HÀNG</Text>
        <Text style={promoStyles.heading}>Lưu địa chỉ giúp bạn đặt hàng nhanh hơn 40%</Text>
      </View>
      {/* <View style={promoStyles.imageWrapper}>
        <Image
          source={require('../assets/images/veggies.png')}
          style={{ width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 16 }}
        />
      </View> */}
    </View>
  );
}

const promoStyles = StyleSheet.create({
  card: {
    backgroundColor: C.paleLightGreen,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 23,
    gap: 20,
  },
  textSection: {
    flex: 1,
    gap: 8,
  },
  tagText: {
    fontSize: 10,
    color: C.primaryDark,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'BeVietnamPro-Bold',
  },
  heading: {
    fontSize: 16,
    color: '#005C15',
    lineHeight: 22,
    fontFamily: 'BeVietnamPro-Bold',
  },
  imageWrapper: {
    width: 84,
    height: 84,
    transform: [{ rotate: '3deg' }],
  },
});

export default function AddressScreen() {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programmaticMoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProgrammaticGeocodeRef = useRef<Region | null>(null);
  const geocodeRequestIdRef = useRef(0);
  const geocodeCacheRef = useRef<Record<string, string>>({});
  const isProgrammaticMoveRef = useRef(false);
  const mapRef = useRef<MapView | null>(null);

  const [region, setRegion] = useState<any>(null);

  const [currentAddress, setCurrentAddress] = useState('');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedDefaultId, setSelectedDefaultId] = useState<string | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLocatingCurrent, setIsLocatingCurrent] = useState(false);

  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddressTitle, setNewAddressTitle] = useState('');
  const [newAddressType, setNewAddressType] = useState<AddressType>('home');
  const [uiErrorText, setUiErrorText] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<SavedAddress | null>(null);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const normalizeAddressType = (type?: string): AddressType => {
    if (type === 'home' || type === 'school' || type === 'office' || type === 'other') {
      return type;
    }
    return 'other';
  };

  const getAccessToken = React.useCallback(async () => {
    const raw = await SecureStore.getItemAsync('tokens');
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.accessToken as string | undefined;
  }, []);

  const resolveReadableAddress = async (latitude: number, longitude: number) => {
    const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    const cached = geocodeCacheRef.current[cacheKey];
    if (cached) return cached;

    // Dùng expo-location thay vì gọi Nominatim trực tiếp
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = results[0];

    if (!place) return '';

    // Ghép địa chỉ kiểu Việt Nam
    const parts = [
        place.streetNumber,
        place.street,
        place.subregion || place.district,
        place.city,
    ].filter(Boolean);

    const readable = parts.join(', ') || place.formattedAddress || '';
    geocodeCacheRef.current[cacheKey] = readable;
    return readable;
  };

  const fetchProfileAddresses = React.useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Vui lòng đăng nhập lại.');
      }

      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Không thể tải danh sách địa chỉ.');
      }

      const profile = payload.data as UserProfileApi;

      // Bước 1: map thành SavedAddress thô, chưa có displayAddress
      const rawAddresses: SavedAddress[] = (profile.addresses || [])
        .map((item) => {
          const hasCoords =
            typeof item.latitude === 'number' && typeof item.longitude === 'number';
          // address field chỉ dùng làm key/fallback; nếu backend lưu tọa độ text thì bỏ qua
          const rawAddress =
            item.address && !isCoordinateString(item.address) ? item.address : undefined;

          if (!hasCoords && !rawAddress) {
            return null;
          }

          return {
            id: item.id || item._id || Date.now().toString(),
            icon: normalizeAddressType(item.type),
            title: item.title?.trim() || 'Địa chỉ đã lưu',
            // address: chỉ dùng nội bộ, không hiện ra UI trực tiếp
            address: rawAddress || formatCoordinates(item.latitude!, item.longitude!),
            displayAddress: rawAddress, // sẽ được resolve bên dưới nếu có tọa độ
            latitude: hasCoords ? item.latitude : undefined,
            longitude: hasCoords ? item.longitude : undefined,
            isDefault: !!item.isDefault,
          } as SavedAddress;
        })
        .filter((item): item is SavedAddress => !!item);

      const defaultId =
        profile.defaultDeliveryAddressId ||
        rawAddresses.find((item) => item.isDefault)?.id ||
        null;

      const merged = rawAddresses.map((item) => ({
        ...item,
        isDefault: !!defaultId && item.id === defaultId,
      }));

      // Bước 2: resolve tất cả địa chỉ có tọa độ song song (parallel)
      const resolvedAddresses = await Promise.all(
        merged.map(async (item) => {
          // Nếu đã có displayAddress rõ ràng (không phải tọa độ) thì dùng luôn
          if (item.displayAddress && !isCoordinateString(item.displayAddress)) {
            return item;
          }
          // Nếu có tọa độ thì resolve
          if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
            try {
              const readable = await resolveReadableAddress(item.latitude, item.longitude);
              return { ...item, displayAddress: readable };
            } catch {
              return item;
            }
          }
          return item;
        })
      );

      setSavedAddresses(resolvedAddresses);
      setSelectedDefaultId(defaultId);

      // Bước 3: căn map về địa chỉ mặc định (hoặc địa chỉ đầu tiên)
      const focused = resolvedAddresses.find((item) => item.isDefault) || resolvedAddresses[0];
      if (focused && typeof focused.latitude === 'number' && typeof focused.longitude === 'number') {
        const nextRegion = {
          latitude: focused.latitude,
          longitude: focused.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setRegion(nextRegion);
        setCurrentAddress(focused.displayAddress || '');
      }
    } catch (error: any) {
      setUiErrorText(error?.message || 'Không thể tải dữ liệu địa chỉ.');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    void fetchProfileAddresses();

    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [fetchProfileAddresses]);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    const requestId = ++geocodeRequestIdRef.current;
    setIsFetchingAddress(true);
    try {
      const readable = await resolveReadableAddress(latitude, longitude);
      if (requestId === geocodeRequestIdRef.current) {
        setCurrentAddress(readable);
      }
    } catch {
      if (requestId === geocodeRequestIdRef.current) {
        setCurrentAddress('');
      }
    } finally {
      if (requestId === geocodeRequestIdRef.current) {
        setIsFetchingAddress(false);
      }
    }
  };

  const searchAddressSuggestions = async (keyword: string) => {
    const cleaned = keyword.trim();
    if (cleaned.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=vn&limit=6&q=${encodeURIComponent(cleaned)}`,
        {
          headers: { Accept: 'application/json' },
        }
      );
      const payload = response.ok ? ((await readJsonSafely<any[]>(response)) ?? []) : [];
      const mapped = (payload || [])
        .map((item) => {
          const latitude = Number(item.lat);
          const longitude = Number(item.lon);
          if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return null;
          }
          return {
            id: `${item.osm_id || item.place_id}`,
            label: item.display_name,
            address: item.display_name,
            latitude,
            longitude,
          } as PlaceSuggestion;
        })
        .filter((item): item is PlaceSuggestion => !!item);

      setSuggestions(mapped);
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAddressSuggestions(searchText);
    }, SEARCH_DEBOUNCE_MS);
  }, [searchText]);

  const setProgrammaticRegion = (nextRegion: Region, addressText?: string) => {
    isProgrammaticMoveRef.current = true;
    pendingProgrammaticGeocodeRef.current = nextRegion;

    if (programmaticMoveTimeoutRef.current) {
      clearTimeout(programmaticMoveTimeoutRef.current);
    }

    setRegion(nextRegion);
    if (addressText) {
      setCurrentAddress(addressText);
    }

    mapRef.current?.animateToRegion(nextRegion, 240);

    programmaticMoveTimeoutRef.current = setTimeout(() => {
      isProgrammaticMoveRef.current = false;
      const pendingRegion = pendingProgrammaticGeocodeRef.current;
      pendingProgrammaticGeocodeRef.current = null;
      if (pendingRegion) {
        if (geocodeTimeoutRef.current) {
          clearTimeout(geocodeTimeoutRef.current);
        }
        geocodeTimeoutRef.current = setTimeout(() => {
          reverseGeocode(pendingRegion.latitude, pendingRegion.longitude);
        }, 80);
      }
    }, 420);
  };

  const handleRegionChangeComplete = (nextRegion: Region) => {
    if (isProgrammaticMoveRef.current) {
      setRegion(nextRegion);
      return;
    }

    if (region && isSameRegion(region, nextRegion)) {
      return;
    }

    setRegion(nextRegion);

    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    geocodeTimeoutRef.current = setTimeout(() => {
      reverseGeocode(nextRegion.latitude, nextRegion.longitude);
    }, REVERSE_GEOCODE_DEBOUNCE_MS);
  };

  const handleUseCurrentLocation = async () => {
    if (isLocatingCurrent) {
      return;
    }

    setIsLocatingCurrent(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setUiErrorText('Bạn cần cấp quyền vị trí để sử dụng tính năng này.');
        return;
      }

      const cachedLocation = await Location.getLastKnownPositionAsync();
      const location =
        cachedLocation ||
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

      const nextRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setProgrammaticRegion(nextRegion);
      void reverseGeocode(nextRegion.latitude, nextRegion.longitude);
    } catch {
      setUiErrorText('Không thể lấy vị trí hiện tại.');
    } finally {
      setIsLocatingCurrent(false);
    }
  };

  const openAddModal = () => {
    setEditorMode('add');
    setEditingAddressId(null);
    setNewAddressTitle('');
    setNewAddressType('home');
    setUiErrorText('');
    setShowEditorModal(true);
  };

  const openEditModal = (item: SavedAddress) => {
    setEditorMode('edit');
    setEditingAddressId(item.id);
    setNewAddressTitle(item.title);
    setNewAddressType(item.icon);
    // Hiển thị địa chỉ readable (displayAddress) thay vì address tọa độ
    setCurrentAddress(item.displayAddress || (!isCoordinateString(item.address) ? item.address : ''));
    setUiErrorText('');

    if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
      const nextRegion = {
        latitude: item.latitude,
        longitude: item.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setProgrammaticRegion(nextRegion, item.displayAddress || item.address);
    }

    setShowEditorModal(true);
  };

  const closeEditorModal = () => {
    setShowEditorModal(false);
    setEditingAddressId(null);
    setNewAddressTitle('');
    setNewAddressType('home');
    setUiErrorText('');
  };

  const submitAddressEditor = () => {
    if (!newAddressTitle.trim()) {
      setUiErrorText('Vui lòng nhập tên địa chỉ.');
      return;
    }

    if (!currentAddress.trim()) {
      setUiErrorText('Vui lòng chọn địa chỉ hợp lệ trên bản đồ hoặc từ gợi ý.');
      return;
    }

    setUiErrorText('');

    if (editorMode === 'edit' && editingAddressId) {
      setSavedAddresses((prev) =>
        prev.map((item) =>
          item.id === editingAddressId
            ? {
                ...item,
                title: newAddressTitle.trim(),
                icon: newAddressType,
                // address: dùng tọa độ làm key nội bộ
                address: formatCoordinates(region.latitude, region.longitude),
                // displayAddress: địa chỉ readable để hiển thị UI
                displayAddress: currentAddress,
                latitude: region.latitude,
                longitude: region.longitude,
              }
            : item
        )
      );
      closeEditorModal();
      return;
    }

    const item: SavedAddress = {
      id: Date.now().toString(),
      icon: newAddressType,
      title: newAddressTitle.trim(),
      // address: dùng tọa độ làm key nội bộ (backend cũng chỉ nhận lat/lon)
      address: formatCoordinates(region.latitude, region.longitude),
      // displayAddress: địa chỉ readable để hiển thị UI
      displayAddress: currentAddress,
      latitude: region.latitude,
      longitude: region.longitude,
      isDefault: !selectedDefaultId,
    };

    setSavedAddresses((prev) => [...prev, item]);
    if (!selectedDefaultId) {
      setSelectedDefaultId(item.id);
    }
    closeEditorModal();
  };

  const selectSuggestion = (item: PlaceSuggestion) => {
    const nextRegion = {
      latitude: item.latitude,
      longitude: item.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    setSearchText(item.label);
    setCurrentAddress(item.address);
    setSuggestions([]);
    setProgrammaticRegion(nextRegion, item.address);
  };

  const removeAddress = () => {
    if (!deleteTarget) {
      return;
    }

    const nextList = savedAddresses.filter((item) => item.id !== deleteTarget.id);
    setSavedAddresses(nextList);

    if (selectedDefaultId === deleteTarget.id) {
      setSelectedDefaultId(nextList[0]?.id || null);
    }

    setDeleteTarget(null);
  };

  const saveAddressesToProfile = async () => {
    if (!selectedDefaultId) {
      setUiErrorText('Vui lòng chọn 1 địa chỉ chính để giao hàng.');
      return;
    }

    if (savedAddresses.length === 0) {
      setUiErrorText('Bạn chưa có địa chỉ nào để lưu.');
      return;
    }

    setUiErrorText('');
    setIsSavingProfile(true);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Vui lòng đăng nhập lại.');
      }

      const payload = {
        addresses: savedAddresses.map((item) => ({
          id: item.id,
          title: item.title,
          type: item.icon,
          // Gửi lên backend: lat/lon (không gửi text address, backend lưu tọa độ)
          latitude: item.latitude,
          longitude: item.longitude,
          isDefault: item.id === selectedDefaultId,
        })),
        defaultDeliveryAddressId: selectedDefaultId,
      };

      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await readJsonSafely<any>(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Không thể lưu địa chỉ.');
      }

      setShowConfirmSave(false);
      setShowSaveSuccess(true);
      await fetchProfileAddresses();
    } catch (error: any) {
      setUiErrorText(error?.message || 'Lưu địa chỉ thất bại.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const preparedAddresses = savedAddresses.map((item) => ({
    ...item,
    isDefault: !!selectedDefaultId && item.id === selectedDefaultId,
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
            <Feather name="chevron-left" size={22} color="#17181B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Địa chỉ</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.searchWrapper}>
            <View style={styles.searchIconWrap}>
              <Feather name="search" size={18} color={C.textLight} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm địa chỉ..."
              placeholderTextColor={C.textLight}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
          </View>

          {isSearching && (
            <View style={styles.suggestionsLoadingWrap}>
              <ActivityIndicator size="small" color={C.primaryDark} />
              <Text style={styles.suggestionsLoadingText}>Đang tìm địa chỉ...</Text>
            </View>
          )}

          {!isSearching && suggestions.length > 0 && (
            <View style={styles.suggestionsList}>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(item)}
                >
                  <Feather name="map-pin" size={16} color={C.primaryDark} />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <RealMap
            region={region}
            mapRef={mapRef}
            onRegionChangeComplete={handleRegionChangeComplete}
            currentAddress={currentAddress}
            isFetchingAddress={isFetchingAddress}
          />

          <TouchableOpacity style={styles.locationBtn} activeOpacity={0.85} onPress={handleUseCurrentLocation}>
            <Feather name="crosshair" size={22} color={C.primaryDarker} />
            <Text style={styles.locationBtnText}>Sử dụng vị trí hiện tại</Text>
          </TouchableOpacity>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Địa chỉ đã lưu</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{preparedAddresses.length} Địa chỉ</Text>
            </View>
          </View>

          <View style={styles.cardsGap}>
            {isLoadingProfile && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={C.primaryDark} />
                <Text style={styles.loadingText}>Đang tải danh sách địa chỉ...</Text>
              </View>
            )}

            {!isLoadingProfile && preparedAddresses.length === 0 && (
              <View style={styles.emptyStateCard}>
                <Feather name="inbox" size={20} color={C.textLight} />
                <Text style={styles.emptyStateText}>Bạn chưa lưu địa chỉ nào.</Text>
              </View>
            )}

            {preparedAddresses.map((item) => (
              <AddressItem
                key={item.id}
                item={item}
                onSetDefault={() => setSelectedDefaultId(item.id)}
                onEdit={() => openEditModal(item)}
                onDelete={() => setDeleteTarget(item)}
              />
            ))}

            <AddNewAddressButton onPress={openAddModal} />
          </View>

          {!!uiErrorText && <Text style={styles.globalErrorText}>{uiErrorText}</Text>}

          <PromoCard />

          <View style={{ height: 16 }} />
        </ScrollView>

        <View style={styles.confirmWrapper}>
          <TouchableOpacity
            style={[styles.confirmBtn, isSavingProfile && styles.confirmBtnDisabled]}
            activeOpacity={0.9}
            onPress={() => setShowConfirmSave(true)}
            disabled={isSavingProfile}
          >
            {isSavingProfile ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <>
                <Text style={styles.confirmBtnText}>Xác nhận địa chỉ</Text>
                <Feather name="check-circle" size={20} color={C.white} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <AddressEditorModal
          visible={showEditorModal}
          mode={editorMode}
          currentAddress={currentAddress}
          titleValue={newAddressTitle}
          typeValue={newAddressType}
          errorText={uiErrorText}
          onTitleChange={setNewAddressTitle}
          onTypeChange={setNewAddressType}
          onConfirm={submitAddressEditor}
          onCancel={closeEditorModal}
        />

        <ConfirmActionModal
          visible={!!deleteTarget}
          title="Xóa địa chỉ"
          description={`Bạn chắc chắn muốn xóa địa chỉ "${deleteTarget?.title || ''}"?`}
          confirmText="Xóa"
          onConfirm={removeAddress}
          onCancel={() => setDeleteTarget(null)}
        />

        <ConfirmActionModal
          visible={showConfirmSave}
          title="Xác nhận địa chỉ giao hàng"
          description="Địa chỉ chính sẽ được lưu vào profile và dùng làm mặc định khi đặt đơn."
          confirmText="Lưu và áp dụng"
          loading={isSavingProfile}
          onConfirm={saveAddressesToProfile}
          onCancel={() => setShowConfirmSave(false)}
        />

        <ConfirmActionModal
          visible={showSaveSuccess}
          title="Đã lưu thành công"
          description="Địa chỉ đã được cập nhật vào profile."
          confirmText="Về hồ sơ"
          onConfirm={() => {
            setShowSaveSuccess(false);
            router.back();
          }}
          onCancel={() => setShowSaveSuccess(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bgMain,
  },
  container: {
    flex: 1,
    backgroundColor: C.bgMain,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: '#17181B',
    fontFamily: 'Montserrat-ExtraBold',
  },
  headerRight: {
    width: 34,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  searchWrapper: {
    backgroundColor: C.white,
    borderRadius: 48,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#223131',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
  searchIconWrap: {
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: C.textDark,
    paddingRight: 24,
    paddingVertical: 18,
    fontFamily: 'BeVietnamPro-Regular',
  },
  suggestionsLoadingWrap: {
    backgroundColor: C.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionsLoadingText: {
    color: C.textMid,
    fontSize: 13,
    fontFamily: 'BeVietnamPro-Medium',
  },
  suggestionsList: {
    backgroundColor: C.white,
    borderRadius: 20,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomColor: C.borderLight,
    borderBottomWidth: 1,
  },
  suggestionText: {
    flex: 1,
    color: C.textDark,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'BeVietnamPro-Medium',
  },
  locationBtn: {
    backgroundColor: C.white,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
    shadowColor: '#223131',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  locationBtnText: {
    fontSize: 14,
    color: C.primaryDarker,
    fontFamily: 'BeVietnamPro-SemiBold',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    color: C.textDark,
    letterSpacing: -0.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  badge: {
    backgroundColor: C.lightGreen,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    color: C.primaryDark,
    lineHeight: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },
  cardsGap: {
    gap: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: C.white,
  },
  loadingText: {
    fontSize: 14,
    color: C.textMid,
    fontFamily: 'BeVietnamPro-Medium',
  },
  emptyStateCard: {
    borderRadius: 20,
    backgroundColor: C.white,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: C.textMid,
    fontFamily: 'BeVietnamPro-Medium',
  },
  globalErrorText: {
    color: '#B42318',
    fontSize: 13,
    fontFamily: 'BeVietnamPro-Medium',
  },
  confirmWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 8,
  },
  confirmBtn: {
    backgroundColor: C.primaryDeep,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    shadowColor: C.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  confirmBtnDisabled: {
    opacity: 0.8,
  },
  confirmBtnText: {
    fontSize: 16,
    color: C.white,
    fontFamily: 'BeVietnamPro-Bold',
  },
});
