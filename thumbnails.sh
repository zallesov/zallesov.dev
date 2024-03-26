#!/bin/bash

# Directory containing the image files
INPUT_DIR=$1

# Directory where thumbnails will be saved
THUMBNAIL_DIR="$1/thumbnails"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null
then
    echo "ffmpeg could not be found, please install it."
    exit 1
fi

# Create thumbnail directory if it doesn't exist
mkdir -p "$THUMBNAIL_DIR"

# Iterate over all video files in the directory
for image in "$INPUT_DIR"/*.{jpg,png,PNG,jpeg}; do
    # Skip if it's not a file
    [ -f "$image" ] || continue

    # Extract filename without extension
    base_name=$(basename "$image")
    file_name="${base_name%.*}"

    # Create a thumbnail
    ffmpeg -i "$image" -vf "scale=-1:150" -y "$THUMBNAIL_DIR/${file_name}.png"
done

echo "Thumbnails created in $THUMBNAIL_DIR"