let cacheBuster = '';

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
        if (!Array.isArray(file))
            file = [ file ];
    
        file.forEach(item => item.url += '?v=' + cacheBuster);

        super.addFile(file);
    }
}