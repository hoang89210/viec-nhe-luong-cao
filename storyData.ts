/**
 * @fileoverview Story content for "Việc Nhẹ Lương Cao": telesales call scripts,
 * roommates and random daily events.
 *
 * NOTE: every scam script here is a deliberately absurd parody (flying durian
 * farms, karaoke goldfish...). They are NOT realistic scam techniques. The
 * hidden "Cảnh báo" lines teach the real warning signs instead.
 */
import {TelesalesChoice, TelesalesVictim} from './gameTypes';

/** Choice helper: text, suspicion delta, manager-trust delta, conscience delta. */
const c = (text: string, s: number, t: number, k: number): TelesalesChoice => ({
  text,
  suspicionDelta: s,
  trustDelta: t,
  conscienceDelta: k,
});

// Balance notes: per exchange there's usually one reply that fits the target's
// worry (suspicion down), one so-so (+~10) and one that backfires (+~30).
// A call fails when suspicion reaches 95.
export const TELESALES_VICTIMS: TelesalesVictim[] = [
  {
    id: 'uncle_sau',
    name: 'Bác Sáu (Nông dân miền Tây)',
    role: 'Nhẹ dạ, muốn kiếm tiền cất nhà cho con',
    avatarKey: 'telesales_target_uncle',
    initialSuspicion: 20,
    dialogues: [
      {
        prompt: 'A lô, ai vậy? Nghe nói bên chú có dự án "Nông trại sầu riêng không trọng lực", trái bay lơ lửng khỏi cần hái hả?',
        choices: [
          c('Dạ đúng rồi bác! Sầu riêng bay lơ lửng, chín tự hạ cánh xuống rổ, khỏi leo cây té gãy chân!', -15, 4, -2),
          c('Dạ... thật ra cháu cũng chưa thấy trái nào bay, nhưng sếp cháu nói vậy.', 30, -6, 0),
          c('Bác chốt liền đi, không là mai trái bay qua nước khác hết đó!', 10, 6, -2),
        ],
        warning: 'Bác ơi, không có sầu riêng nào biết bay đâu. Ai hứa lời to như vậy là lừa đó, bác cúp máy đi!',
      },
      {
        prompt: 'Mà sầu riêng bay vậy lỡ bay mất thì sao chú? Bác già rồi, chạy theo hổng kịp đâu nghen.',
        choices: [
          c('Dạ mỗi trái được buộc một sợi chỉ đỏ phong thủy, bay tới đâu cũng tự về chủ bác ơi!', -18, 4, -2),
          c('Thì bác mua thêm gói "lưới bắt sầu riêng" 5 triệu nữa là xong!', 12, 6, -3),
          c('Bay mất thì... chịu thôi bác.', 32, -6, 0),
        ],
        warning: 'Bác ơi, thật lòng cháu nói: dự án này bịa đó. Bác giữ tiền lại, đừng chuyển cho ai qua điện thoại!',
      },
      {
        prompt: 'Thằng Út nhà bác nói mấy vụ "lời 300% một tuần" toàn là lừa đảo. Chú nói sao?',
        choices: [
          c('Út nói đúng với mấy dự án dưới đất thôi bác, còn sầu riêng tụi cháu ở trên trời mà!', -12, 4, -2),
          c('Bác đừng nghe con nít, tụi nhỏ biết gì!', 18, 5, -3),
          c('Dạ... 300% thì đúng là hơi nhiều thiệt.', 30, -6, 0),
        ],
        warning: 'Út nhà bác nói đúng đó bác. Lời 300% một tuần là dấu hiệu lừa đảo 100%. Bác nghe con nha!',
      },
      {
        prompt: 'Ờ... nghe cũng xuôi tai. Mà bác phải làm giấy tờ gì không chú?',
        choices: [
          c('Dạ khỏi giấy tờ, bác chỉ cần hát một câu vọng cổ để kích hoạt hợp đồng âm thanh thôi!', -15, 5, -2),
          c('Bác gửi giùm cháu hình chụp sổ đỏ cho chắc ăn.', 25, 6, -4),
          c('Giấy tờ thì... để cháu hỏi lại sếp.', 12, -3, 0),
        ],
        warning: 'Bác đừng gửi giấy tờ hay mã gì cho người lạ hết. Cúp máy rồi kể con cháu nghe nha bác.',
      },
      {
        prompt: 'Thôi được, bác góp thử "một thúng lúa". Chú ghi tên bác vô danh sách trồng sầu riêng trên mây nghen!',
        choices: [
          c('Dạ cháu ghi rồi! Chúc mừng bác thành "phi công sầu riêng" đầu tiên của miền Tây!', -10, 6, -3),
          c('Một thúng hơi ít bác ơi, bác góp luôn chuồng heo đi.', 22, 7, -4),
          c('Dạ... bác suy nghĩ lại cũng được.', 15, -4, 1),
        ],
        warning: 'Bác ơi đừng góp gì hết! Cháu bị ép gọi điện. Bác báo công an xã giúp cháu với!',
      },
    ],
  },
  {
    id: 'student_nam',
    name: 'Cậu Nam (Sinh viên năm 2)',
    role: 'Thích kiếm tiền nhanh, mê công nghệ mới',
    avatarKey: 'telesales_target_student',
    initialSuspicion: 30,
    dialogues: [
      {
        prompt: 'Alo anh ơi, bên anh tuyển "Gõ phím lượng tử AI" lương 50 triệu/tháng thật hả?',
        choices: [
          c('Thật em ơi! Em chỉ cần gõ phím thật mạnh để lượng tử nhảy ra tiền thôi.', -12, 4, -2),
          c('Ừ thì... 50 triệu chắc hơi phóng đại.', 30, -6, 0),
          c('Em không làm thì có 300 bạn khác xếp hàng rồi đó.', 10, 5, -2),
        ],
        warning: 'Nam ơi, không có việc gõ phím nào lương 50 triệu đâu. Việc nhẹ lương cao là bẫy, em tránh xa nha!',
      },
      {
        prompt: 'Ủa mà "gõ phím lượng tử" là gõ cái gì vậy anh? Em học IT mà chưa nghe bao giờ.',
        choices: [
          c('Công nghệ mới ra sáng nay nên sách chưa kịp in em ơi! Em là người đầu tiên biết đó.', -15, 4, -2),
          c('Là gõ chữ "lượng tử" 10.000 lần một ngày.', 25, 3, -1),
          c('Anh cũng không rõ, anh đọc theo giấy thôi.', 32, -8, 0),
        ],
        warning: 'Em học IT thì em biết rồi đó: thứ này không tồn tại. Đừng gửi tiền "kích hoạt" cho ai hết!',
      },
      {
        prompt: 'Em phải mua bàn phím gì không anh? Bàn phím em bị liệt phím Space rồi...',
        choices: [
          c('Không sao, máy lượng tử chạy được bằng phím Space tưởng tượng luôn!', -14, 4, -2),
          c('Em mua "bàn phím vàng 24K" bên anh, chỉ 9 triệu thôi.', 20, 7, -4),
          c('Phím Space hư thì gõ liền chữ cũng được mà.', 8, 2, -1),
        ],
        warning: 'Đừng mua gì hết em. Bất kỳ việc gì bắt mình bỏ tiền trước mới được làm là lừa đảo đó.',
      },
      {
        prompt: 'Ok anh, em đăng ký! Em có cần đọc số căn cước không?',
        choices: [
          c('Khỏi em, em chỉ cần gửi một tấm ảnh selfie đang cười thật tươi là xong thủ tục!', -10, 6, -3),
          c('Em đọc luôn số căn cước, mã OTP, mật khẩu ngân hàng cho chắc.', 35, 6, -6),
          c('Để mai anh gọi lại hỏi sếp nha.', 14, -4, 0),
        ],
        warning: 'Nam ơi đừng đọc giấy tờ, mã OTP hay mật khẩu cho ai qua điện thoại. Cúp máy đi em!',
      },
    ],
  },
  {
    id: 'vendor_chi_ba',
    name: 'Chị Ba (Tiểu thương chợ đầu mối)',
    role: 'Thận trọng, buôn bán vất vả, sợ mất vốn',
    avatarKey: 'telesales_target_vendor',
    initialSuspicion: 40,
    dialogues: [
      {
        prompt: 'Tôi đang dọn hàng, ai gọi đó? Lại chào mời gì nữa đây?',
        choices: [
          c('Dạ em gọi báo chị trúng thưởng "Gian hàng biết tự bán", chị ngủ trưa hàng vẫn hết!', 8, 4, -2),
          c('Dạ em không làm phiền lâu, chỉ 1 phút cho chị nghe cái này vui lắm.', -10, 3, -1),
          c('Chị nghe em nói nè, chị bận cũng phải nghe!', 30, 2, -1),
        ],
        warning: 'Chị Ba ơi, chị cứ cúp máy đi. Mấy cuộc gọi chào mời trúng thưởng toàn là bẫy đó chị.',
      },
      {
        prompt: 'Gian hàng tự bán là sao? Tôi bán cá chứ có phải bán phép thuật đâu.',
        choices: [
          c('Dạ là con cá tự nhảy vô bịch của khách, chị chỉ việc ngồi đếm tiền.', 15, 4, -2),
          c('Dạ em hiểu chị vất vả, nên bên em tặng chị một "cái quạt thần" giúp cá luôn tươi, chị coi thử.', -14, 4, -2),
          c('Phép thuật chứ gì nữa chị, thời đại 4.0 rồi!', 25, 3, -1),
        ],
        warning: 'Chị nói đúng: không có phép thuật nào hết. Ai hứa làm giàu dễ dàng là chị cảnh giác nha.',
      },
      {
        prompt: 'Quạt thần? Rồi tôi phải trả bao nhiêu? Nói trước, tôi không có tiền dư đâu!',
        choices: [
          c('Dạ miễn phí, chị chỉ cần trả "phí gió" mỗi ngày bằng 1 con cá lóc thôi.', -12, 5, -2),
          c('Dạ chỉ 20 triệu, chị vay nóng bên em có liền.', 32, 6, -5),
          c('Dạ tùy lòng hảo tâm của chị ạ.', 10, -2, 0),
        ],
        warning: 'Chị Ba, đừng trả đồng nào hết. Cũng đừng vay app nóng nha chị, họ đòi nợ ghê lắm.',
      },
      {
        prompt: 'Thôi được, tôi lấy thử cái quạt. Nhưng lừa tôi là tôi xách dao thớt lên tận công ty đó nghe!',
        choices: [
          c('Dạ chị cứ lên, công ty em ở tầng 99 của tòa nhà làm bằng mây, chị nhớ mang dù!', -8, 5, -2),
          c('Dạ chị đừng lo, em thề có con cá lóc chứng giám!', -4, 4, -2),
          c('Chị lên đây thì chị cũng bị nhốt như em thôi...', 35, -10, 2),
        ],
        warning: 'Chị đừng lên đây! Chỗ này là trại lừa đảo bên kia biên giới. Chị báo công an giúp tụi em với!',
      },
    ],
  },
  {
    id: 'co_tu',
    name: 'Cô Tư (Giáo viên về hưu)',
    role: 'Hiền lành, ở một mình, thích nuôi cá cảnh',
    avatarKey: 'telesales_target_teacher',
    initialSuspicion: 25,
    dialogues: [
      {
        prompt: 'Alo, cô nghe. Con là học trò cũ của cô hả? Giọng nghe quen quen...',
        choices: [
          c('Dạ con chào cô! Con gọi giới thiệu khóa học "Nuôi cá vàng biết hát karaoke" cô ơi!', -8, 4, -2),
          c('Dạ đúng rồi cô, con là học trò cũ đây, cô nhớ con không?', 20, 5, -4),
          c('Dạ không, con là nhân viên tổng đài số 9999.', 12, 1, 0),
        ],
        warning: 'Cô ơi, con không quen cô đâu. Nếu ai gọi xưng người quen rồi xin tiền, cô cúp máy rồi gọi lại số cũ để hỏi nha.',
      },
      {
        prompt: 'Cá vàng hát karaoke? Ôi vui quá. Mà cá nhà cô chỉ biết thở bong bóng thôi con.',
        choices: [
          c('Dạ bong bóng chính là nốt nhạc đó cô! Khóa học dạy cá thở bong bóng theo nhịp bolero.', -15, 4, -2),
          c('Cô mua cá mới bên con đi, cá cũ hết thời rồi.', 22, 5, -3),
          c('Dạ chắc cá cô không có năng khiếu.', 18, 0, 0),
        ],
        warning: 'Cô ơi, cá không biết hát đâu. Cô đừng đóng tiền khóa học nào qua điện thoại nha cô.',
      },
      {
        prompt: 'Học phí bao nhiêu con? Lương hưu cô ít lắm.',
        choices: [
          c('Dạ chỉ 3 hộp thức ăn cá và một lời khen cho con cá thôi cô!', -12, 4, -2),
          c('Dạ học phí bằng nguyên tháng lương hưu ạ, cô chuyển liền nha.', 30, 7, -5),
          c('Dạ cô cứ học thử, tính tiền sau.', 6, 1, -1),
        ],
        warning: 'Cô giữ tiền lương hưu lại. Người ta hay nhắm vào người lớn tuổi sống một mình đó cô.',
      },
      {
        prompt: 'Cô ghi tên rồi nha. Mà con nghe giọng mệt quá, ở đó có ai bắt nạt con không?',
        choices: [
          c('Dạ con khỏe mà cô! Ở đây ngày nào cũng có cá vàng hát ru con ngủ.', -10, 5, -3),
          c('Dạ... con hơi mệt chút thôi cô.', 15, -3, 1),
          c('Cô hỏi nhiều quá, cô chuyển tiền đi!', 30, 5, -4),
        ],
        warning: 'Cô ơi... con bị lừa sang đây làm việc, bị giữ hộ chiếu. Cô đừng tin cuộc gọi này, và báo công an giúp con với!',
      },
    ],
  },
  {
    id: 'anh_teo',
    name: 'Anh Tèo (Shipper)',
    role: 'Chạy xe cả ngày, mê kiếm thêm thu nhập',
    avatarKey: 'telesales_target_shipper',
    initialSuspicion: 35,
    dialogues: [
      {
        prompt: 'Alo nói lẹ đi, anh đang giao 15 đơn trà sữa!',
        choices: [
          c('Dạ nói lẹ: anh có muốn nuôi "gà NFT" đẻ trứng vàng thật không?', -10, 4, -2),
          c('Dạ em xin anh 15 phút để giới thiệu tầm nhìn chiến lược của tập đoàn...', 28, 3, -1),
          c('Anh tấp vô lề nghe em nói nè, quan trọng lắm.', 10, 3, -1),
        ],
        warning: 'Anh cứ chạy đơn đi anh, đừng nghe cuộc gọi này. Mấy lời mời làm giàu nhanh đều là bẫy đó.',
      },
      {
        prompt: 'Gà NFT là gà gì? Gà trong điện thoại mà đẻ trứng thật hả? Tào lao!',
        choices: [
          c('Dạ gà ảo ăn cám ảo, nhưng trứng in ra máy in 3D là ăn được, anh nghe kỳ mà vui!', -8, 4, -2),
          c('Anh không tin thì thôi, anh nghèo cả đời đi!', 30, 4, -2),
          c('Dạ gà này được nhà khoa học sao Hỏa chứng nhận ạ.', 12, 3, -1),
        ],
        warning: 'Anh nói đúng, tào lao thiệt. Ai bán "tài sản ảo đẻ ra tiền thật" là anh né xa nha.',
      },
      {
        prompt: 'Rồi mua một con gà bao nhiêu? Anh chạy cả ngày được có 300 nghìn à.',
        choices: [
          c('Dạ một con gà giá bằng... một ly trà sữa trân châu đường đen size L thôi anh!', -14, 4, -2),
          c('Dạ anh bán xe máy mua 10 con cho lời gấp 10.', 32, 6, -5),
          c('Dạ tùy anh, gà nhỏ thì rẻ, gà to thì mắc.', 6, 2, -1),
        ],
        warning: 'Anh giữ tiền xăng xe đi. Đừng bao giờ bán xe hay vay mượn để "đầu tư" theo lời người lạ.',
      },
      {
        prompt: 'Ờ rẻ vậy thì để anh thử. Chuyển khoản qua đâu?',
        choices: [
          c('Dạ anh khỏi chuyển, anh mua giùm em ly trà sữa rồi tự uống là con gà tự kích hoạt!', -6, 3, -1),
          c('Dạ anh quét mã QR in trên lưng con gà ảo nha.', 10, 6, -3),
          c('Dạ chuyển vô tài khoản cá nhân của em, tên "Tập Đoàn Gà Vàng Toàn Cầu".', 24, 5, -3),
        ],
        warning: 'Anh đừng chuyển gì hết! Em bị giữ ở trại lừa đảo, anh kể chuyện này cho công an giúp em.',
      },
      {
        prompt: 'Ha ha, xong! Con gà của anh tên gì đây?',
        choices: [
          c('Dạ tên "Gà Tèo Vàng", ngày mai nó đẻ trứng đầu tiên anh nhé!', -8, 6, -3),
          c('Dạ tên là "Gà Không Hoàn Tiền".', 30, -5, 1),
          c('Anh tự đặt đi, em hết giờ rồi.', 10, 0, 0),
        ],
        warning: 'Anh Tèo, hủy hết đi anh. Không có con gà nào hết. Anh cẩn thận mấy cuộc gọi kiểu này nha!',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Roommates
// ---------------------------------------------------------------------------

export type RoommateId = 'tuan' | 'hoa' | 'bao';

export interface RoommateDef {
  id: RoommateId;
  name: string;
  role: string;
  /** Asset keys (ASSETS_MANIFEST) for the bust portrait and the small sitting sprite. */
  portraitKey: string;
  sitKey: string;
  startRelationship: number;
  /** Talk lines by relationship band: [<30, 30-59, >=60]. */
  talk: [string[], string[], string[]];
}

export const ROOMMATES: RoommateDef[] = [
  {
    id: 'tuan',
    name: 'Tuấn',
    role: 'Sinh viên 19 tuổi, nhát gan, lúc nào cũng đói',
    portraitKey: 'roommate_tuan',
    sitKey: 'roommate_tuan_sit',
    startRelationship: 30,
    talk: [
      [
        'Tuấn ôm gối, không thèm nhìn bạn: "Đừng nói chuyện với em... lỡ bị nghe thấy thì sao."',
        'Tuấn lẩm bẩm: "Ai cho em ăn no, em... em làm gì cũng được."',
      ],
      [
        'Tuấn kể: "Em tưởng sang đây làm CSKH thật. Mẹ em còn khoe với hàng xóm..."',
        'Tuấn thì thầm: "Hôm qua quản lý hỏi em có ai định trốn không. Em chưa nói gì đâu."',
      ],
      [
        'Tuấn: "Anh/chị là người tốt nhất ở đây. Em hứa sẽ canh chừng giúp, có ai lục phòng em báo liền!"',
        'Tuấn cười lần đầu tiên: "Ra khỏi đây em sẽ đi học lại. Không tin \'việc nhẹ lương cao\' nữa."',
      ],
    ],
  },
  {
    id: 'hoa',
    name: 'Chị Hoa',
    role: 'Bà mẹ hai con, ở trại lâu nhất, tốt bụng',
    portraitKey: 'roommate_hoa',
    sitKey: 'roommate_hoa_sit',
    startRelationship: 40,
    talk: [
      [
        'Chị Hoa thở dài: "Ở đây đừng tin ai vội em ạ."',
        'Chị Hoa vá áo, im lặng. Có vẻ chị chưa tin bạn lắm.',
      ],
      [
        'Chị Hoa: "Chị ở đây 8 tháng rồi. Đêm nào chị cũng đếm bước chân lính gác để ngủ."',
        'Chị Hoa đưa bạn ít muối vừng: "Ăn đi em, giữ sức mà còn về với mẹ."',
      ],
      [
        'Chị Hoa thì thầm: "Lính gác đổi ca lúc 2 giờ sáng, đi chậm và hay ngáp. Đi sát tường bên trái là khuất."',
        'Chị Hoa: "Em mà ra được, nhớ gọi cho hai đứa nhỏ nhà chị. Số chị ghi sau lưng tấm lịch."',
      ],
    ],
  },
  {
    id: 'bao',
    name: 'Bảo',
    role: 'Cựu kỹ thuật viên IT, ít nói, đeo kính nứt',
    portraitKey: 'roommate_bao',
    sitKey: 'roommate_bao_sit',
    startRelationship: 35,
    talk: [
      [
        'Bảo đẩy gọng kính nứt: "Đừng làm phiền. Tôi đang tính xác suất sống sót."',
        'Bảo gõ ngón tay lên đầu gối như đang gõ bàn phím vô hình.',
      ],
      [
        'Bảo: "Tôi từng sửa máy chủ cho ngân hàng. Giờ thì sửa máy tính để lừa người. Mỉa mai thật."',
        'Bảo liếc chiếc điện thoại cũ nát trong thùng rác phòng: "Cái đó... còn cứu được."',
      ],
      [
        'Bảo: "Tôi giấu được một con điện thoại cũ. Thiếu mỗi pin, để tôi tháo pin từ cái đèn ngủ."',
        'Bảo: "Tin nhắn phải thật ngắn, gửi lúc mất sóng chập chờn thì chúng không dò được."',
      ],
    ],
  },
];

// ---------------------------------------------------------------------------
// Random morning events
// ---------------------------------------------------------------------------

export type DailyEventId =
  | 'INSPECTION'
  | 'OUTAGE'
  | 'NEW_ARRIVALS'
  | 'ROOMMATE_SOLD'
  | 'TUAN_BETRAYAL'
  | 'QUIET';

export interface DailyEventView {
  id: DailyEventId;
  title: string;
  text: string;
  tone: 'bad' | 'neutral' | 'good';
  /** Morning living-fee line shown on the card. */
  fee?: string;
  /** Rent warning / rent-shock notice shown in red on the morning card */
  feeAlert?: string;
}

/** Warning signs shown after every ending. */
export const JOB_SCAM_SIGNS: string[] = [
  'Lương cao bất thường so với công việc ("việc nhẹ lương cao", 20-50 triệu/tháng).',
  'Bao vé máy bay, ăn ở, đi lại miễn phí, đi ngay không cần thủ tục.',
  'Không cần kinh nghiệm, không cần bằng cấp, không phỏng vấn rõ ràng.',
  'Bị giữ hộ chiếu, giấy tờ, điện thoại ngay khi đến nơi.',
];
