const path = require('path');
const child_process = require('child_process');

module.exports = class ImageConverter {

    constructor({libwebpConfig}) {
        this.libwebpConfig = libwebpConfig;
    }

    convertImage(imageStream) {
        const decoderPath = path.join(this.libwebpConfig.basePath, 'bin/dwebp');
        const convertStdioAndWriteToStdoutArguments = ['-o', '-', '--', '-'];
        const decoderProcess = child_process.spawn(
            decoderPath,
            convertStdioAndWriteToStdoutArguments
        );
        decoderProcess.stderr.on('data', (err) => console.log(err.toString()));
        imageStream.pipe(decoderProcess.stdin);
        return {
            convertedImage: decoderProcess.stdout,
            convertedContentType: 'image/png'
        };
    }
}
