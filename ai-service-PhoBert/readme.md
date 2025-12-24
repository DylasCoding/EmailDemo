| Method | Endpoint         | Mục đích                             |
| ------ | ---------------- | ------------------------------------ |
| GET    | `/health`        | Kiểm tra server còn sống             |
| POST   | `/predict`       | Dự đoán 1 câu có phải lịch hẹn không |
| POST   | `/predict/batch` | Dự đoán nhiều câu cùng lúc           |
| GET    | `/model/info`    | Thông tin model đang load            |

uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 1

http://127.0.0.1:8001

BERT(Bidirectional Encoder Representations from Transformers) : mô hình học sẵn hay còn gọi là pre-train model, học ra các vector đại diện theo ngữ cảnh 2 chiều của từ, được sử dụng để transfer sang các bài toán khác trong lĩnh vực xử lý ngôn ngữ tự nhiên

Pre-trained PhoBERT models are the state-of-the-art language models for Vietnamese (Pho, i.e. "Phở", is a popular food in Vietnam).
Fine-tune PhoBERT

step:
0. install libraries in requirements.txt
1. Load pre-trained PhoBERT model
2. uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 1