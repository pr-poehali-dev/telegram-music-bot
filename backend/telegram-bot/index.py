import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''Telegram бот для поиска и скачивания музыки с VK и Яндекс.Музыки'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not bot_token:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Bot token not configured'})
        }
    
    try:
        update = json.loads(event.get('body', '{}'))
        
        if 'message' not in update:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'ok': True})
            }
        
        message = update['message']
        chat_id = message['chat']['id']
        user = message['from']
        text = message.get('text', '')
        
        conn = get_db_connection()
        user_id = ensure_user_exists(conn, user)
        
        if text.startswith('/start'):
            send_welcome(bot_token, chat_id)
        
        elif text.startswith('/search'):
            query = text.replace('/search', '').strip()
            if query:
                search_music(bot_token, chat_id, query, user_id, conn)
            else:
                send_message(bot_token, chat_id, '🔍 Используйте: /search название трека')
        
        elif text.startswith('/favorites'):
            show_favorites(bot_token, chat_id, user_id, conn)
        
        elif text.startswith('/history'):
            show_history(bot_token, chat_id, user_id, conn)
        
        elif text.startswith('/playlists'):
            show_playlists(bot_token, chat_id, user_id, conn)
        
        elif text.startswith('/help'):
            send_help(bot_token, chat_id)
        
        else:
            search_music(bot_token, chat_id, text, user_id, conn)
        
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'ok': True})
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    return conn


def ensure_user_exists(conn, user_data):
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            INSERT INTO {schema}.users (telegram_id, username, first_name, last_name, language_code)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (telegram_id) 
            DO UPDATE SET 
                username = EXCLUDED.username,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        ''', (
            user_data['id'],
            user_data.get('username'),
            user_data.get('first_name'),
            user_data.get('last_name'),
            user_data.get('language_code', 'ru')
        ))
        conn.commit()
        return cur.fetchone()['id']


def send_message(bot_token, chat_id, text, reply_markup=None):
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    data = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    if reply_markup:
        data['reply_markup'] = json.dumps(reply_markup)
    requests.post(url, json=data)


def send_welcome(bot_token, chat_id):
    keyboard = {
        'keyboard': [
            [{'text': '🎵 Яндекс Музыка'}, {'text': '🔵 ВКонтакте'}],
            [{'text': '❤️ Избранное'}, {'text': '📜 История'}],
            [{'text': '📁 Плейлисты'}, {'text': '❓ Помощь'}]
        ],
        'resize_keyboard': True
    }
    
    welcome_text = '''🎵 <b>Добро пожаловать в Music Bot!</b>

Я помогу найти и скачать музыку из:
• 🟡 Яндекс.Музыка
• 🔵 ВКонтакте
• 🔴 МТС Музыка (скоро)

<b>Как пользоваться:</b>
1. Просто отправьте название трека или исполнителя
2. Или используйте команду /search название трека
3. Добавляйте треки в избранное ❤️
4. Создавайте плейлисты 📁

<b>Команды:</b>
/search - поиск музыки
/favorites - избранное
/history - история прослушиваний
/playlists - мои плейлисты
/help - помощь'''
    
    send_message(bot_token, chat_id, welcome_text, keyboard)


def send_help(bot_token, chat_id):
    help_text = '''❓ <b>Помощь</b>

<b>Поиск музыки:</b>
• Просто напишите название или исполнителя
• /search Макс Корж Малый повзрослел

<b>Команды:</b>
/favorites - показать избранное
/history - история прослушиваний
/playlists - управление плейлистами

<b>Функции:</b>
• ❤️ Добавление в избранное
• 📥 Офлайн-скачивание
• 📁 Создание плейлистов
• 📊 История прослушиваний'''
    
    send_message(bot_token, chat_id, help_text)


def search_music(bot_token, chat_id, query, user_id, conn):
    send_message(bot_token, chat_id, f'🔍 Ищу "{query}"...')
    
    vk_token = os.environ.get('VK_SERVICE_TOKEN')
    
    if not vk_token:
        send_message(bot_token, chat_id, '⚠️ VK API не настроен. Пожалуйста, настройте VK_SERVICE_TOKEN.')
        return
    
    try:
        url = 'https://api.vk.com/method/audio.search'
        params = {
            'q': query,
            'count': 10,
            'access_token': vk_token,
            'v': '5.131'
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if 'error' in data:
            send_message(bot_token, chat_id, f'❌ Ошибка VK API: {data["error"].get("error_msg")}')
            return
        
        tracks = data.get('response', {}).get('items', [])
        
        if not tracks:
            send_message(bot_token, chat_id, '😔 Ничего не найдено. Попробуйте другой запрос.')
            return
        
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        result_text = f'🎵 <b>Найдено {len(tracks)} треков:</b>\n\n'
        
        for idx, track in enumerate(tracks[:5], 1):
            title = track.get('title', 'Без названия')
            artist = track.get('artist', 'Неизвестен')
            duration = track.get('duration', 0)
            track_url = track.get('url', '')
            
            minutes = duration // 60
            seconds = duration % 60
            duration_str = f'{minutes}:{seconds:02d}'
            
            track_id = save_track(conn, schema, track, 'vk')
            
            result_text += f'{idx}. <b>{artist}</b> - {title}\n   ⏱ {duration_str}\n\n'
            
            if track_url and idx == 1:
                send_audio(bot_token, chat_id, track_url, artist, title)
        
        send_message(bot_token, chat_id, result_text)
        
    except Exception as e:
        send_message(bot_token, chat_id, f'❌ Ошибка поиска: {str(e)}')


def save_track(conn, schema, track_data, service):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            INSERT INTO {schema}.tracks (external_id, service, title, artist, duration, url)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (external_id, service) DO UPDATE 
            SET url = EXCLUDED.url
            RETURNING id
        ''', (
            str(track_data.get('id', '')),
            service,
            track_data.get('title', 'Без названия'),
            track_data.get('artist', 'Неизвестен'),
            track_data.get('duration', 0),
            track_data.get('url', '')
        ))
        conn.commit()
        return cur.fetchone()['id']


def send_audio(bot_token, chat_id, audio_url, artist, title):
    try:
        url = f'https://api.telegram.org/bot{bot_token}/sendAudio'
        data = {
            'chat_id': chat_id,
            'audio': audio_url,
            'title': title,
            'performer': artist
        }
        requests.post(url, json=data, timeout=30)
    except:
        pass


def show_favorites(bot_token, chat_id, user_id, conn):
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            SELECT t.title, t.artist, t.duration, t.url
            FROM {schema}.favorites f
            JOIN {schema}.tracks t ON f.track_id = t.id
            WHERE f.user_id = %s
            ORDER BY f.created_at DESC
            LIMIT 20
        ''', (user_id,))
        
        favorites = cur.fetchall()
    
    if not favorites:
        send_message(bot_token, chat_id, '❤️ Избранное пусто. Добавьте треки!')
        return
    
    text = f'❤️ <b>Ваше избранное ({len(favorites)} треков):</b>\n\n'
    
    for idx, track in enumerate(favorites, 1):
        duration = track['duration'] or 0
        minutes = duration // 60
        seconds = duration % 60
        text += f'{idx}. <b>{track["artist"]}</b> - {track["title"]}\n'
    
    send_message(bot_token, chat_id, text)


def show_history(bot_token, chat_id, user_id, conn):
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            SELECT t.title, t.artist, h.listened_at
            FROM {schema}.listening_history h
            JOIN {schema}.tracks t ON h.track_id = t.id
            WHERE h.user_id = %s
            ORDER BY h.listened_at DESC
            LIMIT 20
        ''', (user_id,))
        
        history = cur.fetchall()
    
    if not history:
        send_message(bot_token, chat_id, '📜 История пуста')
        return
    
    text = f'📜 <b>История прослушиваний ({len(history)}):</b>\n\n'
    
    for idx, item in enumerate(history, 1):
        text += f'{idx}. <b>{item["artist"]}</b> - {item["title"]}\n'
    
    send_message(bot_token, chat_id, text)


def show_playlists(bot_token, chat_id, user_id, conn):
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            SELECT p.id, p.name, COUNT(pt.track_id) as track_count
            FROM {schema}.playlists p
            LEFT JOIN {schema}.playlist_tracks pt ON p.id = pt.playlist_id
            WHERE p.user_id = %s
            GROUP BY p.id, p.name
            ORDER BY p.created_at DESC
        ''', (user_id,))
        
        playlists = cur.fetchall()
    
    if not playlists:
        send_message(bot_token, chat_id, '📁 У вас нет плейлистов. Создайте первый!')
        return
    
    text = f'📁 <b>Ваши плейлисты ({len(playlists)}):</b>\n\n'
    
    for idx, pl in enumerate(playlists, 1):
        text += f'{idx}. {pl["name"]} ({pl["track_count"]} треков)\n'
    
    send_message(bot_token, chat_id, text)
