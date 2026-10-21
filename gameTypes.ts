export type DayPhase = 'DAY' | 'NIGHT';
export type SceneMode = 'OVERWORLD' | 'TELESALES' | 'CANTEEN' | 'ESCAPE_MAZE' | 'ENDING' | 'AWARENESS';

export interface TelesalesChoice {
  text: string;
  suspicionDelta: number; // effect on victim suspicion
  trustDelta: number; // effect on manager trust
  conscienceDelta: number; // effect on player conscience
  isWarning?: boolean;
}

export interface TelesalesVictim {
  id: string;
  name: string;
  role: string;
  avatarKey: string;
  aspectRatio: number;
  initialSuspicion: number;
  dialogues: {
    prompt: string;
    choices: TelesalesChoice[];
  }[];
}

export interface InventoryItem {
  id: 'wire_cutters' | 'flashlight' | 'torn_map';
  name: string;
  desc: string;
  iconKey: string;
}

export interface GuardAI {
  id: string;
  x: number;
  y: number;
  patrolPoints: {x: number; y: number}[];
  currentPointIndex: number;
  angle: number; // in radians
  state: 'UNAWARE' | 'SUSPICIOUS' | 'SEARCHING' | 'ALERT';
  suspicionTimer: number;
  visionRange: number;
  visionAngle: number; // cone fov in radians
  speed: number;
}

export interface OverworldInteractable {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  action: 'DESK' | 'CANTEEN' | 'BED' | 'LOCKER' | 'FENCE' | 'AWARENESS';
}

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  staminaRestore: number;
  moraleRestore: number;
  iconKey: string;
}

export const FOOD_MENU: FoodItem[] = [
  {
    id: 'rice_plate',
    name: 'Dĩa Cơm Thịt',
    price: 10,
    staminaRestore: 60,
    moraleRestore: 25,
    iconKey: 'food_rice_plate',
  },
  {
    id: 'instant_noodles',
    name: 'Mì Ăn Liền',
    price: 5,
    staminaRestore: 30,
    moraleRestore: 10,
    iconKey: 'food_instant_noodles',
  },
  {
    id: 'white_rice',
    name: 'Cơm Trắng Đơn Sơ',
    price: 2,
    staminaRestore: 15,
    moraleRestore: 2,
    iconKey: 'food_rice_plate',
  },
];

export const TELESALES_VICTIMS: TelesalesVictim[] = [
  {
    id: 'uncle_sau',
    name: 'Bác Sáu (Nông dân miền Tây)',
    role: 'Nhẹ dạ, muốn kiếm tiền cất nhà cho con',
    avatarKey: 'telesales_target_uncle',
    aspectRatio: 742 / 722,
    initialSuspicion: 15,
    dialogues: [
      {
        prompt: 'A lô, ai vậy? Tôi nghe bảo có dự án "Nông trại sầu riêng không trọng lực" lợi nhuận 300% một tuần hả chú?',
        choices: [
          {
            text: 'Dạ đúng rồi bác! Sầu riêng bay lơ lửng không rụng gai, tưới bằng nước ngưng tụ ngoài vũ trụ, bao trúng!',
            suspicionDelta: -10,
            trustDelta: 15,
            conscienceDelta: -10,
          },
          {
            text: 'Bác ơi, cháu là Minh. Bác cúp máy đi, đây là bẫy lừa đảo sang biên giới đó, đừng chuyển tiền!',
            suspicionDelta: 50,
            trustDelta: -30,
            conscienceDelta: 25,
            isWarning: true,
          },
          {
            text: 'Bác chỉ cần chuyển cọc 10 triệu đồng mua cổ phần hạt giống Sao Kim là tuần sau nhận cổ tức 50 triệu!',
            suspicionDelta: 5,
            trustDelta: 20,
            conscienceDelta: -15,
          },
        ],
      },
      {
        prompt: 'Ủa sao nghe giống đa cấp trên thời sự cảnh báo dữ vậy chú? Bác già rồi, tiền dưỡng già đó nghen...',
        choices: [
          {
            text: 'Trời ơi bác! Tập đoàn cháu có giấy phép của Liên Hợp Quốc liên ngân hà, thời sự họ chưa cập nhật công nghệ đâu!',
            suspicionDelta: -15,
            trustDelta: 20,
            conscienceDelta: -15,
          },
          {
            text: 'Cháu lạy bác, giữ chặt tiền trong ngân hàng, đừng nghe bất kỳ ai hứa hẹn lợi nhuận cao!',
            suspicionDelta: 60,
            trustDelta: -35,
            conscienceDelta: 30,
            isWarning: true,
          },
          {
            text: 'Nếu bác chuyển ngay trong 10 phút, cháu xin sếp tặng bác thêm 1 vé bốc thăm phi thuyền bay!',
            suspicionDelta: 10,
            trustDelta: 25,
            conscienceDelta: -20,
          },
        ],
      },
      {
        prompt: 'Nghe chú nói cũng bùi tai... Giờ bác ra cây ATM chuyển tiền vào số tài khoản cá nhân chú đưa đúng hôn?',
        choices: [
          {
            text: 'Dạ đúng rồi bác Sáu, chuyển ngay số tài khoản VIP này nhé, chúc mừng bác sắp thành triệu phú sầu riêng!',
            suspicionDelta: -20,
            trustDelta: 30,
            conscienceDelta: -25,
          },
          {
            text: 'Bác ơi dừng lại! Cháu đang bị nhốt trong trại lừa đảo, người ta ép cháu gọi đó, bác cứu cả bác lẫn cháu bằng cách báo công an đi!',
            suspicionDelta: 100,
            trustDelta: -50,
            conscienceDelta: 40,
            isWarning: true,
          },
          {
            text: 'Bác nhớ chuyển thêm phí xác minh VIP 2 triệu nữa nghen bác, hệ thống tự động ghi nhận.',
            suspicionDelta: 15,
            trustDelta: 35,
            conscienceDelta: -30,
          },
        ],
      },
    ],
  },
  {
    id: 'student_nam',
    name: 'Cậu Nam (Sinh viên công nghệ)',
    role: 'Thích kiếm tiền nhanh, tò mò công nghệ mới',
    avatarKey: 'telesales_target_student',
    aspectRatio: 599 / 753,
    initialSuspicion: 30,
    dialogues: [
      {
        prompt: 'Alo, bên anh có việc làm trực tuyến "Gõ văn bản lượng tử AI" lương 50 triệu/tháng đúng không anh?',
        choices: [
          {
            text: 'Chuẩn luôn em trai! Việc nhẹ ngồi phòng máy lạnh, chỉ cần nạp 2 triệu kích hoạt tài khoản máy chủ ảo Cloud!',
            suspicionDelta: -15,
            trustDelta: 15,
            conscienceDelta: -10,
          },
          {
            text: 'Em Nam tỉnh táo lại! Không có việc nào gõ phím mà 50 triệu đâu, em sẽ bị lừa sạch tiền học phí đó!',
            suspicionDelta: 40,
            trustDelta: -25,
            conscienceDelta: 25,
            isWarning: true,
          },
          {
            text: 'Đây là thuật toán Blockchain độc quyền Web 4.0, ai đăng ký sớm được tặng coin tự động đào!',
            suspicionDelta: -5,
            trustDelta: 20,
            conscienceDelta: -15,
          },
        ],
      },
      {
        prompt: 'Ủa sao link web nạp tiền em thấy đuôi lạ hoắc .xyz vậy anh? Với lại mã nguồn trông sơ sài quá...',
        choices: [
          {
            text: 'Đó là server bảo mật chuẩn quân sự Thụy Sĩ em ơi! Giao diện tối giản để tối ưu tốc độ hash rate!',
            suspicionDelta: -20,
            trustDelta: 25,
            conscienceDelta: -15,
          },
          {
            text: 'Web lừa đảo đấy em, chuyên clone để chiếm đoạt tài khoản. Đừng click vào link kẻo mất mã OTP!',
            suspicionDelta: 50,
            trustDelta: -30,
            conscienceDelta: 30,
            isWarning: true,
          },
          {
            text: 'Do em dùng trình duyệt cũ thôi, nạp tiền là tự động đồng bộ bảo chứng qua ví MetaMask!',
            suspicionDelta: 10,
            trustDelta: 15,
            conscienceDelta: -15,
          },
        ],
      },
      {
        prompt: 'Em vừa vay app được 10 triệu định đóng học phí kỳ này, anh đảm bảo hoàn vốn sau 2 tiếng thật chứ?',
        choices: [
          {
            text: 'Anh cam kết uy tín 100%! Nạp ngay vào mã giao dịch này, 2 tiếng sau rút về 25 triệu mua laptop xịn!',
            suspicionDelta: -25,
            trustDelta: 30,
            conscienceDelta: -30,
          },
          {
            text: 'Nam ơi đừng vay app! Tiền học phí là mồ hôi của bố mẹ, em nạp là mất trắng và bị xã hội đen đòi nợ đó!',
            suspicionDelta: 100,
            trustDelta: -50,
            conscienceDelta: 40,
            isWarning: true,
          },
          {
            text: 'Nạp nhanh trước 11h trưa để nhận gói nhân đôi tài khoản từ quỹ tài trợ AI quốc tế!',
            suspicionDelta: 5,
            trustDelta: 35,
            conscienceDelta: -25,
          },
        ],
      },
    ],
  },
  {
    id: 'vendor_chi_ba',
    name: 'Chị Ba (Tiểu thương chợ đầu mối)',
    role: 'Thận trọng, buôn bán vất vả, sợ mất vốn',
    avatarKey: 'telesales_target_vendor',
    aspectRatio: 722 / 866,
    initialSuspicion: 40,
    dialogues: [
      {
        prompt: 'Tôi đang bận dọn hàng chợ, ai gọi đấy? Lại chào mời chứng khoán đa cấp lừa đảo hả?',
        choices: [
          {
            text: 'Dạ đâu có chị Ba! Em bên "Quỹ Hỗ trợ Tiểu thương Chợ" lãi suất 0% vốn vay không thế chấp tới 200 triệu!',
            suspicionDelta: -20,
            trustDelta: 20,
            conscienceDelta: -10,
          },
          {
            text: 'Chị Ba ơi cúp máy liền đi! Bọn em bị bắt ép lừa tiểu thương vay lãi suất cắt cổ và thu phí hồ sơ ảo đó!',
            suspicionDelta: 60,
            trustDelta: -30,
            conscienceDelta: 25,
            isWarning: true,
          },
          {
            text: 'Gói vay chính sách ưu đãi mùa dịch, chỉ giải ngân cho 5 tiểu thương duy nhất hôm nay!',
            suspicionDelta: -10,
            trustDelta: 15,
            conscienceDelta: -10,
          },
        ],
      },
      {
        prompt: 'Vay 0% sao bắt đóng trước phí bảo hiểm rủi ro 15 triệu? Tiền đâu tôi đóng?',
        choices: [
          {
            text: 'Phí bảo hiểm ngân hàng giữ hộ chị thôi, sau 10 phút tiền giải ngân về sẽ hoàn lại nguyên vẹn!',
            suspicionDelta: -20,
            trustDelta: 25,
            conscienceDelta: -20,
          },
          {
            text: 'Đó là chiêu trò "đóng phí để giải ngân", đóng xong họ sẽ đòi thêm phí thuế, không bao giờ có tiền đâu chị!',
            suspicionDelta: 70,
            trustDelta: -35,
            conscienceDelta: 30,
            isWarning: true,
          },
          {
            text: 'Nếu chị không đóng ngay thì điểm tín dụng chị bị khóa vĩnh viễn trên hệ thống quốc gia đó nha!',
            suspicionDelta: 15,
            trustDelta: 25,
            conscienceDelta: -20,
          },
        ],
      },
      {
        prompt: 'Thôi được, tôi gom tiền hàng đóng thử... mà lừa tôi là tôi lên tận công ty quậy nát đấy!',
        choices: [
          {
            text: 'Yên tâm đi chị Ba, công ty em trụ sở tòa nhà Landmark lớn nhất nước, chị chuyển vào số tài khoản kế toán này nha!',
            suspicionDelta: -25,
            trustDelta: 35,
            conscienceDelta: -30,
          },
          {
            text: 'Chị ơi đừng! Trụ sở thực chất là trại tập trung bên kia biên giới, có súng ống lính gác, chị mất tiền không đòi được đâu!',
            suspicionDelta: 100,
            trustDelta: -50,
            conscienceDelta: 40,
            isWarning: true,
          },
          {
            text: 'Chuyển thêm 2 triệu phí dịch vụ ưu tiên để nhân viên thẩm định hồ sơ duyệt ngay trong 3 phút chị nhé!',
            suspicionDelta: 20,
            trustDelta: 35,
            conscienceDelta: -25,
          },
        ],
      },
    ],
  },
];
