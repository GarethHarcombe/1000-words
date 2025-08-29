import csv
import json

# Input and output file paths
input_file = "grouped_welsh_words.csv"
output_file = "grouped_welsh_words.json"

grouped_words = []

# Try UTF-8 first, fallback to ISO-8859-1 if needed
try:
    csvfile = open(input_file, mode="r", encoding="ISO-8859-1")
except UnicodeDecodeError:
    csvfile = open(input_file, mode="r", encoding="ISO-8859-1")

curr_index = 0

with csvfile:
    reader = csv.DictReader(csvfile)
    for row_num, row in enumerate(reader, start=1):
        try:
            group = row["Group"].strip()
            welsh = row["Welsh"].strip()
            english = row["English"].strip()
            index = curr_index
            curr_index += 1

            grouped_words.append({
                "welsh": welsh,
                "english": english,
                "group": group,
                "index": index
            })
        except:
            print(f"Skipping row {row_num} due to error:")

with open(output_file, mode="w", encoding="utf-8") as jsonfile:
    json.dump(grouped_words, jsonfile, indent=2, ensure_ascii=False)

print(f"Conversion complete! JSON saved to {output_file}")
