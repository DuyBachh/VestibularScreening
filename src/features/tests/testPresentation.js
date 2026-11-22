import { t } from '../language/language.js';
/** @type {Record<string, {title: string, description: string}>} */
const descriptions = {
  'okn': { title: 'Quan sát các dải chuyển động', description: 'Quan sát các dải sáng–tối chuyển động ngang, đổi hướng giữa lượt. Giữ đầu cố định; chưa tự đánh giá phản xạ mắt.' },
  'gaze-evoked': { title: 'Giữ ánh nhìn tại các vị trí', description: 'Nhìn vào chấm vàng tại giữa, trái, phải, trên và dưới. Giữ đầu cố định; chưa tự đánh giá rung giật nhãn cầu.' },
  'anti-saccade': { title: 'Nhìn về phía đối diện chấm', description: 'Chấm bên trái: nhìn sang phải. Chấm bên phải: nhìn sang trái. Giữ đầu cố định; bài chưa tự chấm đúng/sai.' },
  'smooth-pursuit': { title: 'Nhìn theo chấm di chuyển', description: 'Dùng mắt theo dõi chấm vàng đi liên tục sang hai bên, giữ đầu cố định.' },
  'horizontal-saccades': { title: 'Nhìn nhanh tới chấm mới', description: 'Chuyển ánh nhìn tới chấm vàng vừa xuất hiện ở trái, giữa hoặc phải, giữ đầu cố định.' },
  'vertical-saccades': { title: 'Nhìn nhanh theo chiều dọc', description: 'Chuyển ánh nhìn tới chấm vàng vừa xuất hiện ở trên, giữa hoặc dưới, giữ đầu cố định.' },
};
/** @param {string} id */
export function testPresentation(id) { const description = descriptions[id]; if (description) return { title: t(description.title), description: t(description.description) }; return { title: t("Bài kiểm tra"), description: t("Xem hướng dẫn trước khi thực hiện.") }; }
