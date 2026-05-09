# Postman Collection for Edit Profile API

## Base URL
```
http://localhost:8080
```

## Environment Variables
Tạo environment với các biến:
- `base_url`: `http://localhost:8080`
- `access_token`: (sẽ được lưu sau login)

---

## 1. REGISTER
**POST** `/auth/register`

**Body (raw JSON):**
```json
{
  "email": "user1@example.com",
  "phone": "0901234567",
  "password": "123456",
  "role_id": 2
}
```

**Response (201):**
```json
{
  "status": 201,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "user1@example.com",
    "phone": "0901234567"
  }
}
```

**Test Script (để lưu email/phone cho login):**
```javascript
if (pm.response.code === 201) {
    pm.environment.set("user_email", pm.response.json().data.email);
    pm.environment.set("user_phone", pm.response.json().data.phone);
}
```

---

## 2. LOGIN
**POST** `/auth/login`

**Body (raw JSON):**
```json
{
  "email_or_phone": "user1@example.com",
  "password": "123456"
}
```

**Hoặc dùng phone:**
```json
{
  "email_or_phone": "0901234567",
  "password": "123456"
}
```

**Response (200):**
```json
{
  "status": 200,
  "message": "Login success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user1@example.com",
      "phone": "0901234567",
      "role": "user"
    }
  }
}
```

**Test Script (để lưu tokens):**
```javascript
if (pm.response.code === 200) {
    pm.environment.set("access_token", pm.response.json().data.accessToken);
    pm.environment.set("refresh_token", pm.response.json().data.refreshToken);
    pm.environment.set("user_id", pm.response.json().data.user.id);
}
```

---

## 3. REFRESH TOKEN
**POST** `/auth/refresh`

**Body (raw JSON):**
```json
{
  "refreshToken": "{{refresh_token}}"
}
```

**Response (200):**
```json
{
  "status": 200,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Test Script (để cập nhật tokens mới):**
```javascript
if (pm.response.code === 200) {
    pm.environment.set("access_token", pm.response.json().data.accessToken);
    pm.environment.set("refresh_token", pm.response.json().data.refreshToken);
}
```

---

## 4. LOGOUT
**POST** `/auth/logout`

**Body (raw JSON):**
```json
{
  "refreshToken": "{{refresh_token}}"
}
```

**Response (200):**
```json
{
  "status": 200,
  "message": "Logged out successfully"
}
```

---

## 5. GET USER PROFILE
**GET** `/user/profile`

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Response (200):**
```json
{
  "status": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "user_id": 1,
    "first_name": null,
    "last_name": null,
    "id_card": null,
    "avatar_url": null,
    "cover_photo_url": null,
    "updated_at": "2024-05-08T10:00:00.000Z"
  }
}
```

**Hoặc (404 nếu chưa có profile):**
```json
{
  "status": 200,
  "message": "Profile retrieved successfully",
  "data": {}
}
```

---

## 6. UPDATE USER PROFILE
**PUT** `/user/profile`

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body (raw JSON):**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "id_card": "123456789",
  "avatar_url": "https://example.com/avatar.jpg",
  "cover_photo_url": "https://example.com/cover.jpg"
}
```

**Response (200):**
```json
{
  "status": 200,
  "message": "Profile updated successfully",
  "data": {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "id_card": "123456789",
    "avatar_url": "https://example.com/avatar.jpg",
    "cover_photo_url": "https://example.com/cover.jpg",
    "updated_at": "2024-05-08T10:30:00.000Z"
  }
}
```

---

## Thứ tự test khuyến nghị:

1. **Register** - Tạo user mới
2. **Login** - Đăng nhập để lấy tokens
3. **Get Profile** - Lấy profile (trống)
4. **Update Profile** - Cập nhật profile
5. **Get Profile** - Lấy profile (đã cập nhật)
6. **Refresh Token** - Làm mới access token
7. **Logout** - Đăng xuất

---

## Lưu ý quan trọng:

1. **Cần cài đặt dependencies:**
   ```bash
   npm install jsonwebtoken bcryptjs express-rate-limit cookie-parser
   ```

2. **Cần tạo .env file:**
   ```
   DB_NAME=testdb
   DB_USER=root
   DB_PASSWORD=123456
   DB_HOST=127.0.0.1
   DB_PORT=3306
   ACCESS_TOKEN_SECRET=your_access_token_secret_key_here
   REFRESH_TOKEN_SECRET=your_refresh_token_secret_key_here
   PORT=8080
   ```

3. **Cần chạy migration:**
   ```bash
   npx sequelize-cli db:migrate
   ```

4. **Cần tạo role trong database** (role_id = 1 cho admin, 2 cho user):
   ```sql
   INSERT INTO roles (id, role_name) VALUES (1, 'admin'), (2, 'user');
   ```

5. **Rate Limiting:** Login chỉ cho phép 5 lần trong 15 phút

6. **Token Expiration:**
   - Access token: 15 phút
   - Refresh token: 7 ngày

---

## Import Collection vào Postman:

1. Copy collection JSON bên dưới
2. Mở Postman → Import → Paste JSON
3. Tạo environment với các biến như hướng dẫn
4. Chạy các request theo thứ tự

```json
{
  "info": {
    "name": "Edit Profile API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"user1@example.com\",\n  \"phone\": \"0901234567\",\n  \"password\": \"123456\",\n  \"role_id\": 2\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{base_url}}/auth/register",
          "host": ["{{base_url}}"],
          "path": ["auth", "register"]
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email_or_phone\": \"{{user_email}}\",\n  \"password\": \"123456\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{base_url}}/auth/login",
          "host": ["{{base_url}}"],
          "path": ["auth", "login"]
        }
      }
    },
    {
      "name": "Refresh Token",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"refreshToken\": \"{{refresh_token}}\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{base_url}}/auth/refresh",
          "host": ["{{base_url}}"],
          "path": ["auth", "refresh"]
        }
      }
    },
    {
      "name": "Logout",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"refreshToken\": \"{{refresh_token}}\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{base_url}}/auth/logout",
          "host": ["{{base_url}}"],
          "path": ["auth", "logout"]
        }
      }
    },
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/user/profile",
          "host": ["{{base_url}}"],
          "path": ["user", "profile"]
        }
      }
    },
    {
      "name": "Update Profile",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"first_name\": \"John\",\n  \"last_name\": \"Doe\",\n  \"id_card\": \"123456789\",\n  \"avatar_url\": \"https://example.com/avatar.jpg\",\n  \"cover_photo_url\": \"https://example.com/cover.jpg\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{base_url}}/user/profile",
          "host": ["{{base_url}}"],
          "path": ["user", "profile"]
        }
      }
    }
  ]
}
```
