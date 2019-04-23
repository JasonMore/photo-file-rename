const { rename, readdir } = require("fs").promises;
const path = require("path");
const { ExifImage } = require("exif");
const program = require("commander");
const { DateTime } = require("luxon");

program
  .version("0.0.1")
  .option("-d, --directory [photoDirectory]", "Photos Directory")
  .parse(process.argv);

const getExifData = image =>
  new Promise((resolve, reject) => {
    try {
      new ExifImage({ image }, function(error, exifData) {
        if (error) return reject(error);
        resolve(exifData);
      });
    } catch (error) {
      reject(error);
    }
  });

const main = async () => {
  const filesToChange = [];

  if (program.directory) {
    const photosDir = await readdir(program.directory);
    const photos = photosDir.map(photo => ({
      fileName: photo,
      path: program.directory
    }));

    filesToChange.push(...photos);
  }

  filesToChange.forEach(async photo => {
    const originalPath = path.join(photo.path, photo.fileName);
    const exifData = await getExifData(originalPath);
    const { DateTimeOriginal } = exifData.exif;

    //2019:01:10 06:46:47
    const photoDate = DateTime.fromFormat(DateTimeOriginal, "yyyy:MM:dd HH:mm:ss");

    //2017-04-20T11:32:00.000
    const photoDateAsIsoFileName = photoDate.toFormat("yyyy-MM-dd_HH-mm-ss");

    const alreadyConverted = photo.fileName.includes(photoDateAsIsoFileName);

    if (alreadyConverted) {
      console.log("already converted ", photo.fileName);
      return;
    }

    const newFileName = `${photoDateAsIsoFileName}_-_${photo.fileName}`;
    const newPath = path.join(photo.path, newFileName);

    console.log(newPath);
    await rename(originalPath, newPath);
  });
};

main();
