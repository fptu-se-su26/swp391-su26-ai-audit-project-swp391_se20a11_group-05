from PIL import Image
import shutil

src_img = r"C:\Users\Admin\.gemini\antigravity\brain\3fc88312-2a60-43d6-a1c6-c66e750d9bb5\media__1781696082815.png"
dest_img = r"Sources\Frontend\src\assets\police-emblem.png"

# Copy the original file first just in case
shutil.copy2(src_img, dest_img)

img = Image.open(dest_img)
img = img.convert("RGBA")

datas = img.getdata()
newData = []
for item in datas:
    # If pixel is mostly white
    if item[0] > 230 and item[1] > 230 and item[2] > 230:
        newData.append((255, 255, 255, 0))
    else:
        newData.append(item)

img.putdata(newData)
img.save(dest_img, "PNG")
print("White background removed!")
