#!/bin/bash
rm -rf ts;
rm -rf *.ts;
rm -rf *.png;
mkdir ts;
for i in *.mp4 ;
do
    # ffmpeg -i "$i" -f mpegts -codec:v mpeg1video -vf scale=-1:640 -an -b:v 3000k "${i%.*}.ts"
    # 转码 ts
    ffmpeg -i "$i" -f mpegts -codec:v mpeg1video -an -b:v 3000k "${i%.*}.ts"
    # 生成海报
    # ffmpeg -i "$i" -ss 00:00:01.000 -vframes 1 "${i%.*}.png"
done;
open .;
