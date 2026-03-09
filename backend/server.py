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
                <h1>{type_emoji} TaskFlow AI - Код верификации</h1>
                <p>Дата: {timestamp}</p>
            </div>
            <h2>Здравствуйте!</h2>
            <p>Вы запросили код для {type_text} в системе <strong>TaskFlow AI</strong>.</p>
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
                Автоматический email системы "TaskFlow AI"<br>
                Если вы не запрашивали этот код, просто проигнорируйте это письмо.
            </p>
        </body>
        </html>
        """
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"{type_emoji} Код верификации TaskFlow AI - {code}"
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
        SELECT id, text, status, priority, category, created_at, updated_at
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
        
        cursor.execute('''
        INSERT INTO dashboard_items (id, user_id, text, status, priority, category, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            item_id,
            user_id,
            data['text'],
            data.get('status', 'active'),
            data.get('priority'),
            data.get('category'),
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
        
        cursor.execute('''
        UPDATE dashboard_items
        SET text = ?, status = ?, priority = ?, category = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
        ''', (
            data['text'],
            data['status'],
            data.get('priority'),
            data.get('category'),
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
        SELECT id, text, status, priority, category, created_at, updated_at
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

        # --- Last 30 days trend ---
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        last_30_days = []
        for offset in range(29, -1, -1):
            day = today - __import__('datetime').timedelta(days=offset)
            day_str = day.strftime('%Y-%m-%d')
            day_items = [i for i in items if i['createdAt'] and i['createdAt'][:10] == day_str]
            last_30_days.append({
                'date': day_str,
                'completed': len([i for i in day_items if i['status'] == 'completed']),
                'active': len([i for i in day_items if i['status'] == 'active'])
            })

        # --- Heatmap: day-of-week × hour ---
        day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        heatmap = {d: {h: 0 for h in range(24)} for d in day_names}
        for i in items:
            try:
                raw = i['createdAt']
                if not raw:
                    continue
                raw = raw.replace('Z', '+00:00')
                dt = datetime.fromisoformat(raw)
                heatmap[day_names[dt.weekday() + 1 if dt.weekday() < 6 else 0]][dt.hour] += 1
            except Exception:
                pass

        # --- Peak hour & day ---
        hour_counts = {h: 0 for h in range(24)}
        day_counts = {d: 0 for d in day_names}
        for i in items:
            try:
                raw = i['createdAt']
                if not raw:
                    continue
                raw = raw.replace('Z', '+00:00')
                dt = datetime.fromisoformat(raw)
                hour_counts[dt.hour] += 1
                day_counts[day_names[dt.weekday() + 1 if dt.weekday() < 6 else 0]] += 1
            except Exception:
                pass

        peak_hour = max(hour_counts, key=hour_counts.get) if any(hour_counts.values()) else 10
        peak_day = max(day_counts, key=day_counts.get) if any(day_counts.values()) else 'Monday'

        # --- Avg completion time ---
        completion_times = []
        for i in items:
            if i['status'] == 'completed' and i['createdAt'] and i['updatedAt']:
                try:
                    c = datetime.fromisoformat(i['createdAt'].replace('Z', '+00:00'))
                    u = datetime.fromisoformat(i['updatedAt'].replace('Z', '+00:00'))
                    diff_days = (u - c).total_seconds() / 86400
                    if diff_days >= 0:
                        completion_times.append(diff_days)
                except Exception:
                    pass

        avg_completion = f"{round(sum(completion_times) / len(completion_times), 1)} д." if completion_times else 'N/A'

        # --- Recent activities (last 10 tasks by updatedAt) ---
        recent = sorted(items, key=lambda x: x['updatedAt'] or '', reverse=True)[:10]
        recent_activities = [{
            'id': i['id'],
            'text': i['text'],
            'action': i['status'],
            'timestamp': i['updatedAt'] or i['createdAt'],
            'category': i['category'] or 'other',
            'priority': i['priority'] or 'low'
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
            'peakProductivityHour': peak_hour,
            'peakProductivityDay': peak_day,
            'avgCompletionTime': avg_completion,
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