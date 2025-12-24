import torch
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments
)
from sklearn.metrics import precision_recall_fscore_support, accuracy_score

# =====================
# CONFIG
# =====================
MODEL_NAME = "vinai/phobert-base"
CSV_PATH = "data.csv"
OUTPUT_DIR = "./output"
MAX_LENGTH = 128
BATCH_SIZE = 16
EPOCHS = 3
LR = 2e-5

# =====================
# LOAD DATA
# =====================
dataset = load_dataset("csv", data_files=CSV_PATH)

# Split train / test
dataset = dataset["train"].train_test_split(test_size=0.2, seed=42)

# =====================
# TOKENIZER
# =====================
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def tokenize_fn(batch):
    return tokenizer(
        batch["text"],
        truncation=True,
        padding="max_length",
        max_length=MAX_LENGTH
    )

dataset = dataset.map(tokenize_fn, batched=True)
dataset = dataset.rename_column("label", "labels")
dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])

# =====================
# MODEL
# =====================
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    num_labels=2
)

# =====================
# METRICS
# =====================
def compute_metrics(pred):
    labels = pred.label_ids
    preds = pred.predictions.argmax(-1)

    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, preds, average="binary"
    )
    acc = accuracy_score(labels, preds)

    return {
        "accuracy": acc,
        "precision": precision,
        "recall": recall,
        "f1": f1
    }

# =====================
# TRAINING ARGS
# =====================
args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    eval_strategy="epoch",   # 🔥 ĐỔI Ở ĐÂY
    save_strategy="epoch",
    learning_rate=LR,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    num_train_epochs=EPOCHS,
    weight_decay=0.01,
    logging_dir="./logs",
    logging_steps=50,
    load_best_model_at_end=True,
    metric_for_best_model="f1",
    save_total_limit=2,
    report_to="none"
)

# =====================
# TRAINER
# =====================
trainer = Trainer(
    model=model,
    args=args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
    tokenizer=tokenizer,
    compute_metrics=compute_metrics
)

# =====================
# TRAIN
# =====================
trainer.train()

# =====================
# SAVE FINAL MODEL
# =====================
trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print("Training completed. Model saved to:", OUTPUT_DIR)
