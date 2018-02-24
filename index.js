const Cluster         = require('cluster');
const numCPUs = require('os').cpus().length;

const File            = require('fs');
const Path            = require('path');
const Jimp            = require('jimp');
const generateBMFont  = require('msdf-bmfont-xml');


const Charset        = require('./charset').map((charCode)=>String.fromCharCode(charCode));
const PATH_FONTS_LIB = Path.resolve(__dirname, './lib/fonts');
const PATH_FONTS     = Path.resolve(__dirname, './fonts');

if(Cluster.isMaster) {
  console.info(`Master ${process.pid} is running`);

  const LIST_FONTS = File.readdirSync(PATH_FONTS)
    // from source
    .filter((name)=>name.indexOf('.') !== 0)
    .filter((name)=>File.lstatSync(Path.resolve(PATH_FONTS, name)).isDirectory())
    .map((group)=>{
      const PATH_FONT_GROUP = Path.resolve(PATH_FONTS, group);
      return File.readdirSync(PATH_FONT_GROUP)
        .filter((name)=>name.indexOf('.') !== 0)
        .filter((name)=>File.lstatSync(Path.resolve(PATH_FONT_GROUP, name)).isDirectory())
        .map((fontname) => `${group}/${fontname}`);
    })
    .reduce((output, fonts) => output.concat(fonts), [])
    // from lib
    .filter((path) => {
      const PATH_FONT_LIB = Path.resolve(PATH_FONTS_LIB, path);
      return File.existsSync(PATH_FONT_LIB) && File.lstatSync(PATH_FONT_LIB).isDirectory();
    })
    .map((path) => {
      const PATH_FONT_LIB = Path.resolve(PATH_FONTS_LIB, path);
      return File.readdirSync(PATH_FONT_LIB)
        .filter((name)=>/\.ttf$/.test(name))
        .map((fontfile) => `${path}/${Path.basename(fontfile, '.ttf')}`);
    })
    .reduce((output, fonts) => output.concat(fonts), [])

  let OFFSET_FONT = 0;
  Cluster.on('fork', (worker) => {
    const PATH_FONT = LIST_FONTS[OFFSET_FONT++];
    if(PATH_FONT)
      worker.send({ cmd: 'compile', font: PATH_FONT });
    else
      worker.send({ cmd: 'exit' });
  });
  Cluster.on('message', (worker, message, handle) => {
    if(message.cmd === 'finish') {
      const PATH_FONT = LIST_FONTS[OFFSET_FONT++];
      if(PATH_FONT)
        worker.send({ cmd: 'compile', font: PATH_FONT });
      else
        worker.send({ cmd: 'exit' });
    }
  });
  Cluster.on('exit', (worker, code, signal) => {
    
  });
  for (let i = 0; i < numCPUs; i++) { Cluster.fork(); }
} else {
  console.info(`Worker ${process.pid} started`);
  process.on('message', (message) => {
    if(message.cmd === 'compile') {
      const PATH_FONT_TTF      = Path.resolve(PATH_FONTS_LIB, `${message.font}.ttf`);
      const PATH_FILE_FONTDATA = Path.resolve(PATH_FONTS, `${message.font}.json`);
      const PATH_FILE_TEXTURES = Path.resolve(PATH_FONTS, `${message.font}.png`);
      if(File.existsSync(PATH_FILE_FONTDATA) && File.existsSync(PATH_FILE_TEXTURES)) {
        return process.send({ cmd: 'finish' });
      }
      generateBMFont(PATH_FONT_TTF, {
        // charset: Charset,
        fontSize: 42,
        textureSize: [2048, 2048],
        outputType: 'json',
      }, (error, textures, font) => {
        if (!error) {
          Promise.all(textures.map((sheet) => {
            return new Promise((resolve, reject) => {
              Jimp.read(sheet.texture, (err, image) => {
                if(err) return reject(err);
                return image.invert().getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                  if(err) return reject(err);
                  File.writeFileSync(PATH_FILE_TEXTURES, buffer);
                  resolve();
                })
              })
            });
          }))
          .then(() => File.writeFileSync(PATH_FILE_FONTDATA, font.data))
          .catch((error) => {
            console.error(error);
            File.existsSync(PATH_FILE_FONTDATA) && File.unlinkSync(PATH_FILE_FONTDATA);
            File.existsSync(PATH_FILE_TEXTURES) && File.unlinkSync(PATH_FILE_TEXTURES);
          })
          .then(() => process.send({ cmd: 'finish' }));
        } else {
          process.send({ cmd: 'finish' });
        }
      });
    }
    if(message.cmd === 'exit') {
      process.exit(0);
    }
  })
}