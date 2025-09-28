import os

# Path to your sounds folder
sounds_dir = "./data/welsh word/audio/audio_chunks"
output_file = "./constants/soundMap.ts"

def generate_sound_map():
    # Get all .mp3 files
    files = [f for f in os.listdir(sounds_dir) if f.endswith(".mp3")]

    entries = []
    for file in files:
        key = file.replace(".mp3", "").replace("_", " ")  # underscores -> spaces
        entry = f'  "{key}": require("@/data/welsh word/audio/audio_chunks/{file}"),'
        entries.append(entry)

    content = "export const soundMap: Record<string, any> = {\n" + "\n".join(entries) + "\n};\n"

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ soundMap.ts generated with {len(files)} entries.")

if __name__ == "__main__":
    generate_sound_map()