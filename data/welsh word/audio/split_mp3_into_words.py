from pydub import AudioSegment
from pydub.silence import split_on_silence
import os

# Your multiline string
lines = """bore da
croeso
diolch
helo
hwyl
da bo
iawn
dim
ie
nos da
noswaith dda
prynhawn da
shwmae
plîs
maer
sori"""

# Convert string to list
labels = lines.strip().split('\n')

# Load MP3 file
input_file = "greetings_coral.mp3"  # Replace with your MP3 file path
audio = AudioSegment.from_mp3(input_file)

# Split audio on silence (0.5 sec silence, threshold relative to dBFS)
chunks = split_on_silence(
    audio,
    min_silence_len=500,  # 0.5 seconds
    silence_thresh=audio.dBFS - 16,
    keep_silence=100
)

# Create output directory
output_dir = "audio_chunks"
os.makedirs(output_dir, exist_ok=True)

# Export chunks with corresponding labels
for i, chunk in enumerate(chunks):
    if i < len(labels):
        filename = f"{labels[i].strip().replace(' ', '_')}.mp3"
    else:
        filename = f"extra_chunk_{i}.mp3"
    chunk.export(os.path.join(output_dir, filename), format="mp3")

print(f"Saved {len(chunks)} audio chunks to '{output_dir}' directory.")