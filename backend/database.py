import sqlite3
import json
from datetime import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'mixed_dashboard.db')

def get_db_connection():
    """Создает подключение к базе данных"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def parse_iso_datetime(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except Exception:
        return None

def infer_due_from_created_at(created_at):
    dt = parse_iso_datetime(created_at)
    if not dt:
        return None, None
    return dt.strftime('%Y-%m-%d'), dt.strftime('%H:%M')

def init_database():
    """Инициализация базы данных с таблицами"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Таблица пользователей
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_login TEXT,
        profile_data TEXT,
        settings_data TEXT
    )
    ''')
    
    # Таблица задач Dashboard (с добавленными полями due_date и due_time)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS dashboard_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        text TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT,
        category TEXT,
        due_date TEXT,
        due_time TEXT,
        due_source TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Проверяем и добавляем новые колонки если их нет (для существующих БД)
    cursor.execute("PRAGMA table_info(dashboard_items)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'due_date' not in columns:
        cursor.execute('ALTER TABLE dashboard_items ADD COLUMN due_date TEXT')
        print('✅ Добавлена колонка due_date')
    
    if 'due_time' not in columns:
        cursor.execute('ALTER TABLE dashboard_items ADD COLUMN due_time TEXT')
        print('✅ Добавлена колонка due_time')

    if 'due_source' not in columns:
        cursor.execute('ALTER TABLE dashboard_items ADD COLUMN due_source TEXT')
        print('✅ Добавлена колонка due_source')

    cursor.execute("""
    UPDATE dashboard_items
    SET due_source = 'manual'
    WHERE due_source IS NULL
      AND due_date IS NOT NULL
      AND TRIM(due_date) <> ''
    """)

    cursor.execute("""
    SELECT id, created_at
    FROM dashboard_items
    WHERE (due_source IS NULL OR TRIM(due_source) = '')
      AND (due_date IS NULL OR TRIM(due_date) = '')
    """)
    legacy_rows = cursor.fetchall()

    for row in legacy_rows:
        inferred_due_date, inferred_due_time = infer_due_from_created_at(row['created_at'])
        if not inferred_due_date:
            continue
        cursor.execute("""
        UPDATE dashboard_items
        SET due_date = ?, due_time = ?, due_source = 'inferred_created_at'
        WHERE id = ?
        """, (inferred_due_date, inferred_due_time, row['id']))

    if legacy_rows:
        print(f'✅ Восстановлены сроки для {len(legacy_rows)} legacy-задач')
    
    # Таблица активности пользователей
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Создаем демо-пользователя если его нет
    cursor.execute('SELECT id FROM users WHERE email = ?', ('demo@example.com',))
    if not cursor.fetchone():
        demo_user = {
            'id': 'demo-user-001',
            'email': 'demo@example.com',
            'password': 'demo123',
            'first_name': 'Демо',
            'last_name': 'Пользователь',
            'created_at': '2025-01-01T00:00:00Z',
            'last_login': datetime.now().isoformat(),
            'profile_data': json.dumps({
                'phone': '+7 700 123 4567',
                'bio': 'Демонстрационный аккаунт',
                'company': 'Demo Company',
                'position': 'Тестовый пользователь',
                'location': 'Алматы, Казахстан',
                'website': 'https://example.com',
                'github': 'demouser',
                'linkedin': 'demouser',
                'twitter': 'demouser'
            }),
            'settings_data': json.dumps({
                'emailNotifications': True,
                'pushNotifications': False,
                'weeklyDigest': True,
                'language': 'ru',
                'timezone': 'Asia/Almaty',
                'dateFormat': 'DD.MM.YYYY',
                'theme': 'auto'
            })
        }
        
        cursor.execute('''
        INSERT INTO users (id, email, password, first_name, last_name, created_at, last_login, profile_data, settings_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            demo_user['id'],
            demo_user['email'],
            demo_user['password'],
            demo_user['first_name'],
            demo_user['last_name'],
            demo_user['created_at'],
            demo_user['last_login'],
            demo_user['profile_data'],
            demo_user['settings_data']
        ))
        
        # Создаем демо-задачи с датами и временем
        demo_tasks = [
            {
                'id': 'task-demo-1',
                'user_id': 'demo-user-001',
                'text': 'Изучить основы React',
                'status': 'completed',
                'priority': 'high',
                'category': 'Обучение',
                'due_date': '2025-01-20',
                'due_time': '15:00',
                'due_source': 'manual',
                'created_at': '2025-01-15T10:00:00Z',
                'updated_at': '2025-01-20T15:00:00Z'
            },
            {
                'id': 'task-demo-2',
                'user_id': 'demo-user-001',
                'text': 'Настроить рабочее окружение',
                'status': 'completed',
                'priority': 'medium',
                'category': 'Работа',
                'due_date': '2025-01-22',
                'due_time': '14:00',
                'due_source': 'manual',
                'created_at': '2025-01-18T09:00:00Z',
                'updated_at': '2025-01-22T14:00:00Z'
            },
            {
                'id': 'task-demo-3',
                'user_id': 'demo-user-001',
                'text': 'Создать дизайн-систему',
                'status': 'active',
                'priority': 'high',
                'category': 'Дизайн',
                'due_date': '2025-02-15',
                'due_time': '16:00',
                'due_source': 'manual',
                'created_at': '2025-02-01T11:00:00Z',
                'updated_at': '2025-02-05T16:00:00Z'
            },
            {
                'id': 'task-demo-4',
                'user_id': 'demo-user-001',
                'text': 'Написать документацию',
                'status': 'active',
                'priority': 'medium',
                'category': 'Документация',
                'due_date': '2025-02-20',
                'due_time': '10:00',
                'due_source': 'manual',
                'created_at': '2025-02-03T13:00:00Z',
                'updated_at': '2025-02-08T10:00:00Z'
            },
            {
                'id': 'task-demo-5',
                'user_id': 'demo-user-001',
                'text': 'Провести код-ревью',
                'status': 'active',
                'priority': 'low',
                'category': 'Разработка',
                'due_date': '2025-02-18',
                'due_time': '12:00',
                'due_source': 'manual',
                'created_at': '2025-02-09T08:00:00Z',
                'updated_at': '2025-02-10T12:00:00Z'
            }
        ]
        
        for task in demo_tasks:
            cursor.execute('''
            INSERT INTO dashboard_items (id, user_id, text, status, priority, category, due_date, due_time, due_source, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                task['id'],
                task['user_id'],
                task['text'],
                task['status'],
                task['priority'],
                task['category'],
                task['due_date'],
                task['due_time'],
                task['due_source'],
                task['created_at'],
                task['updated_at']
            ))
    
    conn.commit()
    conn.close()
    print('✅ База данных инициализирована')

def log_activity(user_id, action, details=None):
    """Логирование активности пользователя"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    INSERT INTO user_activities (user_id, action, details, timestamp)
    VALUES (?, ?, ?, ?)
    ''', (user_id, action, json.dumps(details) if details else None, datetime.now().isoformat()))
    
    conn.commit()
    conn.close()

# Инициализируем базу при импорте
init_database()
