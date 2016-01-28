class FileLoader {
    private _element: HTMLInputElement;
    private _cb: (doc: JsonDoc) => void;
    constructor(element: HTMLInputElement) {
        this._element = element;
        this._element.onchange = this._handle.bind(this);
    }
    private _handle() {
        var reader = new FileReader();
        var file = this._element.files[0];
        if (!file)
            return;
        var doc = new JsonDoc();
        doc.name = file.name;
        reader.onload = (event) => {
            var target: any = event.target;
            doc.contents = target.result;
            this._cb(doc);
        };
        reader.readAsText(file);
    }
    openLocal(cb: (doc: JsonDoc) => void) {
        this._cb = cb;
        this._element.click();
    }
}

class JsonDoc {
    private _object: any;
    asObject(): any {
        if (!this._object)
            this._object = JSON.parse(this.contents);
        return this._object;
    }
    contents: string;
    name: string;
}