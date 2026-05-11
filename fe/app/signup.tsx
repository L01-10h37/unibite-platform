import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	Dimensions,
} from 'react-native';

import Svg, { ClipPath, Defs, Path, Image as ImageSVG } from 'react-native-svg';

import {
	Eye,
	EyeOff,
	KeyRound,
	Phone,
	User,
} from 'lucide-react-native';

import imgLogo from '../assets/images/logo.png';

export default function SignUpScreen() {
	const [username, setUsername] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [errors, setErrors] = useState<{
		username?: string;
		phoneNumber?: string;
		password?: string;
		confirmPassword?: string;
	}>({});

	const { width } = Dimensions.get('window'); // Dùng để vẽ background

	const validateUsername = (username: string) => {
		return username.length >= 3 && username.length <= 20;
	};

	const validatePhone = (phone: string) => {
		const phoneRegex = /^[0-9]{10,11}$/;
		return phoneRegex.test(phone);
	};

	const handleSubmit = async () => {
		const newErrors: {
			username?: string;
			phoneNumber?: string;
			password?: string;
			confirmPassword?: string;
		} = {};

		if (!username) {
			newErrors.username = 'Tên tài khoản là bắt buộc';
		} else if (!validateUsername(username)) {
			newErrors.username = 'Tên tài khoản phải có từ 3 đến 20 ký tự';
		}

		if (!phoneNumber) {
			newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
		} else if (!validatePhone(phoneNumber)) {
			newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
		}

		if (!password) {
			newErrors.password = 'Mật khẩu là bắt buộc';
		} else if (password.length < 6) {
			newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
		}

		if (!confirmPassword) {
			newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
		} else if (confirmPassword !== password) {
			newErrors.confirmPassword = 'Mật khẩu không khớp';
		}

		setErrors(newErrors);

		if (Object.keys(newErrors).length === 0) {
			const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ username, phoneNumber, password }),
			});
			const data = await res.json();
			console.log('Sign up response:', data);

			if (!data.accessToken) {
				setErrors({ username: 'Đăng ký thất bại. Vui lòng thử lại.' });
				return;
			}

		}
	};

	return (
		<View style={styles.container}>
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* 1. Phần Wavy Header với màu xanh chủ đạo */}
				<View style={styles.header}>
					<Svg
						height="100%"
						width="100%"
						viewBox={`0 0 ${width} 300`}
						preserveAspectRatio="none"
						style={styles.svg}
					>
						<Defs>
							{/* ĐỊNH NGHĨA KHUÔN CẮT (CLIPPATH) */}
							{/* Dùng lại mã Path tạo hình dạng sóng */}
							<ClipPath id="wavyShape">
								<Path
									d={`M0,0 L${width},0 L${width},220 C${width * 0.7},320 ${width * 0.3},150 0,250 Z`}
								/>
							</ClipPath>
						</Defs>

						{/* VẼ LỚP NỀN MÀU XANH TRƯỚC */}
						<Path
							fill="#459e66" // Màu xanh chủ đạo
							d={`M0,0 L${width},0 L${width},220 C${width * 0.7},320 ${width * 0.3},150 0,250 Z`}
						/>

						{/* CHÈN ẢNH HOẠ TIẾT VÀO VÀ ÁP DỤNG KHUÔN CẮT */}
						<ImageSVG
							x="0"
							y="0"
							width="100%"
							height="100%"
							preserveAspectRatio="xMidYMid slice" // Đảm bảo ảnh phủ kín không bị méo
							opacity="0.2" // Điều chỉnh độ mờ của ảnh để không làm mất đi màu xanh chủ đạo
							href={require('../assets/images/sign-in-bg.png')}
							clipPath="url(#wavyShape)" // GỌI KHUÔN CẮT ĐÃ ĐỊNH NGHĨA Ở TRÊN
						/>
					</Svg>

					{/* Placeholder for Unibite Logo */}
					<View style={styles.logoContainer}>
						<Image source={imgLogo} style={styles.logo} resizeMode="contain" />
					</View>
				</View>

				{/* Form Section */}
				<View style={styles.formSection}>
					<View style={styles.formContainer}>
						{/* Title */}
						<View style={styles.titleContainer}>
							<Text style={styles.title}>Đăng ký</Text>
							<View style={styles.titleUnderline} />
						</View>

						{/* Username Field */}
						<View style={styles.fieldContainer}>
							<Text style={styles.labelLarge}>Tên tài khoản</Text>
							<View style={styles.inputWrapper}>
								<View style={styles.inputRow}>
									<User style={styles.icon} size={16} />
									<View style={styles.divider} />
									<TextInput
										style={styles.input}
										value={username}
										onChangeText={setUsername}
										placeholder="Nhập tên tài khoản"
										placeholderTextColor="#616161"
										keyboardType="default"
										autoCapitalize="none"
									/>
								</View>
								<View style={[styles.inputUnderline, errors.username && styles.inputUnderlineError]} />
							</View>
							{errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
						</View>

						{/* Phone Number Field */}
						<View style={styles.fieldContainer}>
							<Text style={styles.label}>Số điện thoại</Text>
							<View style={styles.inputWrapper}>
								<View style={styles.inputRow}>
									<Phone style={styles.icon} size={16} />
									<View style={styles.divider} />
									<TextInput
										style={styles.input}
										value={phoneNumber}
										onChangeText={setPhoneNumber}
										placeholder="Nhập số điện thoại"
										placeholderTextColor="#616161"
										keyboardType="phone-pad"
									/>
								</View>
								<View style={[styles.inputUnderline, errors.phoneNumber && styles.inputUnderlineError]} />
							</View>
							{errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
						</View>

						{/* Password Field */}
						<View style={styles.fieldContainer}>
							<Text style={styles.label}>Mật khẩu</Text>
							<View style={styles.inputWrapper}>
								<View style={styles.inputRow}>
									<KeyRound style={styles.iconGray} size={16} />
									<View style={styles.dividerGray} />
									<TextInput
										style={styles.inputGray}
										value={password}
										onChangeText={setPassword}
										placeholder="Nhập mật khẩu"
										placeholderTextColor="#BDBDBD"
										secureTextEntry={!showPassword}
										autoCapitalize="none"
									/>
									<TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
										{showPassword ? <Eye style={styles.iconGray} size={20} /> : <EyeOff style={styles.iconGray} size={20} />}
									</TouchableOpacity>
								</View>
								<View style={[styles.inputUnderlineGray, errors.password && styles.inputUnderlineError]} />
							</View>
							{errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
						</View>

						{/* Confirm Password Field */}
						<View style={styles.fieldContainer}>
							<Text style={styles.label}>Xác nhận mật khẩu</Text>
							<View style={styles.inputWrapper}>
								<View style={styles.inputRow}>
									<KeyRound style={styles.iconGray} size={16} />
									<View style={styles.dividerGray} />
									<TextInput
										style={styles.inputGray}
										value={confirmPassword}
										onChangeText={setConfirmPassword}
										placeholder="Nhập lại mật khẩu"
										placeholderTextColor="#BDBDBD"
										secureTextEntry={!showConfirmPassword}
										autoCapitalize="none"
									/>
									<TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
										{showConfirmPassword ? <Eye style={styles.iconGray} size={20} /> : <EyeOff style={styles.iconGray} size={20} />}
									</TouchableOpacity>
								</View>
								<View
									style={[styles.inputUnderlineGray, errors.confirmPassword && styles.inputUnderlineError]}
								/>
							</View>
							{errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
						</View>

						{/* Submit Button */}
						<TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
							<Text style={styles.submitButtonText}>Đăng ký</Text>
						</TouchableOpacity>

						{/* Switch to Sign In */}
						<View style={styles.switchContainer}>
							<Text style={styles.switchText}>Đã có tài khoản? </Text>
							<Link href="/signin" style={styles.switchLink}>
								Đăng nhập
							</Link>
						</View>
					</View>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	scrollView: {
		flex: 1,
	},
	svg: {
    backgroundColor: 'transparent',
  },
	header: {
		height: 280,
		overflow: 'hidden',
		position: 'relative',
	},
	backgroundContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		width: '100%',
		height: '100%',
	},
	backgroundImage: {
		width: '100%',
		height: '100%',
	},
	logoContainer: {
		position: 'absolute',
		top: -50,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 16,
		zIndex: 10,
	},
	logo: {
		width: 180,
		height: 180,
	},
	formSection: {
		backgroundColor: 'transparent',
		borderTopLeftRadius: 40,
		borderTopRightRadius: 40,
		marginTop: -50,
		paddingHorizontal: 24,
		paddingTop: 32,
		paddingBottom: 24,
	},
	formContainer: {
		maxWidth: 448,
	},
	titleContainer: {
		marginBottom: 24,
	},
	title: {
		fontFamily: 'Montserrat-ExtraBold',
		fontSize: 26,
		color: '#424242',
		marginBottom: 8,
	},
	titleUnderline: {
		width: 74,
		height: 3,
		backgroundColor: '#459B5E',
		borderRadius: 100,
	},
	fieldContainer: {
		marginBottom: 24,
	},
	labelLarge: {
		fontFamily: 'Montserrat-Bold',
		fontSize: 20,
		color: '#424242',
		marginBottom: 12,
	},
	label: {
		fontFamily: 'Montserrat-Bold',
		fontSize: 18,
		color: '#424242',
		marginBottom: 12,
	},
	inputWrapper: {
		position: 'relative',
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingBottom: 8,
		gap: 8,
	},
	icon: {
		fontSize: 16,
		color: '#616161',
	},
	iconGray: {
		fontSize: 16,
		color: '#BDBDBD',
	},
	divider: {
		width: 1,
		height: 8,
		backgroundColor: '#616161',
	},
	dividerGray: {
		width: 1,
		height: 8,
		backgroundColor: '#BDBDBD',
	},
	input: {
		flex: 1,
		fontFamily: 'Montserrat-Regular',
		fontSize: 14,
		color: '#616161',
		padding: 0,
	},
	inputGray: {
		flex: 1,
		fontFamily: 'Montserrat-Regular',
		fontSize: 14,
		color: '#BDBDBD',
		padding: 0,
	},
	inputUnderline: {
		height: 1.5,
		backgroundColor: '#459B5E',
		borderRadius: 100,
	},
	inputUnderlineGray: {
		height: 1.5,
		backgroundColor: '#BDBDBD',
		borderRadius: 100,
	},
	inputUnderlineError: {
		backgroundColor: '#EF4444',
	},
	errorText: {
		marginTop: 4,
		fontSize: 12,
		color: '#EF4444',
		fontFamily: 'Montserrat-Regular',
	},
	submitButton: {
		width: '100%',
		backgroundColor: '#459B5E',
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	submitButtonText: {
		fontFamily: 'Montserrat-Bold',
		fontSize: 18,
		color: '#F8F8FF',
	},
	switchContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 24,
	},
	switchText: {
		fontFamily: 'Montserrat-Medium',
		fontSize: 14,
		color: '#9E9E9E',
	},
	switchLink: {
		fontFamily: 'Montserrat-SemiBold',
		fontSize: 14,
		color: '#459B5E',
	},
});
