import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>PHÒNG KHÁM · DEMO</Text>
        <Text style={styles.title}>Sàng lọc tiền đình</Text>
        <Text style={styles.subtitle}>
          Công cụ hỗ trợ quy trình kiểm tra chuyển động mắt
        </Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Bản trình diễn đồ án</Text>
          <Text style={styles.noticeText}>
            Chưa tích hợp camera, Apple Vision hoặc theo dõi đồng tử.
            Kết quả kiểm tra sẽ dùng dữ liệu mô phỏng.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Bài kiểm tra trong MVP</Text>

        <View style={styles.testRow}>
          <View style={styles.testNumber}>
            <Text style={styles.testNumberText}>01</Text>
          </View>
          <View style={styles.testInfo}>
            <Text style={styles.testTitle}>Smooth Pursuit</Text>
            <Text style={styles.testDescription}>
              Theo dõi mục tiêu di chuyển mượt
            </Text>
          </View>
        </View>

        <View style={styles.testRow}>
          <View style={styles.testNumber}>
            <Text style={styles.testNumberText}>02</Text>
          </View>
          <View style={styles.testInfo}>
            <Text style={styles.testTitle}>Horizontal Saccades</Text>
            <Text style={styles.testDescription}>
              Nhìn nhanh giữa các mục tiêu ngang
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Hồ sơ bệnh nhân</Text>
        <View style={styles.patientPanel}>
          <Text style={styles.patientTitle}>Chưa chọn bệnh nhân</Text>
          <Text style={styles.patientDescription}>
            Hồ sơ giả lập và lịch sử kiểm tra sẽ được bổ sung ở mốc tiếp theo.
          </Text>
        </View>

        <Text style={styles.disclaimer}>
          Ứng dụng demo hỗ trợ sàng lọc, không phải thiết bị chẩn đoán
          và không thay thế đánh giá của bác sĩ.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 32,
  },
  brand: {
    color: '#55746A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    marginTop: 10,
    color: '#1D2B27',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    color: '#65716D',
    fontSize: 15,
    lineHeight: 22,
  },
  notice: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#E8EFEC',
    borderLeftWidth: 4,
    borderLeftColor: '#55746A',
  },
  noticeTitle: {
    color: '#263A33',
    fontSize: 15,
    fontWeight: '700',
  },
  noticeText: {
    marginTop: 6,
    color: '#44534D',
    fontSize: 14,
    lineHeight: 21,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    color: '#26332F',
    fontSize: 17,
    fontWeight: '700',
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DDE3E0',
  },
  testNumber: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EFEC',
  },
  testNumberText: {
    color: '#426358',
    fontWeight: '700',
  },
  testInfo: {
    marginLeft: 13,
    flex: 1,
  },
  testTitle: {
    color: '#26332F',
    fontSize: 15,
    fontWeight: '600',
  },
  testDescription: {
    marginTop: 4,
    color: '#65716D',
    fontSize: 13,
  },
  patientPanel: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE3E0',
  },
  patientTitle: {
    color: '#26332F',
    fontSize: 15,
    fontWeight: '600',
  },
  patientDescription: {
    marginTop: 6,
    color: '#65716D',
    fontSize: 14,
    lineHeight: 21,
  },
  disclaimer: {
    marginTop: 24,
    color: '#65716D',
    fontSize: 12,
    lineHeight: 18,
  },
});
