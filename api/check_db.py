"""
check_db.py
Script tiện ích dùng để kiểm tra dữ liệu đang được lưu trữ trong cơ sở dữ liệu (MySQL hoặc SQLite).

Cách sử dụng:
    python check_db.py                     # Hiển thị tổng quan toàn bộ DB: số lượng bản ghi các bảng, danh sách users & dữ liệu mẫu gần nhất
    python check_db.py --user <email/id>   # Xem chi tiết tất cả dữ liệu của 1 user cụ thể (logs, workout, meals, sleep, body...)
    python check_db.py --table <tên_bảng>  # Xem chi tiết các dòng trong một bảng cụ thể (users, step_logs, meal_logs, ...)
    python check_db.py --limit 10          # Giới hạn số dòng hiển thị (mặc định là 5)
    python check_db.py --raw "SQL_QUERY"   # Chạy câu lệnh SQL tuỳ ý để kiểm tra nhanh
"""

import sys
import os
import argparse
import json
from datetime import datetime, date
from sqlalchemy import text, inspect

# Đảm bảo đường dẫn import hoạt động đúng khi chạy script từ thư mục bất kỳ
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app import create_app
from models import (
    db, User, UserInfo, BodyConditionLog,
    WorkoutPlan, WorkoutLog, StepLog, SleepLog, MealLog
)

# Danh sách tất cả các models quản lý
TABLE_MODELS = {
    'users': User,
    'user_info': UserInfo,
    'body_condition_logs': BodyConditionLog,
    'workout_plans': WorkoutPlan,
    'workout_logs': WorkoutLog,
    'step_logs': StepLog,
    'sleep_logs': SleepLog,
    'meal_logs': MealLog
}

def format_value(val):
    """Format giá trị cho dễ đọc trên console."""
    if val is None:
        return "-"
    if isinstance(val, (datetime, date)):
        return val.strftime("%Y-%m-%d %H:%M" if isinstance(val, datetime) else "%Y-%m-%d")
    if isinstance(val, (dict, list)):
        return json.dumps(val, ensure_ascii=False)
    if isinstance(val, float):
        return f"{val:.2f}"
    return str(val)

def print_separator(char="=", length=75):
    print(char * length)

def print_header(title):
    print_separator("=")
    print(f"  {title}")
    print_separator("=")

def print_table(headers, rows):
    """In bảng ASCII căn chỉnh đẹp mắt."""
    if not rows:
        print("  (Không có dữ liệu)")
        return

    # Tính độ rộng lớn nhất của từng cột
    col_widths = [len(str(h)) for h in headers]
    for row in rows:
        for i, val in enumerate(row):
            str_val = str(format_value(val))
            # Cắt ngắn nếu quá dài
            if len(str_val) > 40:
                str_val = str_val[:37] + "..."
            col_widths[i] = max(col_widths[i], len(str_val))

    # In Header
    header_line = " | ".join(f"{headers[i]:<{col_widths[i]}}" for i in range(len(headers)))
    divider_line = "-+-".join("-" * col_widths[i] for i in range(len(headers)))
    print("  " + header_line)
    print("  " + divider_line)

    # In Rows
    for row in rows:
        formatted_row = []
        for i, val in enumerate(row):
            str_val = str(format_value(val))
            if len(str_val) > 40:
                str_val = str_val[:37] + "..."
            formatted_row.append(f"{str_val:<{col_widths[i]}}")
        print("  " + " | ".join(formatted_row))

def show_database_overview(limit=5):
    """Hiển thị tổng quan DB: trạng thái kết nối, số lượng dòng mỗi bảng, danh sách users và preview."""
    engine = db.engine
    engine_name = engine.name
    url_str = str(engine.url)

    # Che mật khẩu nếu có trong URL connection string
    if "@" in url_str and ":" in url_str:
        try:
            prefix, rest = url_str.split("://", 1)
            creds, addr = rest.split("@", 1)
            user = creds.split(":")[0]
            url_str = f"{prefix}://{user}:****@{addr}"
        except Exception:
            pass

    print_header("THÔNG TIN KẾT NỐI DATABASE")
    print(f"  Loại Database  : {engine_name.upper()}")
    print(f"  Connection URL : {url_str}")
    if engine_name == 'sqlite':
        db_file = os.path.join(current_dir, 'gym_auth.db')
        exists = os.path.exists(db_file)
        size_kb = (os.path.getsize(db_file) / 1024) if exists else 0
        print(f"  File SQLite    : {db_file} ({size_kb:.1f} KB)")

    print()
    print_header("THỐNG KÊ SỐ LƯỢNG BẢN GHI THEO BẢNG")
    counts = []
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    for t_name, model in TABLE_MODELS.items():
        if t_name in existing_tables:
            try:
                count = db.session.query(model).count()
                counts.append([t_name, count, "Đã khởi tạo"])
            except Exception as e:
                counts.append([t_name, "Lỗi", str(e)[:30]])
        else:
            counts.append([t_name, 0, "Chưa tạo bảng"])

    print_table(["Tên Bảng", "Số Bản Ghi", "Trạng Thái"], counts)

    # Hiển thị danh sách Users
    print()
    print_header("DANH SÁCH TÀI KHOẢN (USERS)")
    try:
        users = User.query.order_by(User.id.asc()).all()
        if not users:
            print("  [Thông báo] Chưa có tài khoản người dùng nào trong cơ sở dữ liệu.")
            print("  Gợi ý: Chạy lệnh `python seed_test_data.py` để nạp dữ liệu mẫu ban đầu.")
        else:
            user_rows = []
            for u in users:
                info = u.get_info()
                user_rows.append([
                    u.id,
                    u.email,
                    info.name or 'NPC',
                    u.role,
                    "✓ Đã xác thực" if u.is_verified else "✗ Chưa xác thực",
                    info.target_steps or 0,
                    u.created_at
                ])
            print_table(["ID", "Email", "Họ Tên", "Role", "Xác thực", "Mục tiêu bước", "Ngày tạo"], user_rows)
    except Exception as e:
        print(f"  [Lỗi khi đọc bảng users]: {e}")

    # Xem trước mẫu dữ liệu gần nhất của các logs
    print()
    print_header(f"BẢN GHI MỚI NHẤT MỖI BẢNG (Tối đa {limit} dòng)")

    for t_name, model in TABLE_MODELS.items():
        if t_name in ['users', 'user_info']:
            continue
        if t_name not in existing_tables:
            continue

        print(f"\n  ► Bảng: {t_name}")
        try:
            records = model.query.order_by(model.id.desc()).limit(limit).all()
            if not records:
                print("    (Chưa có bản ghi nào)")
                continue

            # Lấy các cột chính
            sample = records[0]
            col_names = [c.name for c in sample.__table__.columns]
            headers = col_names[:6]  # Lấy tối đa 6 cột tiêu biểu
            rows = []
            for r in records:
                rows.append([getattr(r, col) for col in headers])
            print_table(headers, rows)
        except Exception as e:
            print(f"    [Lỗi đọc bảng {t_name}]: {e}")

    print()
    print_separator("=")
    print("  GỢI Ý CÁCH DÙNG THÊM:")
    print("    python check_db.py --user <email_hoặc_id>    # Xem tất cả dữ liệu của 1 user")
    print("    python check_db.py --table <tên_bảng>       # Xem chi tiết các dòng trong bảng")
    print("    python check_db.py --raw \"SELECT * FROM users\" # Chạy truy vấn SQL trực tiếp")
    print_separator("=")

def show_user_detail(user_identifier):
    """Hiển thị toàn bộ thông tin và các nhật ký logs của một user cụ thể."""
    print_header(f"CHI TIẾT DỮ LIỆU CỦA USER: {user_identifier}")

    # Tìm theo ID hoặc Email
    user = None
    if str(user_identifier).isdigit():
        user = User.query.get(int(user_identifier))
    if not user:
        user = User.query.filter_by(email=str(user_identifier)).first()

    if not user:
        print(f"  [Không tìm thấy] Không có người dùng nào khớp với '{user_identifier}'.")
        return

    info = user.get_info()
    latest_body = user.get_latest_body_condition()

    print(f"  • User ID        : {user.id}")
    print(f"  • Email          : {user.email}")
    print(f"  • Họ và tên      : {info.name}")
    print(f"  • Quyền (Role)   : {user.role}")
    print(f"  • Đã xác thực OTP: {'Có' if user.is_verified else 'Chưa'}")
    print(f"  • Số điện thoại  : {info.phone or '-'}")
    print(f"  • Năm sinh / Tuổi: {info.yob or '-'} ({info.age} tuổi)")
    print(f"  • Giới tính      : {'Nữ' if info.gender == 1 else 'Nam'}")
    print(f"  • Mục tiêu thể lực: {'Giảm cân' if info.fitness_goal == 0 else 'Tăng cân'}")
    print(f"  • Cân nặng mt    : {info.target_weight or '-'} kg")
    print(f"  • Mục tiêu bước  : {info.target_steps or 0} bước/ngày")
    print(f"  • Cân nặng ht    : {latest_body.weight if latest_body else '-'} kg")
    print(f"  • Chiều cao ht   : {latest_body.height if latest_body else '-'} cm")
    print(f"  • Chỉ số BMI     : {latest_body.bmi if latest_body else '-'}")
    print(f"  • Ngày tạo       : {user.created_at}")

    # Step Logs
    print("\n  ► 5 Bản Ghi Bước Chân Gần Nhất (Step Logs):")
    steps = user.step_logs.order_by(StepLog.date.desc()).limit(5).all()
    if steps:
        print_table(["ID", "Ngày", "Số Bước", "Cự Ly (km)", "Calo Tiêu Hao"],
                    [[s.id, s.date, s.steps, s.distance, s.calories] for s in steps])
    else:
        print("    (Không có dữ liệu bước chân)")

    # Sleep Logs
    print("\n  ► 5 Bản Ghi Giấc Ngủ Gần Nhất (Sleep Logs):")
    sleeps = user.sleep_logs.order_by(SleepLog.date.desc()).limit(5).all()
    if sleeps:
        print_table(["ID", "Ngày", "Thời Lượng", "Giờ Ngủ", "Giờ Dậy", "Chất Lượng"],
                    [[sl.id, sl.date, f"{sl.duration_minutes} phút ({sl.duration_minutes/60:.1f}h)", sl.sleep_start, sl.sleep_end, sl.quality_rating] for sl in sleeps])
    else:
        print("    (Không có dữ liệu giấc ngủ)")

    # Meal Logs
    print("\n  ► 5 Bữa Ăn Gần Nhất (Meal Logs):")
    meals = user.meal_logs.order_by(MealLog.date.desc(), MealLog.time.desc()).limit(5).all()
    if meals:
        print_table(["ID", "Ngày", "Giờ", "Bữa", "Tên Món", "Calo", "Carbs(g)", "Protein(g)", "Fat(g)"],
                    [[m.id, m.date, m.time, m.meal_type, m.food_name, m.calories, m.carbs, m.protein, m.fat] for m in meals])
    else:
        print("    (Không có dữ liệu bữa ăn)")

    # Workout Logs
    print("\n  ► 5 Buổi Tập Gần Nhất (Workout Logs):")
    workouts = user.workout_logs.order_by(WorkoutLog.date.desc()).limit(5).all()
    if workouts:
        print_table(["ID", "Ngày", "Tên Bài Tập", "Loại", "Thời Lượng (phút)", "Calo"],
                    [[w.id, w.date, w.workout_name, w.workout_type, w.duration_minutes, w.calories_burned] for w in workouts])
    else:
        print("    (Không có dữ liệu buổi tập)")

    # Body Condition Logs
    print("\n  ► 5 Lần Ghi Nhận Chỉ Số Cơ Thể (Body Condition Logs):")
    bodies = user.body_condition_logs.order_by(BodyConditionLog.date.desc()).limit(5).all()
    if bodies:
        print_table(["ID", "Ngày", "Cân Nặng (kg)", "Chiều Cao (cm)", "BMI"],
                    [[b.id, b.date, b.weight, b.height, b.bmi] for b in bodies])
    else:
        print("    (Không có dữ liệu chỉ số cơ thể)")

def show_table_records(table_name, limit=20):
    """Hiển thị tất cả các dòng của một bảng cụ thể."""
    table_name = table_name.lower().strip()
    if table_name not in TABLE_MODELS:
        valid_tables = ", ".join(TABLE_MODELS.keys())
        print(f"  [Lỗi] Bảng '{table_name}' không hợp lệ.")
        print(f"  Các bảng khả dụng: {valid_tables}")
        return

    model = TABLE_MODELS[table_name]
    print_header(f"DỮ LIỆU BẢNG '{table_name}' (Tối đa {limit} dòng)")

    try:
        records = model.query.order_by(model.id.desc()).limit(limit).all()
        if not records:
            print(f"  Bảng '{table_name}' hiện đang trống (0 bản ghi).")
            return

        columns = [c.name for c in model.__table__.columns]
        rows = []
        for r in records:
            rows.append([getattr(r, col) for col in columns])

        print_table(columns, rows)
        total_count = model.query.count()
        print(f"\n  Đang hiển thị {len(records)}/{total_count} bản ghi mới nhất.")
    except Exception as e:
        print(f"  [Lỗi truy vấn]: {e}")

def run_raw_sql(query):
    """Chạy câu truy vấn SQL tuỳ ý và in kết quả."""
    print_header("THỰC THI TRUY VẤN SQL")
    print(f"  Query: {query}\n")

    try:
        with db.engine.connect() as conn:
            result = conn.execute(text(query))
            if result.returns_rows:
                headers = list(result.keys())
                rows = [list(row) for row in result.fetchall()]
                print_table(headers, rows)
                print(f"\n  Tổng cộng: {len(rows)} dòng kết quả.")
            else:
                conn.commit()
                print("  Thực thi thành công (Không có dòng dữ liệu trả về).")
    except Exception as e:
        print(f"  [Lỗi SQL]: {e}")

def main():
    parser = argparse.ArgumentParser(
        description="SHWI GYM DB INSPECTOR - Công cụ kiểm tra dữ liệu trong cơ sở dữ liệu."
    )
    parser.add_argument("--user", type=str, help="Email hoặc ID của user cần kiểm tra toàn bộ dữ liệu.")
    parser.add_argument("--table", type=str, help="Tên bảng muốn xem chi tiết (users, step_logs, meal_logs, ...).")
    parser.add_argument("--limit", type=int, default=5, help="Giới hạn số dòng hiển thị (Mặc định: 5 cho preview, 20 cho xem bảng).")
    parser.add_argument("--raw", type=str, help="Chạy câu truy vấn SQL thô (VD: 'SELECT * FROM users LIMIT 3').")

    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        if args.raw:
            run_raw_sql(args.raw)
        elif args.user:
            show_user_detail(args.user)
        elif args.table:
            limit = args.limit if args.limit != 5 else 20
            show_table_records(args.table, limit=limit)
        else:
            show_database_overview(limit=args.limit)

if __name__ == '__main__':
    main()
