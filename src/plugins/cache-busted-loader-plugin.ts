let cacheBuster = '';

const ignoredFiles = [ 'intro_dark' ];

export default class CacheBustedLoaderPlugin extends Phaser.Loader.LoaderPlugin {
    constructor(scene: Phaser.Scene) {
        super(scene)
    }

    get cacheBuster() {
        return cacheBuster
    }

    set cacheBuster(version) {
        cacheBuster = version
    }

    addFile(file): void {
        if (ignoredFiles.includes(file?.key))
            return;

        if (!Array.isArray(file))
            file = [ file ]

        if (cacheBuster)
            file.forEach(item => item.url += '?v=' + cacheBuster);

        super.addFile(file);
    }
}