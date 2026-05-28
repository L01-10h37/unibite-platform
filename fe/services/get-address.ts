import * as Location from 'expo-location';

export const resolveReadableAddress = async (latitude: number, longitude: number) => {
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
    return readable;
};