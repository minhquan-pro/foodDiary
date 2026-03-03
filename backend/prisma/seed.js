import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
	console.log("🌱 Seeding database...\n");

	// Clean existing data
	await prisma.like.deleteMany();
	await prisma.comment.deleteMany();
	await prisma.follow.deleteMany();
	await prisma.post.deleteMany();
	await prisma.user.deleteMany();

	// ─── Create Users ────────────────────────────────────────
	const password = await bcrypt.hash("123456", SALT_ROUNDS);

	const users = await Promise.all([
		prisma.user.create({
			data: {
				email: "minh@foodshare.com",
				password,
				name: "Minh Quân",
				bio: "Food blogger | Yêu ẩm thực Việt Nam 🍜",
				avatarUrl: "https://i.pravatar.cc/150?u=minh",
				facebook: "https://facebook.com/minhquan.foodie",
				instagram: "https://instagram.com/minhquan_food",
				youtube: "https://youtube.com/@MinhQuanFood",
			},
		}),
		prisma.user.create({
			data: {
				email: "linh@foodshare.com",
				password,
				name: "Thùy Linh",
				bio: "Đi đâu cũng ăn, ăn đâu cũng review ✨",
				avatarUrl: "https://i.pravatar.cc/150?u=linh",
				instagram: "https://instagram.com/thuylinh.eat",
				tiktok: "https://tiktok.com/@thuylinh.food",
			},
		}),
		prisma.user.create({
			data: {
				email: "nam@foodshare.com",
				password,
				name: "Hoàng Nam",
				bio: "Coffee addict ☕ | Street food hunter",
				avatarUrl: "https://i.pravatar.cc/150?u=nam",
				twitter: "https://x.com/hoangnam_coffee",
				github: "https://github.com/hoangnam-dev",
			},
		}),
		prisma.user.create({
			data: {
				email: "hoa@foodshare.com",
				password,
				name: "Thanh Hoa",
				bio: "Nấu ăn là đam mê, review là nghề 🍳",
				avatarUrl: "https://i.pravatar.cc/150?u=hoa",
				facebook: "https://facebook.com/thanhhoa.cooking",
				instagram: "https://instagram.com/thanhhoa_chef",
				tiktok: "https://tiktok.com/@thanhhoa.kitchen",
				youtube: "https://youtube.com/@ThanhHoaCooking",
			},
		}),
	]);

	const [minh, linh, nam, hoa] = users;
	console.log(`✅ Created ${users.length} users`);

	// ─── Create Follow relationships ─────────────────────────
	await Promise.all([
		prisma.follow.create({ data: { followerId: minh.id, followingId: linh.id } }),
		prisma.follow.create({ data: { followerId: minh.id, followingId: nam.id } }),
		prisma.follow.create({ data: { followerId: linh.id, followingId: minh.id } }),
		prisma.follow.create({ data: { followerId: nam.id, followingId: hoa.id } }),
		prisma.follow.create({ data: { followerId: hoa.id, followingId: minh.id } }),
		prisma.follow.create({ data: { followerId: hoa.id, followingId: linh.id } }),
	]);
	console.log("✅ Created follow relationships");

	// ─── Create Posts ────────────────────────────────────────
	const postsData = [
		// === HÀ NỘI ===
		{
			userId: minh.id,
			imageUrl: "https://images.unsplash.com/photo-1503764654157-72d979d9af2f?w=800",
			restaurantName: "Phở Thìn Bờ Hồ",
			restaurantAddress: "13 Lò Đúc, Hai Bà Trưng, Hà Nội",
			rating: 5,
			description:
				"Phở Thìn huyền thoại! Nước dùng đậm đà, thịt bò tái chín mềm tan trong miệng. Đặc biệt là lớp hành phi giòn rụm bên trên. Đến Hà Nội mà chưa ăn Phở Thìn thì coi như chưa đến. Giá hơi cao nhưng xứng đáng từng đồng!",
		},
		{
			userId: minh.id,
			imageUrl: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=800",
			restaurantName: "Bún Chả Hương Liên",
			restaurantAddress: "24 Lê Văn Hưu, Hai Bà Trưng, Hà Nội",
			rating: 5,
			description:
				"Quán bún chả Obama nổi tiếng! Chả nướng thơm lừng, nước mắm pha chua ngọt vừa vặn. Bún tươi kết hợp với rau sống giòn mát. Không gian quán đông nhưng phục vụ nhanh. Combo bún chả + nem cua bể là tuyệt đỉnh!",
		},
		{
			userId: minh.id,
			imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
			restaurantName: "Quán Nem Nướng Nha Trang",
			restaurantAddress: "16 Lãn Ông, Hoàn Kiếm, Hà Nội",
			rating: 4,
			description:
				"Nem nướng cuốn bánh tráng với rau sống, bún tươi rồi chấm mắm nêm - tuyệt cú mèo! Nem nướng giòn ngoài, mềm trong, vị đậm đà. Quán nhỏ nhưng sạch sẽ, giá phải chăng. Recommend thêm món chả giò re và bò nướng lá lốt!",
		},
		{
			userId: nam.id,
			imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
			restaurantName: "Xôi Yến",
			restaurantAddress: "35B Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội",
			rating: 5,
			description:
				"Xôi Yến - huyền thoại xôi Hà Nội từ 1990! Xôi xéo với đậu xanh bùi bùi, hành phi giòn, rưới mỡ hành vàng ươm. Xôi gấc đỏ au, dẻo thơm ngọt tự nhiên. Quán nhỏ trên tầng 2 nhưng lúc nào cũng đông. Mở từ 7h sáng, đến muộn là hết!",
		},
		{
			userId: hoa.id,
			imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
			restaurantName: "Bún Ốc Bà Ngoại",
			restaurantAddress: "45 Hàng Chiếu, Hoàn Kiếm, Hà Nội",
			rating: 4,
			description:
				"Bún ốc chuẩn Hà Nội! Nước dùng chua chua ngọt ngọt từ cà chua, ốc giòn sần sật. Thêm đậu rán mắm tôm, giò tai và một ít rau kinh giới. Quán nhỏ trong ngõ nhưng ai đến Hà Nội cũng phải thử. Giá chỉ 35k/bát!",
		},
		{
			userId: linh.id,
			imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
			restaurantName: "Chả Cá Lã Vọng",
			restaurantAddress: "14 Chả Cá, Hoàn Kiếm, Hà Nội",
			rating: 5,
			description:
				"Chả cá Lã Vọng - đặc sản Hà Nội hơn 100 năm! Cá lăng tươi ướp nghệ vàng ươm, nướng trên bếp than hồng. Ăn kèm bún, rau thì là, hành lá, đậu phộng và mắm tôm. Vị béo ngậy hòa quyện với thì là thơm nức. Phải thử ít nhất 1 lần!",
		},
		// === TP.HCM ===
		{
			userId: linh.id,
			imageUrl: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800",
			restaurantName: "Cơm Tấm Bụi Sài Gòn",
			restaurantAddress: "84 Nguyễn Du, Quận 1, TP.HCM",
			rating: 4,
			description:
				"Cơm tấm sườn bì chả chuẩn vị Sài Gòn! Sườn nướng đậm vị, bì giòn sần sật, chả trứng mềm mịn. Nước mắm pha ngọt kiểu miền Nam rất hợp. Phần ăn to, giá sinh viên. Quán mở từ 6h sáng, perfect cho bữa sáng!",
		},
		{
			userId: linh.id,
			imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
			restaurantName: "Pizza 4P's",
			restaurantAddress: "8 Thủ Khoa Huân, Quận 1, TP.HCM",
			rating: 5,
			description:
				"Pizza 4P's không bao giờ làm thất vọng! Đế pizza mỏng giòn, phô mai tươi kéo sợi dài. Recommend: Burrata pizza và Parma Ham. Không gian nhà hàng sang trọng, phục vụ tận tình. Giá hơi cao nhưng worth every penny cho một buổi date night!",
		},
		{
			userId: nam.id,
			imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
			restaurantName: "Quán Ốc Đào",
			restaurantAddress: "212 Nguyễn Trãi, Quận 1, TP.HCM",
			rating: 4,
			description:
				"Ốc Đào - thiên đường hải sản bình dân! Ốc hương rang muối giòn thơm, nghêu hấp sả cay nồng, tôm nướng muối ớt đậm đà. Bia lạnh kết hợp ốc nóng là combo hoàn hảo cho buổi tối cuối tuần. Quán đông nên đến sớm nhé!",
		},
		{
			userId: nam.id,
			imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
			restaurantName: "The Coffee House",
			restaurantAddress: "86-88 Cao Thắng, Quận 3, TP.HCM",
			rating: 4,
			description:
				"Không gian rộng rãi, thoáng mát, WiFi mạnh - perfect cho làm việc. Cà phê sữa đá đậm đà, trà đào cam sả thơm mát. Bánh mì que chấm paté cũng rất ngon. Nhân viên friendly, giá cả hợp lý. Sẽ quay lại nhiều lần nữa!",
		},
		{
			userId: hoa.id,
			imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800",
			restaurantName: "Bánh Mì Huỳnh Hoa",
			restaurantAddress: "26 Lê Thị Riêng, Quận 1, TP.HCM",
			rating: 5,
			description:
				"Bánh mì ngon nhất Sài Gòn, không phải bàn cãi! Nhân đầy ụ với chả lụa, paté, bơ, rau dưa. Vỏ bánh mì giòn rụm, nóng hổi. Xếp hàng 30 phút nhưng hoàn toàn worth it. Mỗi ổ 50k nhưng to bằng 2 ổ bình thường!",
		},
		{
			userId: hoa.id,
			imageUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800",
			restaurantName: "Bún Bò Huế O Xuân",
			restaurantAddress: "2A Trương Định, Quận 3, TP.HCM",
			rating: 5,
			description:
				"Bún bò Huế chuẩn cay nồng đậm đà! Nước dùng hầm từ xương bò ngọt tự nhiên, mắm ruốc Huế thơm lừng. Thịt bò bắp gân mềm rục, giò heo hầm tan trong miệng. Chả cua Huế dày dặn. Tô đặc biệt 65k nhưng đầy tú hụ, ăn no căng!",
		},
		{
			userId: linh.id,
			imageUrl: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800",
			restaurantName: "Sushi Hokkaido Sachi",
			restaurantAddress: "2 Bis Lê Thánh Tôn, Quận 1, TP.HCM",
			rating: 4,
			description:
				"Sushi tươi ngon với giá buffet hợp lý! Cá hồi béo ngậy tan trong miệng. Set sashimi đa dạng từ cá ngừ, cá trích, bạch tuộc. Miso soup nóng hổi thơm lừng. Không gian kiểu Nhật ấm cúng. Nên đặt bàn trước vì quán rất đông cuối tuần!",
		},
		{
			userId: nam.id,
			imageUrl: "https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=800",
			restaurantName: "Phở Hòa Pasteur",
			restaurantAddress: "260C Pasteur, Quận 3, TP.HCM",
			rating: 5,
			description:
				"Phở Hòa - huyền thoại phở Sài Gòn! Nước lèo trong veo, ngọt thanh từ xương hầm suốt đêm. Thịt bò tái mềm, gân giòn sụn sần sật. Quán đông từ sáng tới khuya, xếp hàng là chuyện bình thường. Phở đặc biệt 75k nhưng miếng thịt nào cũng to đùng!",
		},
		// === ĐÀ NẴNG ===
		{
			userId: hoa.id,
			imageUrl: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800",
			restaurantName: "Mì Quảng Bà Mua",
			restaurantAddress: "95 Hải Phòng, Hải Châu, Đà Nẵng",
			rating: 5,
			description:
				"Mì Quảng chuẩn Đà Nẵng! Sợi mì vàng ươm, nước lèo sánh đậm đà từ tôm và thịt heo. Thêm bánh tráng nướng giòn, đậu phộng rang, rau sống tươi mát. Tô mì đầy ắp chỉ 35k. Bà Mua bán hơn 30 năm rồi, chất lượng vẫn giữ nguyên!",
		},
		{
			userId: minh.id,
			imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
			restaurantName: "Bê Thui Cầu Mống",
			restaurantAddress: "100 Lê Đình Dương, Hải Châu, Đà Nẵng",
			rating: 5,
			description:
				"Bê thui Cầu Mống - đặc sản miền Trung! Thịt bê non thui vàng ươm, da giòn, thịt mềm ngọt tự nhiên. Cuốn bánh tráng với rau sống, bún, chấm mắm nêm cay nồng. Quán lúc nào cũng đông nghẹt khách du lịch. 120k/phần nhưng ăn no bụng!",
		},
		{
			userId: linh.id,
			imageUrl: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800",
			restaurantName: "Bánh Xèo Bà Dưỡng",
			restaurantAddress: "K280/23 Hoàng Diệu, Hải Châu, Đà Nẵng",
			rating: 4,
			description:
				"Bánh xèo Đà Nẵng khác hẳn Sài Gòn - nhỏ xinh, giòn rụm! Nhân tôm thịt đầy ắp, cuốn rau sống rồi chấm nước mắm chua ngọt. Ăn một cái là nghiện, gọi cả chục cái vẫn chưa đủ. Quán trong hẻm nhỏ nhưng google maps ra ngay!",
		},
		{
			userId: nam.id,
			imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800",
			restaurantName: "Bún Mắm Bà Thêm",
			restaurantAddress: "55 Hải Phòng, Hải Châu, Đà Nẵng",
			rating: 4,
			description:
				"Bún mắm Đà Nẵng đậm đà vị biển! Nước dùng từ mắm cá linh ngọt thanh, thêm thịt heo, chả cá, tôm tươi. Rau sống ăn kèm giòn mát trung hòa vị mặn. Quán bình dân, sạch sẽ. Chỉ 40k/tô là có bữa ăn chất lượng!",
		},
		// === ĐÀ LẠT ===
		{
			userId: linh.id,
			imageUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800",
			restaurantName: "Bánh Căn Nhà Chung",
			restaurantAddress: "4 Nguyễn Văn Trỗi, Phường 2, Đà Lạt",
			rating: 5,
			description:
				"Bánh căn Đà Lạt - ăn sáng chuẩn phố núi! Bánh nướng trên khuôn đất, giòn bên ngoài, mềm bên trong. Nhân trứng cút, tôm, mực đầy ặp. Chấm nước mắm cay hoặc mỡ hành, cắn một miếng là mê luôn. 5k/cái, ăn 10 cái vẫn chưa no!",
		},
		{
			userId: hoa.id,
			imageUrl: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800",
			restaurantName: "Lẩu Bò Phố Núi",
			restaurantAddress: "12 Trần Phú, Phường 3, Đà Lạt",
			rating: 5,
			description:
				"Lẩu bò Đà Lạt - ấm bụng ngày lạnh! Thịt bò tươi cắt mỏng, nhúng lẩu vừa chín tới, mềm ngọt. Nước lèo hầm xương đậm đà, thêm mắm nêm cay nồng. Rau Đà Lạt tươi xanh mướt. Ngồi nhâm nhi bên bếp than trong gió se lạnh thì tuyệt!",
		},
		{
			userId: minh.id,
			imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
			restaurantName: "Cà Phê Tùng",
			restaurantAddress: "6 Khu Hòa Bình, Phường 1, Đà Lạt",
			rating: 4,
			description:
				"Cà phê Tùng - quán cà phê lịch sử hơn 50 năm! Không gian retro với nội thất gỗ cũ, tranh ảnh xưa. Cà phê phin pha đậm, ngồi ngắm phố Đà Lạt qua ô cửa kính. Một ly cà phê 25k nhưng mua cả không gian và thời gian. Phải đến ít nhất 1 lần!",
		},
		// === HUẾ ===
		{
			userId: nam.id,
			imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
			restaurantName: "Bún Bò Bà Tuyết",
			restaurantAddress: "47 Nguyễn Công Trứ, Phú Hội, Huế",
			rating: 5,
			description:
				"Bún bò Huế gốc! Nước dùng đỏ au từ ớt Huế, thơm lừng sả và mắm ruốc. Thịt bò bắp nạm mềm rục, giò heo to đùng, chả cua Huế thơm. Tô bự chỉ 35k! Ăn kèm rau muống chẻ, giá đỗ, bắp chuối thái mỏng. Nóng bỏng lưỡi nhưng stopping không nổi!",
		},
		{
			userId: hoa.id,
			imageUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800",
			restaurantName: "Cơm Hến Bà Mười",
			restaurantAddress: "10 Phạm Hồng Thái, Vĩnh Ninh, Huế",
			rating: 4,
			description:
				"Cơm hến - đặc sản bình dân xứ Huế! Hến tươi xào tỏi ớt, trộn với cơm nguội, rau sống, đậu phộng, tóp mỡ giòn rụm. Vị cay nồng đặc trưng miền Trung. Phần ăn nhỏ nhắn kiểu Huế, giá chỉ 15k. Ăn 2-3 bát mới đã!",
		},
		{
			userId: linh.id,
			imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
			restaurantName: "Bánh Bèo Lộc Diệu",
			restaurantAddress: "135 Phan Đình Phùng, Phú Nhuận, Huế",
			rating: 5,
			description:
				"Bánh bèo Huế chuẩn vị! Bánh mỏng mịn như lụa, tôm chấy vàng ruộm, tóp mỡ giòn tan. Chấm nước mắm ớt Huế cay ngọt. Thêm bánh nậm, bánh lọc cho bữa ăn hoàn hảo. Quán nhỏ, ghế thấp kiểu Huế. 20k cho 10 chén bánh bèo, quá rẻ!",
		},
		// === NHA TRANG ===
		{
			userId: minh.id,
			imageUrl: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800",
			restaurantName: "Bún Cá Sứa Nha Trang",
			restaurantAddress: "90 Yersin, Lộc Thọ, Nha Trang",
			rating: 4,
			description:
				"Bún cá sứa - đặc sản chỉ có ở Nha Trang! Nước dùng trong vắt nấu từ cá biển tươi, sứa giòn sần sật lạ miệng. Chả cá Nha Trang chiên vàng giòn, béo ngậy. Rau sống rổ to ăn thả ga. Quán bình dân view biển, 40k/tô. Ngồi ăn nghe sóng vỗ!",
		},
		{
			userId: nam.id,
			imageUrl: "https://images.unsplash.com/photo-1432139509613-5c4255a9d312?w=800",
			restaurantName: "Nem Nướng Ninh Hòa",
			restaurantAddress: "16A Lãn Ông, Lộc Thọ, Nha Trang",
			rating: 5,
			description:
				"Nem nướng Ninh Hòa chính gốc! Nem nướng than hoa, giòn bên ngoài, mềm bên trong, vị ngọt thịt tự nhiên. Cuốn bánh tráng nướng với rau sống, bún, xoài xanh rồi chấm tương đặc biệt. Quán đông nhất vào tối, nên đến sớm kẻo hết chỗ!",
		},
	];

	const posts = [];
	for (const postData of postsData) {
		const post = await prisma.post.create({ data: postData });
		posts.push(post);
	}
	console.log(`✅ Created ${posts.length} posts`);

	// ─── Create Comments ─────────────────────────────────────
	// Top-level comments (created individually so we can get IDs for replies)
	const comment1 = await prisma.comment.create({
		data: { userId: linh.id, postId: posts[0].id, body: "Phở Thìn là nhất! Mình cũng ghiền lắm 🍜" },
	});
	const comment2 = await prisma.comment.create({
		data: { userId: nam.id, postId: posts[0].id, body: "Lần sau đi cùng nhé, mình cũng muốn thử!" },
	});
	const comment3 = await prisma.comment.create({
		data: { userId: hoa.id, postId: posts[0].id, body: "Ôi nhìn hấp dẫn quá, chảy nước miếng luôn" },
	});
	const comment4 = await prisma.comment.create({
		data: { userId: minh.id, postId: posts[6].id, body: "Cơm tấm Sài Gòn thì phải number 1 rồi!" },
	});
	const comment5 = await prisma.comment.create({
		data: { userId: nam.id, postId: posts[6].id, body: "Quán này mình ăn hoài, ngon và rẻ 👍" },
	});
	const comment6 = await prisma.comment.create({
		data: { userId: minh.id, postId: posts[7].id, body: "Pizza 4P's burrata đỉnh thật sự, nhất trí!" },
	});
	const comment7 = await prisma.comment.create({
		data: { userId: hoa.id, postId: posts[7].id, body: "Date night ở đây thì perfect luôn ❤️" },
	});
	const comment8 = await prisma.comment.create({
		data: { userId: linh.id, postId: posts[8].id, body: "Ốc Đào hả? Cuối tuần này đi ăn thôi!" },
	});
	const comment9 = await prisma.comment.create({
		data: {
			userId: minh.id,
			postId: posts[10].id,
			body: "Bánh mì Huỳnh Hoa xếp hàng dài mà vẫn đông, chứng minh chất lượng!",
		},
	});
	const comment10 = await prisma.comment.create({
		data: { userId: nam.id, postId: posts[10].id, body: "50k mà no cả buổi, quá đỉnh!" },
	});
	const comment11 = await prisma.comment.create({
		data: { userId: linh.id, postId: posts[14].id, body: "Mì Quảng bà Mua ngon thần sầu! Nhớ Đà Nẵng quá 😭" },
	});
	const comment12 = await prisma.comment.create({
		data: { userId: minh.id, postId: posts[12].id, body: "Sushi Hokkaido Sachi buffet cuối tuần ngon lắm!" },
	});
	const comment13 = await prisma.comment.create({
		data: { userId: hoa.id, postId: posts[3].id, body: "Xôi Yến mình ăn từ hồi sinh viên, giờ vẫn ngon y như xưa" },
	});
	const comment14 = await prisma.comment.create({
		data: {
			userId: linh.id,
			postId: posts[11].id,
			body: "Bún bò Huế O Xuân mình recommend 100%! Nước dùng đậm đà lắm",
		},
	});
	const comment15 = await prisma.comment.create({
		data: { userId: nam.id, postId: posts[11].id, body: "Chả cua Huế ở đây là best mình từng ăn 🔥" },
	});

	console.log("✅ Created 15 top-level comments");

	// ─── Create Reply Comments (nested) ──────────────────────
	// Replies to comment1 (Phở Thìn)
	const reply1 = await prisma.comment.create({
		data: {
			userId: minh.id,
			postId: posts[0].id,
			parentId: comment1.id,
			body: "Cảm ơn bạn! Phở Thìn là tình yêu đầu tiên của mình ấy 😄",
		},
	});
	await prisma.comment.create({
		data: {
			userId: nam.id,
			postId: posts[0].id,
			parentId: comment1.id,
			body: "Mình thì thích Phở Thìn hơn Phở Bát Đàn, nước dùng đậm hơn!",
		},
	});
	// Reply to reply1 (nested level 2)
	await prisma.comment.create({
		data: {
			userId: linh.id,
			postId: posts[0].id,
			parentId: reply1.id,
			body: "Đúng rồi, Phở Thìn đậm vị hơn hẳn! Mà hành phi cũng nhiều hơn 👌",
		},
	});

	// Replies to comment2
	await prisma.comment.create({
		data: {
			userId: hoa.id,
			postId: posts[0].id,
			parentId: comment2.id,
			body: "Count me in! Cuối tuần này đi được không? 🙋‍♀️",
		},
	});
	await prisma.comment.create({
		data: {
			userId: minh.id,
			postId: posts[0].id,
			parentId: comment2.id,
			body: "Mình free thứ 7, ai đi thì nhắn group nhé!",
		},
	});

	// Replies to comment6 (Pizza 4P's)
	await prisma.comment.create({
		data: {
			userId: linh.id,
			postId: posts[7].id,
			parentId: comment6.id,
			body: "Burrata ngon nhưng mình thích Salmon pizza hơn, bạn thử chưa?",
		},
	});
	await prisma.comment.create({
		data: {
			userId: hoa.id,
			postId: posts[7].id,
			parentId: comment6.id,
			body: "Set lunch buổi trưa giá cũng ok lắm, khoảng 200k/người thôi!",
		},
	});

	// Replies to comment7
	const reply7 = await prisma.comment.create({
		data: {
			userId: nam.id,
			postId: posts[7].id,
			parentId: comment7.id,
			body: "Date night thì phải book trước cả tuần luôn á 😂",
		},
	});
	await prisma.comment.create({
		data: {
			userId: hoa.id,
			postId: posts[7].id,
			parentId: reply7.id,
			body: "Ừ đúng rồi, mình đã bị từ chối 2 lần vì không book 😅",
		},
	});

	// Replies to comment8 (Ốc Đào)
	await prisma.comment.create({
		data: {
			userId: nam.id,
			postId: posts[8].id,
			parentId: comment8.id,
			body: "Đi đi! Nhớ gọi nghêu hấp sả, món đó signature luôn 🦪",
		},
	});
	await prisma.comment.create({
		data: {
			userId: minh.id,
			postId: posts[8].id,
			parentId: comment8.id,
			body: "Ốc Đào bây giờ có chi nhánh 2 rồi nha, đỡ đông hơn!",
		},
	});

	// Replies to comment9 (Bánh mì Huỳnh Hoa)
	await prisma.comment.create({
		data: {
			userId: linh.id,
			postId: posts[10].id,
			parentId: comment9.id,
			body: "Xếp hàng 45 phút luôn á 😭 nhưng mà worth it thật!",
		},
	});

	// Replies to comment11 (Mì Quảng)
	await prisma.comment.create({
		data: {
			userId: hoa.id,
			postId: posts[14].id,
			parentId: comment11.id,
			body: "Mình cũng nhớ! Lần cuối ăn là 2 tháng trước, phải bay lại thôi ✈️",
		},
	});
	await prisma.comment.create({
		data: {
			userId: minh.id,
			postId: posts[14].id,
			parentId: comment11.id,
			body: "Đà Nẵng còn nhiều quán mì quảng ngon lắm, lần sau mình review thêm nhé!",
		},
	});

	// Replies to comment14 (Bún bò Huế)
	await prisma.comment.create({
		data: {
			userId: minh.id,
			postId: posts[11].id,
			parentId: comment14.id,
			body: "100% đồng ý! Nước dùng ở đây ngon hơn mấy quán bún bò gốc Huế luôn 👏",
		},
	});

	// Replies to comment15
	await prisma.comment.create({
		data: {
			userId: linh.id,
			postId: posts[11].id,
			parentId: comment15.id,
			body: "Chả cua Huế mà chấm mắm ớt thì hết sẩy luôn! Next level! 🔥",
		},
	});

	console.log("✅ Created 17 reply comments");

	// ─── Create Likes ────────────────────────────────────────
	const likesData = [
		// Post 0 (Phở Thìn) - liked by many
		{ userId: linh.id, postId: posts[0].id },
		{ userId: nam.id, postId: posts[0].id },
		{ userId: hoa.id, postId: posts[0].id },
		// Post 2 (Cơm tấm)
		{ userId: minh.id, postId: posts[2].id },
		{ userId: nam.id, postId: posts[2].id },
		// Post 3 (Pizza 4P's)
		{ userId: minh.id, postId: posts[3].id },
		{ userId: nam.id, postId: posts[3].id },
		{ userId: hoa.id, postId: posts[3].id },
		// Post 4 (Quán Ốc Đào)
		{ userId: linh.id, postId: posts[4].id },
		{ userId: hoa.id, postId: posts[4].id },
		// Post 6 (Bánh mì Huỳnh Hoa)
		{ userId: minh.id, postId: posts[6].id },
		{ userId: linh.id, postId: posts[6].id },
		{ userId: nam.id, postId: posts[6].id },
		// Post 7 (Mì Quảng)
		{ userId: linh.id, postId: posts[7].id },
		{ userId: minh.id, postId: posts[7].id },
		// Post 8 (Nem nướng)
		{ userId: linh.id, postId: posts[8].id },
		{ userId: hoa.id, postId: posts[8].id },
		// Post 10 (Xôi Yến)
		{ userId: hoa.id, postId: posts[10].id },
		{ userId: linh.id, postId: posts[10].id },
		// Post 11 (Bún bò Huế)
		{ userId: minh.id, postId: posts[11].id },
		{ userId: linh.id, postId: posts[11].id },
		{ userId: nam.id, postId: posts[11].id },
	];

	await prisma.like.createMany({ data: likesData });
	console.log(`✅ Created ${likesData.length} likes`);

	// ─── Summary ─────────────────────────────────────────────
	console.log("\n🎉 Seed completed successfully!");
	console.log("─────────────────────────────────────");
	console.log("Test accounts (password: 123456):");
	console.log("  📧 minh@foodshare.com");
	console.log("  📧 linh@foodshare.com");
	console.log("  📧 nam@foodshare.com");
	console.log("  📧 hoa@foodshare.com");
	console.log("─────────────────────────────────────");
}

main()
	.catch((e) => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
