import csv
import json

# Input and output file paths
input_file = "grouped_welsh_words.csv"
output_file = "grouped_welsh_words.json"

grouped_words = []

# Try UTF-8 first, fallback to ISO-8859-1 if needed
try:
    csvfile = open(input_file, mode="r", encoding="utf-8")
except UnicodeDecodeError:
    csvfile = open(input_file, mode="r", encoding="ISO-8859-1")

with csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        group = row["Group"].strip()
        welsh = row["Welsh"].strip()
        english = row["English"].strip()

        grouped_words.append({
            "welsh": welsh,
            "english": english,
            "group": group
        })

with open(output_file, mode="w", encoding="utf-8") as jsonfile:
    json.dump(grouped_words, jsonfile, indent=2, ensure_ascii=False)

print(f"Conversion complete! JSON saved to {output_file}")
