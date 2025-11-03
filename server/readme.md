Client gọi API:

POST /api/auth/register

POST /api/auth/login → trả token JWT

POST /api/mail/send (Header: Authorization: Bearer <token>)

GET /api/mail/inbox → trả danh sách mail mã hóa

GET /api/mail/:id → xem chi tiết mail