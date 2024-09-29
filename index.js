const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const sizeOf = require('image-size');

const IMG_PATTERN = /(<img[^>]*src="([^"]+)"[^>]*>)/gi;

function getImageDimensions(imagePath) {
    try {
        const dimensions = sizeOf(imagePath);
        return { width: dimensions.width, height: dimensions.height };
    } catch (e) {
        console.error(`Warning: could not get dimensions for image: ${imagePath}. Error: ${e}`);
        return { width: null, height: null };
    }
}

async function processHtmlFile(filePath, baseDir) {
    const addDimensionsToImgTag = async (match, imgTag, imgSrc) => {
        // Handle leading "/" in img_src
        if (imgSrc.startsWith('/')) {
            imgSrc = imgSrc.slice(1);
        }

        const imagePath = path.join(baseDir, imgSrc);
        try {
            await fs.access(imagePath);
        } catch {
            console.warn(`Warning: image not found: ${imagePath}`);
            return imgTag;
        }

        const { width, height } = await getImageDimensions(imagePath);
        if (!width || !height) {
            return imgTag;
        }

        // Remove existing width and height attributes
        imgTag = imgTag.replace(/ +height="[^"]*"/g, '').replace(/ +width="[^"]*"/g, '');

        // Add new width and height attributes
        return imgTag.replace(/\/>/, ` height="${height}" width="${width}" />`);
    };

    let htmlContent = await fs.readFile(filePath, 'utf-8');

    const matches = [...htmlContent.matchAll(IMG_PATTERN)];
    for (const match of matches) {
        const newImgTag = await addDimensionsToImgTag(match[0], match[1], match[2]);
        htmlContent = htmlContent.replace(match[0], newImgTag);
    }

    await fs.writeFile(filePath, htmlContent, 'utf-8');
    console.log(`Processed and updated: ${filePath}`);
}

async function processAllHtmlFiles(baseDir) {
    const htmlFiles = glob.sync(path.join(baseDir, '**', '*.html'), { nodir: true });
    for (const htmlFile of htmlFiles) {
        await processHtmlFile(htmlFile, baseDir);
    }
}

// Pass the base directory as the first command line argument
processAllHtmlFiles(process.argv[2]);
