- mod còn lỏd lắm nha :> nhưng mong mọi người trải nghiệm và nêu ý kiến để tui cải thiện.



-------------------------------------------
> Cập nhật bản 0.8.3xyak:
+ Vendicum: 500% dmg bonus tăng lên 1000%
+ Blaw: tăng 99% giảm sát thương lên công trình
+ Rangtaturs: tăng 100% tài nguyên nâng mk2 
+ Lauvunder: tăng từ nạp 1 điểm/s lên 15 điểm/s
+ Holyder: tăng 500% độ bền khiên, thêm 90% tỉ lệ bạo kích và 250% sát thương bạo kích, tăng 120% kích thước khiên
+ Plazerd: tăng 1% cộng +1% sát thương thành 1% cộng +50% sát thương
+ Plasanod: tăng số tầng cei kích lên mục tiêu mỗi giây 20
+ Reflecounum: tăng kích thước khiên mặt định thêm 200%
+ Therdum: giảm 50% sát thương
+ Swordoder: chỉnh sửa lại: sát thương gốc là 500 + 1200 chém, tầm bắn 210, tăng máu thêm 5000%, nội tại tận diệt: tăng từ 1% lên 15% và chỉnh sửa gây 999999 đổi thành gây 100% max hp / loại bỏ cơ chế roll phúc lợi đổi thành nâng cấp nhánh mk2 và mk2b / mk2: đổi hoàn toàn kiểu bắn sang 2 bên góc 30 độ (30 độ trước, 30 độ sau 0.2s), tăng 50% tỉ lệ bạo kích và 145% sát thương bạo kích / mk2b: tăng 500% tầm bắn, pháo đổi cơ chế tấn công thành: khi mục tiêu vào tấm bắn của pháo thì sẽ lập tức mỗi 1s tạo nhát chém ngay vị trí cảu mục tiêu đó, tối đa khóa 3 mục tiêu
+ Lazash: tăng 10000% phạm vi bắn (các dòn bắn tùy chỉnh lại bằng với phạm vi bắn)
+ Tyteryui: tăng 500% phạm vi bắn (các dòn bắn tùy chỉnh lại bằng với phạm vi bắn), tăng 200% sát thương cho các loại đạn của pháo bán ra.
+ Tháp điều phối drone: tăng 200% tài nguyên xây khối ở file .hjson
+ Erysidus: giảm bắn 1 tia laser thay vì bắn nhiều, tăng tầm bắn mặt định và tầm bắn cận chiến thêm 150% (các dòn bắn tùy chỉnh lại bằng với phạm vi bắn)
+ Forstarsilum: tăng sát thương cho nộ thêm 80% và thêm cơ chế 10% gây 1% max hp, sửa lỗi 9% không rơi vật phẩm newex-starlight
+ Hitekalum: tăng 500% sát thương gốc và mọi nguồn của khối pháo này, tăng 110% tốc bắn
+ Persefer: các loại đạn thêm cơ chế xuyên thấu 999



-------------------------------------------
> Cập nhật bản 0.8.2:
+ Chế độ Tự do (Sandbox): bỏ yêu cầu tài nguyên của cơ chế nâng cấp MK, roll Phúc lợi và trang bị vật phẩm cho pháo (lõi tự đầy tài nguyên, không bị trừ).
+ Pháo Swordoder: nhát chém nay tạo vết nứt không gian (hạt sao li ti, tinh vân, nhánh nứt) rồi từ từ khép lại. Mỗi lần bắn có 50% kích hoạt chuỗi 7 nhát chém kiểu samurai (nhát cuối là đòn kết liễu lớn).
+ Hệ nguyên tố áp dụng cho cả laser, đòn đánh trực tiếp và sát thương nổ lan từ các file .js (ấn được gắn dựa trên việc mục tiêu bị mất máu bởi pháo đang nhắm/bắn tới khu vực đó).
+ Drone Sword và Master Sword: thanh kiếm đổi thành ngôi sao 4 cánh (1 cánh dài gấp 3), có vòng tròn nằm chéo ở giữa lúc ẩn lúc hiện. Vệt kiếm khí xé gió (đen trắng, 0.3 giây) chỉ xuất hiện tại vị trí mục tiêu khi cú lao chém trúng.
+ Drone Sword: khi đánh trúng có 20% đứng yên 0.5 giây chém quạt, gây 10% máu tối đa. Đường chém để lại vết nứt không gian hình lưỡi liềm tồn tại 1 giây, sau đó nổ bắn ra 12 đạn ngôi sao 4 cánh rồi khép lại.
+ Master Sword: vệt kiếm đen trắng kiểu kiếm khí xé gió, tồn tại 0.3 giây.
+ Hệ nguyên tố cho toàn bộ pháo: mỗi pháo nhận ngẫu nhiên 1 trong 2 nguyên tố (50/50), khi bắn trúng có 20% gắn ấn:
   - Băng giá: tối đa 3 tầng, mỗi tầng giảm 10% tốc độ di chuyển và 10% tốc độ bắn của mục tiêu.
   - Lửa đốt: mỗi giây gây 10 + 10% sát thương gốc.
   - Phản ứng Hoàng Hỏa: mục tiêu có đồng thời ấn Băng giá và ấn Lửa đốt sẽ nhận Hoàng Hỏa trong 10 giây, chịu thêm 50% sát thương.



-------------------------------------------
> Điều chỉnh cân bằng bản 0.7.18:
+ Pháo Zoj:
   - Thay đổi cơ chế: +20 đồng và 50% mất máu hồi máu > khi nạp loại đạn nào, bắn trúng mục tiêu +30 vật phẩm đó, bắn đủ 100 viên sẽ tự hủy.
   


-------------------------------------------
> Điều chỉnh cân bằng bản 0.7.12:
+ Pháo điều phối Drone:
   - giảm 90% chi phí xây dựng.
+ Pháo Tankani 2k và 4k:
   - Nâng giới hạn tầng tối đa lên 9999%.
   - Tăng sát thương mỗi tầng lên 90%.
   - Sát thương 0.2% Max HP mục tiêu mỗi 2 tầng.



-------------------------------------------
> Điều chỉnh cân bằng bản 0.7.11:
+ Pháo Vendicum:
   - thêm đạn: Đồng với 50% sức mạnh so với đạn Silicon.
   - Kỹ năng mới (Nội tại va chạm): Khi pháo tiêu hao hết số buff, lập tức nhận 9% sát thương, tối đa 999%.



-------------------------------------------
> Điều chỉnh cân bằng bản 0.7.10:
+ Pháo Lyvervon:
   - Tăng 100% chi phí xây dựng.
   - Sát thương gốc: Tăng 5000% sát thương gốc ở tất cả các cấp.
   - Nhánh MK2:
     * Yêu cầu nâng cấp: 120 Copper + 250 Silicon (thay vì 120 Titanium + 500 Thorium).
     * Xung kích Sonic kết liễu (Sonic Finish Shockwave): Kích nổ ngay khi điểm sạc đạt 100 (thay vì 500).
   - Nhánh MK2b:
     * Yêu cầu nâng cấp: 200 Copper + 290 Lead (thay vì 800 Copper + 290 Plastanium).
     * Kích nổ Kép Đồng Thời (Dual Simultaneous Explosion): Giải phóng năng lượng và kích nổ ngay khi thanh năng lượng đạt 5/5 điểm (thay vì 25/25 điểm).



-------------------------------------------
> Điều chỉnh cân bằng bản 0.7.8:
+ Pháo Xylaon (Tối ưu hiệu năng & Cân bằng lại):
   - Sát thương đạn gốc: Tăng bù đắp (Graphite: 20 > 35, Copper: 12 > 22, MK2: 26 > 50, MK2B: 13 > 32).
   - Số đạn mỗi loạt bắn: Giảm 5 > 3 viên.
   - Tốc độ bắn gia tốc nhiệt (AS): Giảm hệ số xả đạn để tránh quá tải/lag (MK1: +180%, MK2: +250%, MK2B: +400%).
   - Bạo kích: Giảm tỷ lệ xuất hiện từ 50% > 30%.
   - Tầm truy đuổi đạn (Homing): Giảm 120 > 60 px.
   - Xuyên mục tiêu (Pierce): Giảm tối đa 3 > 2 mục tiêu.
   - Tối ưu VFX: Chuyển hiệu ứng vệt đạn sang dạng dải GPU giúp mượt game hơn.
+ Pháo Blaw:
   - Giảm chi phí xây: 90%
   - MK1: tăng sât thương 10 > 25, phạm vi bắn tăng 260 > 442.
   - MK2: tăng sât thương 20 > 50, phạm vi bắn tăng 390 > 663 .
   - MK2B: tăng sât thương 220 > 550, phạm vi bắn tăng 182 > 310.
+ Pháo Blixalum:
   - Giảm chi phí xây: 90%
   - MK1 và MK2: tăng sât thương 250 > 625, phạm vi bắn tăng 260 > 442.
   - MK2B: tăng sât thương 300 > 750, phạm vi bắn tăng 340 > 578.
+ Pháo Reguilater:
   - Máu giảm 250000 > 5200.
+ Khiên Reflecounum:
   - Giảm chi phí xây: 90%
   


-------------------------------------------
> Điều chỉnh cân bằng bản 0.7.7:
+ Pháo Dor:
   - giảm giá 170 đồng > 70 đồng để xây dựng.
   - giảm giá nâng cấp lên MK: -80%.
+ Pháo Vendicum:
   - tăng 50% dmg gốc.
+ Pháo Rantaturs:
   - giảm giá nâng cấp lên MK: -65%.
   - tăng số đạn bắn ra: +35%.
+ Pháo CTG-Soldern:
   - tăng 250% dmg gốc.
+ Pháo Blaw:
   - thêm chỉ số cơ bản: 5% tỉ lệ bạo kích, 50% sát thương bạo kích. Khi nâng cấp mk thì tăng thêm 10% tỉ lệ bạo kích và 30% sát thương bạo kích.
+ Pháo Blixalum:
   - thêm chỉ số cơ bản: 50% tỉ lệ bạo kích, 100% sát thương bạo kích.
+ Pháo Heliyron:
   - mất 10% máu sẽ tăng +50% sát thương (+20% > +50%).
+ Pháo Plasanod:
   - tăng dmg gốc thêm 500%.
+ Pháo Therdum:
   - giảm giá xây dựng.
   - tăng giáp: +46.
   - tăng dmg gốc thêm 60%.



-------------------------------------------
> Điều chỉnh cân bằng bản 0.6.9:
- Khối Laser Brey: tăng 75% tốc độ đào pháo tường địa hình Vanilla.



-------------------------------------------
> Điều chỉnh cân bằng bản 0.6.7.3:
+ Unit Leolyr: 
   - giảm 80 giáp còn 10 giáp.
   - tăng tốc độ từ 0.9 lên 1.1
+ Unit Elorix:
   - tăng máu từ 1890 lên 5870



-------------------------------------------
> Điều chỉnh cân bằng bản 0.6.7.1:
+ Bopes Block:
   - tăng 20% phạm vi buff (80 > 96).



-------------------------------------------
> Điều chỉnh cân bằng bản 0.6.7:
+ Units Leolys: 
   - Giảm máu 50% (2400 > 1200).
   - Giảm giáp 80% (400 > 80).
   - Tăng tốc độ di chuyển: 0.8 > 0.9  
+ Pháo Rangtaturs: 
   - Mk1 bắn 9 viên tăng lên 29 viên.



-------------------------------------------
> Điều chỉnh cân bằng bản 0.5.6:
- Xóa bỏ cơ chế giới hạn đặt tháp pháo.



-------------------------------------------
> Điều chỉnh cân bằng bản 0.5.3:
+ Pháo Lavunder:
  - sẽ giới hạn xây là 1.
 Cấp 1: MK1 (Cơ bản)
  - Sát thương cơ bản: 33 ST/giây. > 112 ST/giây.
  - Đạt 100 Sạc (Explosion):
    + Bộc phá diện rộng bán kính 40 px. > 60 px. 
    + Gây 100 ST flat + 1% HP tối đa của mục tiêu. > 1000 ST flat.
 Cấp 2: MK2 (Xung lực Hỏa lực Liên hoàn)
  - Tốc độ sạc: Tăng nhanh hơn 1.8x so với MK1. > 3.8x so vói MK1.
  -Gây 320 ST flat + 2% HP tối đa diện rộng (bán kính 40 px). > Gây 3200 ST flat.



-------------------------------------------
> Điều chỉnh cân bằng bản 0.5.2:
+ Pháo Vendicum sẽ giới hạn xây là 1.



-------------------------------------------
> Điều chỉnh cân bằng bản 0.4.7:
+ Pháo Vendicum:
  - Nhánh MK2B phần giảm sát thương đổi lại thành tăng sát thương 22 > 122 (+173%).



-------------------------------------------
> Điều chỉnh cân bằng bản 0.4.6:
+ Pháo Blaw, Blixalum và Tyber sẽ giới hạn xây là 1.



-------------------------------------------
> Điều chỉnh cân bằng bản 0.4.4:
+ Pháo Rangtaturs:
  - Tăng phạm vi bắn: 176 > 352.
  - Tăng độ dài của laser: 120 > 240.
  - Giảm sát thương đạn của tất cả cấp độ xuống 1.



-------------------------------------------
> Điều chỉnh cân bằng bản 0.4.0:
+ Pháo Xylaon: 
  - đạn thêm hiệu ứng xuyên mục tiêu: 3.
  - đạn thêm hiệu ứng truy đuổi nhẹ.
  - tăng số lượng vật phẩm pháo chứa: 300.