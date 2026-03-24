from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os
import json
from dotenv import load_dotenv
from database import get_db_connection, log_activity, init_database

# Загружаем переменные окружения
load_dotenv()

app = Flask(__name__)
CORS(app)

# Email конфигурация
EMAIL_SENDER = os.getenv('EMAIL_SENDER', 'ospanr4@gmail.com')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD', 'zvol jphz mdvn ndna')

# Инициализация базы данных
init_database()


def parse_iso_datetime(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except Exception:
        return None


def normalize_due_fields(data, fallback_created_at=None):
    raw_due_date = data.get('dueDate') or data.get('due_date') or data.get('date')
    raw_due_time = data.get('dueTime') or data.get('due_time')

    due_date = raw_due_date.strip() if isinstance(raw_due_date, str) and raw_due_date.strip() else None
    due_time = raw_due_time.strip() if isinstance(raw_due_time, str) and raw_due_time.strip() else None

    if due_date:
        return due_date, due_time, 'manual'

    if fallback_created_at:
        created_dt = parse_iso_datetime(fallback_created_at)
        if created_dt:
            return created_dt.strftime('%Y-%m-%d'), created_dt.strftime('%H:%M'), 'inferred_created_at'

    return None, None, 'unscheduled'


def send_email_results(user_email, code, verification_type):
    """Отправка кода верификации на email"""
    try:
        timestamp = datetime.now().strftime("%d.%m.%Y %H:%M:%S")
        
        type_text = "регистрации" if verification_type == "register" else "входа"
        type_emoji = "👤" if verification_type == "register" else "🔐"
        
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; padding: 20px; border-radius: 10px; }}
                .code-box {{ background: #f8f9fa; padding: 30px; margin: 20px 0; 
                           border-left: 5px solid #667eea; border-radius: 5px; text-align: center; }}
                .code {{ font-size: 48px; font-weight: 900; color: #667eea; 
                        letter-spacing: 10px; font-family: 'Courier New', monospace; }}
                .warning {{ background: #fff4e6; padding: 15px; border-left: 5px solid #f59e0b; 
                          border-radius: 5px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{type_emoji} Mixed Dashboard - Код верификации</h1>
                <p>Дата: {timestamp}</p>
            </div>
            <h2>Здравствуйте!</h2>
            <p>Вы запросили код для {type_text} в системе <strong>Mixed Dashboard</strong>.</p>
            <div class="code-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Ваш код верификации:</p>
                <div class="code">{code}</div>
            </div>
            <p><strong>⏱️ Важно:</strong> Код действителен в течение <strong>60 секунд</strong>.</p>
            <div class="warning">
                <p><strong>🔒 Безопасность:</strong> Никогда не сообщайте этот код третьим лицам.</p>
            </div>
            <hr style="margin-top: 30px;">
            <p style="color: #666; font-size: 0.9em;">
                Автоматический email системы "Mixed Dashboard"<br>
                Если вы не запрашивали этот код, просто проигнорируйте это письмо.
            </p>
        </body>
        </html>
        """
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"{type_emoji} Код верификации Mixed Dashboard - {code}"
        msg['From'] = EMAIL_SENDER
        msg['To'] = user_email
        
        html_part = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(html_part)
        
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, user_email, msg.as_string())
        server.quit()
        
        print(f"✅ Email отправлен на {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка отправки email: {e}")
        return False


# ============================================
# AUTH ENDPOINTS
# ============================================

@app.route('/api/send-verification-code', methods=['POST'])
def send_verification_code():
    """Отправка кода верификации"""
    try:
        data = request.json
        user_email = data.get('email')
        code = data.get('code')
        verification_type = data.get('type', 'login')
        
        if not user_email or not code:
            return jsonify({'success': False, 'error': 'Email и код обязательны'}), 400
        
        success = send_email_results(user_email, code, verification_type)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Код отправлен на {user_email}',
                'code': code
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Не удалось отправить email'}), 500
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/register', methods=['POST'])
def register():
    """Регистрация нового пользователя"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверка существования email
        cursor.execute('SELECT id FROM users WHERE email = ?', (data['email'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Email уже зарегистрирован'}), 400
        
        # Создание пользователя
        user_id = f"user-{datetime.now().timestamp()}"
        cursor.execute('''
        INSERT INTO users (id, email, password, first_name, last_name, created_at, profile_data, settings_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            data['email'],
            data['password'],
            data['firstName'],
            data['lastName'],
            datetime.now().isoformat(),
            json.dumps({}),
            json.dumps({
                'emailNotifications': True,
                'pushNotifications': False,
                'weeklyDigest': True,
                'language': 'ru',
                'timezone': 'Asia/Almaty',
                'dateFormat': 'DD.MM.YYYY',
                'theme': 'auto'
            })
        ))
        
        conn.commit()
        log_activity(user_id, 'register', {'email': data['email']})
        conn.close()
        
        return jsonify({'success': True, 'userId': user_id}), 201
        
    except Exception as e:
        print(f"❌ Ошибка регистрации: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/login', methods=['POST'])
def login():
    """Вход пользователя"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT id, email, first_name, last_name, created_at
        FROM users WHERE email = ? AND password = ?
        ''', (data['email'], data['password']))
        
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return jsonify({'success': False, 'error': 'Неверный email или пароль'}), 401
        
        # Обновляем last_login
        cursor.execute('UPDATE users SET last_login = ? WHERE id = ?', 
                      (datetime.now().isoformat(), user['id']))
        conn.commit()
        
        log_activity(user['id'], 'login', {'email': data['email']})
        conn.close()
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'firstName': user['first_name'],
                'lastName': user['last_name'],
                'createdAt': user['created_at']
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Ошибка входа: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# USER PROFILE ENDPOINTS
# ============================================

@app.route('/api/user/<user_id>', methods=['GET'])
def get_user(user_id):
    """Получение данных пользователя"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT id, email, first_name, last_name, created_at, last_login, profile_data, settings_data
        FROM users WHERE id = ?
        ''', (user_id,))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'success': False, 'error': 'Пользователь не найден'}), 404
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'firstName': user['first_name'],
                'lastName': user['last_name'],
                'createdAt': user['created_at'],
                'lastLogin': user['last_login'],
                'profile': json.loads(user['profile_data']) if user['profile_data'] else {},
                'settings': json.loads(user['settings_data']) if user['settings_data'] else {}
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/user/<user_id>/profile', methods=['PUT'])
def update_profile(user_id):
    """Обновление профиля пользователя"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE users SET profile_data = ? WHERE id = ?',
                      (json.dumps(data), user_id))
        conn.commit()
        
        log_activity(user_id, 'update_profile', data)
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/user/<user_id>/settings', methods=['PUT'])
def update_settings(user_id):
    """Обновление настроек пользователя"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE users SET settings_data = ? WHERE id = ?',
                      (json.dumps(data), user_id))
        conn.commit()
        
        log_activity(user_id, 'update_settings', data)
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# DASHBOARD ITEMS ENDPOINTS
# ============================================

@app.route('/api/dashboard/<user_id>/items', methods=['GET'])
def get_dashboard_items(user_id):
    """Получение задач пользователя"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT id, text, status, priority, category, due_date, due_time, due_source, created_at, updated_at
        FROM dashboard_items WHERE user_id = ?
        ORDER BY created_at DESC
        ''', (user_id,))
        
        items = []
        for row in cursor.fetchall():
            items.append({
                'id': row['id'],
                'text': row['text'],
                'status': row['status'],
                'priority': row['priority'],
                'category': row['category'],
                'dueDate': row['due_date'],
                'dueTime': row['due_time'],
                'dueSource': row['due_source'],
                'createdAt': row['created_at'],
                'updatedAt': row['updated_at']
            })
        
        conn.close()
        
        return jsonify({'success': True, 'items': items}), 200
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/dashboard/<user_id>/items', methods=['POST'])
def create_dashboard_item(user_id):
    """Создание новой задачи"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        item_id = f"item-{datetime.now().timestamp()}"
        now = datetime.now().isoformat()
        due_date, due_time, due_source = normalize_due_fields(data, fallback_created_at=now)
        
        cursor.execute('''
        INSERT INTO dashboard_items (id, user_id, text, status, priority, category, due_date, due_time, due_source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            item_id,
            user_id,
            data['text'],
            data.get('status', 'active'),
            data.get('priority'),
            data.get('category'),
            due_date,
            due_time,
            due_source,
            now,
            now
        ))
        
        conn.commit()
        log_activity(user_id, 'create_task', {'text': data['text']})
        conn.close()
        
        return jsonify({'success': True, 'itemId': item_id}), 201
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/dashboard/<user_id>/items/<item_id>', methods=['PUT'])
def update_dashboard_item(user_id, item_id):
    """Обновление задачи"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        due_date, due_time, due_source = normalize_due_fields(data)
        
        cursor.execute('''
        UPDATE dashboard_items
        SET text = ?, status = ?, priority = ?, category = ?, due_date = ?, due_time = ?, due_source = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
        ''', (
            data['text'],
            data['status'],
            data.get('priority'),
            data.get('category'),
            due_date,
            due_time,
            due_source,
            datetime.now().isoformat(),
            item_id,
            user_id
        ))
        
        conn.commit()
        log_activity(user_id, 'update_task', {'item_id': item_id, 'text': data['text']})
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/dashboard/<user_id>/items/<item_id>', methods=['DELETE'])
def delete_dashboard_item(user_id, item_id):
    """Удаление задачи"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM dashboard_items WHERE id = ? AND user_id = ?', 
                      (item_id, user_id))
        conn.commit()
        
        log_activity(user_id, 'delete_task', {'item_id': item_id})
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# ANALYTICS ENDPOINTS
# ============================================

@app.route('/api/user/<user_id>/activities', methods=['GET'])
def get_user_activities(user_id):
    """Получение активности пользователя"""
    try:
        limit = request.args.get('limit', 50, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT action, details, timestamp
        FROM user_activities
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
        ''', (user_id, limit))
        
        activities = []
        for row in cursor.fetchall():
            activities.append({
                'action': row['action'],
                'details': json.loads(row['details']) if row['details'] else None,
                'timestamp': row['timestamp']
            })
        
        conn.close()
        
        return jsonify({'success': True, 'activities': activities}), 200
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/dashboard/<user_id>/analytics', methods=['GET'])
def get_dashboard_analytics(user_id):
    """Полная аналитика задач пользователя"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
        SELECT id, text, status, priority, category, due_date, due_time, due_source, created_at, updated_at
        FROM dashboard_items WHERE user_id = ?
        ORDER BY created_at DESC
        ''', (user_id,))

        rows = cursor.fetchall()
        conn.close()

        items = [{
            'id': r['id'],
            'text': r['text'],
            'status': r['status'],
            'priority': r['priority'],
            'category': r['category'],
            'dueDate': r['due_date'],
            'dueTime': r['due_time'],
            'dueSource': r['due_source'],
            'createdAt': r['created_at'],
            'updatedAt': r['updated_at']
        } for r in rows]

        total = len(items)
        active = len([i for i in items if i['status'] == 'active'])
        completed = len([i for i in items if i['status'] == 'completed'])
        completion_rate = round((completed / total) * 100) if total > 0 else 0

        # --- Category distribution ---
        category_counts = {}
        for i in items:
            cat = i['category'] or 'other'
            category_counts[cat] = category_counts.get(cat, 0) + 1

        top_categories = sorted(
            [{'name': k, 'count': v, 'percentage': round((v / total) * 100, 1) if total > 0 else 0}
             for k, v in category_counts.items()],
            key=lambda x: x['count'], reverse=True
        )

        # --- Priority distribution ---
        priority_dist = {
            'high':   len([i for i in items if i['priority'] == 'high']),
            'medium': len([i for i in items if i['priority'] == 'medium']),
            'low':    len([i for i in items if i['priority'] == 'low'])
        }

        day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        
        def get_day_name(dt):
            return day_names[(dt.weekday() + 1) % 7]

        def parse_due_datetime(due_date, due_time):
            if not due_date:
                return None
            raw_time = due_time or '12:00'
            try:
                return datetime.fromisoformat(f'{due_date}T{raw_time}')
            except Exception:
                try:
                    return datetime.fromisoformat(due_date)
                except Exception:
                    return None

        # --- Heatmap: day-of-week × hour ---
        heatmap = {d: {h: 0 for h in range(24)} for d in day_names}
        due_heatmap = {d: {h: 0 for h in range(24)} for d in day_names}
        due_status_heatmap = {
            d: {h: {'completed': 0, 'active': 0} for h in range(24)}
            for d in day_names
        }
        for i in items:
            created_dt = parse_iso_datetime(i['createdAt'])
            if created_dt:
                heatmap[get_day_name(created_dt)][created_dt.hour] += 1

            due_dt = parse_due_datetime(i.get('dueDate'), i.get('dueTime'))
            if due_dt:
                due_heatmap[get_day_name(due_dt)][due_dt.hour] += 1
                due_status_heatmap[get_day_name(due_dt)][due_dt.hour][i['status']] += 1

        # --- Peak assignment hour & day ---
        assignment_hour_counts = {h: 0 for h in range(24)}
        assignment_day_counts = {d: 0 for d in day_names}
        for i in items:
            dt = parse_iso_datetime(i['createdAt'])
            if dt:
                assignment_hour_counts[dt.hour] += 1
                assignment_day_counts[get_day_name(dt)] += 1

        assignment_peak_hour = max(assignment_hour_counts, key=assignment_hour_counts.get) if any(assignment_hour_counts.values()) else 10
        assignment_peak_day = max(assignment_day_counts, key=assignment_day_counts.get) if any(assignment_day_counts.values()) else 'Monday'

        # --- Due-based metrics and trend ---
        now_dt = datetime.now()
        scheduled_items = []
        overdue_tasks = 0
        upcoming_7_days = 0
        due_hour_counts = {h: 0 for h in range(24)}
        due_day_counts = {d: 0 for d in day_names}

        for i in items:
            due_dt = parse_due_datetime(i.get('dueDate'), i.get('dueTime'))
            if not due_dt:
                continue

            scheduled_items.append(i)
            due_hour_counts[due_dt.hour] += 1
            due_day_counts[get_day_name(due_dt)] += 1

            if i['status'] == 'active' and due_dt < now_dt:
                overdue_tasks += 1

            days_until_due = (due_dt.date() - now_dt.date()).days
            if 0 <= days_until_due <= 6:
                upcoming_7_days += 1

        scheduled_tasks = len(scheduled_items)
        unscheduled_tasks = total - scheduled_tasks
        explicit_scheduled_tasks = len([i for i in scheduled_items if i.get('dueSource') == 'manual'])
        inferred_scheduled_tasks = len([i for i in scheduled_items if i.get('dueSource') == 'inferred_created_at'])
        schedule_coverage_rate = round((scheduled_tasks / total) * 100) if total > 0 else 0
        planned_completion_rate = round(
            (len([i for i in scheduled_items if i['status'] == 'completed']) / scheduled_tasks) * 100
        ) if scheduled_tasks > 0 else 0
        due_peak_hour = max(due_hour_counts, key=due_hour_counts.get) if any(due_hour_counts.values()) else 10
        due_peak_day = max(due_day_counts, key=due_day_counts.get) if any(due_day_counts.values()) else 'Monday'

        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        last_30_days = []
        for offset in range(29, -1, -1):
            day = today - __import__('datetime').timedelta(days=offset)
            day_str = day.strftime('%Y-%m-%d')
            day_items = [i for i in scheduled_items if i.get('dueDate') == day_str]
            last_30_days.append({
                'date': day_str,
                'completed': len([i for i in day_items if i['status'] == 'completed']),
                'active': len([i for i in day_items if i['status'] == 'active'])
            })

        # --- Recent tasks prioritized by due date ---
        def sort_key(item):
            due_dt = parse_due_datetime(item.get('dueDate'), item.get('dueTime'))
            created_dt = parse_iso_datetime(item.get('createdAt'))
            if due_dt:
                return (0, due_dt.isoformat())
            if created_dt:
                return (1, created_dt.isoformat())
            return (2, '')

        recent = sorted(items, key=sort_key)[:10]
        recent_activities = [{
            'id': i['id'],
            'text': i['text'],
            'action': i['status'],
            'timestamp': i['dueDate'] or i['createdAt'],
            'category': i['category'] or 'other',
            'priority': i['priority'] or 'low',
            'createdAt': i['createdAt'],
            'dueDate': i['dueDate'],
            'dueTime': i['dueTime']
        } for i in recent]

        analytics = {
            'totalTasks': total,
            'activeTasks': active,
            'completedTasks': completed,
            'completionRate': completion_rate,
            'categoryDistribution': category_counts,
            'priorityDistribution': priority_dist,
            'topCategories': top_categories,
            'last30Days': last_30_days,
            'heatmapData': heatmap,
            'dueHeatmapData': due_heatmap,
            'dueStatusHeatmapData': due_status_heatmap,
            'peakProductivityHour': assignment_peak_hour,
            'peakProductivityDay': assignment_peak_day,
            'assignmentPeakHour': assignment_peak_hour,
            'assignmentPeakDay': assignment_peak_day,
            'duePeakHour': due_peak_hour,
            'duePeakDay': due_peak_day,
            'scheduledTasks': scheduled_tasks,
            'explicitScheduledTasks': explicit_scheduled_tasks,
            'inferredScheduledTasks': inferred_scheduled_tasks,
            'unscheduledTasks': unscheduled_tasks,
            'scheduleCoverageRate': schedule_coverage_rate,
            'plannedCompletionRate': planned_completion_rate,
            'overdueTasks': overdue_tasks,
            'upcomingTasks7Days': upcoming_7_days,
            'recentActivities': recent_activities
        }

        return jsonify({'success': True, 'analytics': analytics}), 200

    except Exception as e:
        print(f"❌ Ошибка аналитики: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Проверка работы сервера"""
    return jsonify({
        'status': 'OK',
        'message': 'Flask backend с SQLite работает',
        'database': 'SQLite',
        'email_sender': EMAIL_SENDER
    }), 200


if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print("🚀 Flask Backend запускается...")
    print(f"📧 Email отправитель: {EMAIL_SENDER}")
    print(f"🗄️ База данных: SQLite (mixed_dashboard.db)")
    print(f"🔗 Порт: {port}")
    print(f"🐛 Debug: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
