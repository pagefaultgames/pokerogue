Get-ChildItem -Path $dir -Filter *.png | ForEach-Object {
	magick.exe convert $_.FullName -gravity center -extent 40x30 $_.FullName
}