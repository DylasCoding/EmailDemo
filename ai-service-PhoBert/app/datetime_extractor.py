import re
from datetime import datetime, timedelta
from typing import Optional, Tuple

class DateTimeExtractor:
    def __init__(self):
        self.day_map = {
            'thứ hai': 0, 'thứ 2': 0, 't2': 0,
            'thứ ba': 1, 'thứ 3': 1, 't3': 1,
            'thứ tư': 2, 'thứ 4': 2, 't4': 2,
            'thứ năm': 3, 'thứ 5': 3, 't5': 3,
            'thứ sáu': 4, 'thứ 6': 4, 't6': 4,
            'thứ bảy': 5, 'thứ 7': 5, 't7': 5,
            'chủ nhật': 6, 'cn': 6
        }
        
        # Map các buổi trong ngày
        self.time_period_map = {
            'sáng': ('08:00', '12:00'),
            'sang': ('08:00', '12:00'),
            'buổi sáng': ('08:00', '12:00'),
            'buoi sang': ('08:00', '12:00'),
            'trưa': ('12:00', '13:30'),
            'trua': ('12:00', '13:30'),
            'buổi trưa': ('12:00', '13:30'),
            'buoi trua': ('12:00', '13:30'),
            'chiều': ('13:30', '18:00'),
            'chieu': ('13:30', '18:00'),
            'buổi chiều': ('13:30', '18:00'),
            'buoi chieu': ('13:30', '18:00'),
            'tối': ('18:00', '22:00'),
            'toi': ('18:00', '22:00'),
            'buổi tối': ('18:00', '22:00'),
            'buoi toi': ('18:00', '22:00'),
            'đêm': ('22:00', '23:59'),
            'dem': ('22:00', '23:59'),
            'buổi đêm': ('22:00', '23:59'),
            'buoi dem': ('22:00', '23:59'),
        }
        
    def extract_date(self, text: str) -> Optional[str]:
        """Trích xuất ngày từ text"""
        text_lower = text.lower()
        
        # Ngày cụ thể: 23/12, 23-12, 23/12/2024
        date_pattern = r'(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?'
        match = re.search(date_pattern, text)
        if match:
            day, month, year = match.groups()
            year = year if year else str(datetime.now().year)
            if len(year) == 2:
                year = '20' + year
            try:
                date_obj = datetime(int(year), int(month), int(day))
                return date_obj.strftime('%Y-%m-%d')
            except:
                pass
        
        # Hôm nay, ngày mai, ngày kia
        if 'hôm nay' in text_lower or 'hom nay' in text_lower:
            return datetime.now().strftime('%Y-%m-%d')
        if 'ngày mai' in text_lower or 'ngay mai' in text_lower or 'mai' in text_lower:
            return (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        if 'ngày kia' in text_lower or 'ngay kia' in text_lower:
            return (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d')
        
        # Thứ trong tuần
        for day_name, offset in self.day_map.items():
            if day_name in text_lower:
                today = datetime.now()
                days_ahead = offset - today.weekday()
                if days_ahead <= 0:
                    days_ahead += 7
                return (today + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
        
        return None
    
    def extract_time(self, text: str):
        text = text.lower()

        # 1. Khoảng giờ: 7 giờ 30 đến 9 giờ / 7h30-9h
        range_pattern = (
            r'(\d{1,2})\s*(?:h|giờ|gio)?\s*(\d{0,2})'
            r'\s*(?:đến|den|-|->|to)\s*'
            r'(\d{1,2})\s*(?:h|giờ|gio)?\s*(\d{0,2})'
        )
        m = re.search(range_pattern, text)
        if m:
            sh, sm, eh, em = m.groups()
            start = f"{int(sh):02d}:{int(sm) if sm else 0:02d}"
            end = f"{int(eh):02d}:{int(em) if em else 0:02d}"
            return start, end

        # 2. Giờ đơn: 7 giờ 30 / 7h / 7:30
        single_pattern = r'(\d{1,2})\s*(?:h|giờ|gio|:)?\s*(\d{0,2})'
        m = re.search(single_pattern, text)
        if m:
            h, mnt = m.groups()
            start = f"{int(h):02d}:{int(mnt) if mnt else 0:02d}"
            end = f"{int(h)+1:02d}:{int(mnt) if mnt else 0:02d}"
            return start, end

        # 3. BUỔI (chỉ dùng nếu KHÔNG có giờ cụ thể)
        for period, (start, end) in self.time_period_map.items():
            if period in text:
                return start, end

        return None, None

    
    def extract_title(self, text: str) -> str:
        # 1. Lấy dòng đầu
        line = text.strip().splitlines()[0].lower()

        # 2. Làm sạch ngày / giờ
        line = re.sub(r'(hôm nay|ngày mai|ngày kia|mai)', '', line)
        line = re.sub(r'\d{1,2}\s*(giờ|gio)\s*\d{0,2}', '', line)
        line = re.sub(r'\d{1,2}[h:]\d{2}', '', line)
        line = re.sub(r'(thứ\s*\d+|chủ nhật|cn|t\d)', '', line)

        line = ' '.join(line.split())

        VERBS = [
            'họp', 'gặp', 'đến', 'đi', 'tham gia',
            'học', 'khám', 'nộp', 'làm việc',
            'phỏng vấn', 'kiểm tra', 'báo cáo'
        ]

        # 3. Tìm verb
        for verb in VERBS:
            if line.startswith(verb + ' '):
                obj = line[len(verb):].strip()
                return f"{verb.capitalize()} {obj}"

            if f' {verb} ' in line:
                obj = line.split(verb, 1)[1].strip()
                return f"{verb.capitalize()} {obj}"

        # 4. Fallback: tìm "đến"
        if 'đến ' in line:
            return f"Đến {line.split('đến', 1)[1].strip().capitalize()}"

        # 5. Không có verb → verb mặc định
        return f"Tham gia {line.capitalize()}" if line else "Lịch hẹn"

