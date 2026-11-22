export const testCatalog = [
  { id: 'smooth-pursuit', name: 'Smooth Pursuit', description: 'Theo dõi điểm di chuyển liên tục bằng mắt, giữ đầu cố định.', phase: 'Ưu tiên · Giai đoạn 4' },
  { id: 'horizontal-saccades', name: 'Horizontal Saccades', description: 'Nhìn nhanh tới mục tiêu lần lượt xuất hiện ở trái, giữa và phải.', phase: 'Ưu tiên · Giai đoạn 4' },
  { id: 'vertical-saccades', name: 'Vertical Saccades', description: 'Nhìn nhanh giữa các mục tiêu trên, giữa và dưới.', phase: 'Mô phỏng học tập' },
  { id: 'anti-saccade', name: 'Anti-Saccade', description: 'Nhìn về phía đối diện với chấm xuất hiện, giữ đầu cố định.', phase: 'Mô phỏng học tập' },
  { id: 'gaze-evoked', name: 'Gaze-Evoked Nystagmus', description: 'Giữ ánh nhìn tại chấm đứng yên ở giữa, trái và phải, giữ đầu cố định.', phase: 'Mô phỏng học tập' },
  { id: 'okn', name: 'Optokinetic Nystagmus', description: 'Quan sát các dải sáng–tối chuyển động ngang và đổi hướng giữa lượt.', phase: 'Mô phỏng học tập' },
];

export const supportedTests = testCatalog.filter((test) => ['smooth-pursuit', 'horizontal-saccades', 'vertical-saccades', 'anti-saccade', 'gaze-evoked', 'okn'].includes(test.id));
/** @param {string} id */
export function isSupportedTest(id) { return supportedTests.some((test) => test.id === id); }
