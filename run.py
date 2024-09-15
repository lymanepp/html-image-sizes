import os
import glob
import re
import sys
from PIL import Image

IMG_PATTERN = re.compile(r'(<img[^>]*src="([^"]+)"[^>]*>)', re.IGNORECASE)

def get_image_dimensions(image_path):
    try:
        with Image.open(image_path) as img:
            return img.width, img.height
    except Exception as e:
        print(f"Warning: could not get dimensions for image: {image_path}. Error: {e}")
        return None, None

def process_html_file(file_path, base_dir):
    def add_dimensions_to_img_tag(match):
        img_tag = match.group(1)
        img_src = match.group(2)

        # Handle leading "/" in img_src
        if img_src.startswith('/'):
            img_src = img_src[1:]

        image_path = os.path.join(base_dir, img_src)
        if not os.path.exists(image_path):
            print(f"Warning: image not found: {image_path}")
            return img_tag

        width, height = get_image_dimensions(image_path)
        if not (width and height):
            return img_tag
        
        # Remove existing width and height attributes
        img_tag = re.sub(r' +height="[^"]*"', '', img_tag)
        img_tag = re.sub(r' +width="[^"]*"', '', img_tag)

        return re.sub(r'(/>)', f' height="{height}" width="{width}" \\1', img_tag)

    with open(file_path, 'r', encoding='utf-8') as file:
        html_content = file.read()

    updated_html_content = IMG_PATTERN.sub(add_dimensions_to_img_tag, html_content)

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(updated_html_content)
    
    print(f"Processed and updated: {file_path}")

def process_all_html_files(base_dir):
    html_files = glob.glob(os.path.join(base_dir, '**', '*.html'), recursive=True)
    for html_file in html_files:
        process_html_file(html_file, base_dir)

process_all_html_files(sys.argv[1])
