SET "PATH=C:/Program Files/CodeAndWeb/TexturePacker/bin;%PATH%" 

forfiles /s /m *.gif /c "cmd /c mkdir  @FNAME && ffmpeg -i "@FILE" @FNAME/%%04d.png"