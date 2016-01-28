var FileLoader = (function () {
    function FileLoader(element) {
        this._element = element;
        this._element.onchange = this._handle.bind(this);
    }
    FileLoader.prototype._handle = function () {
        var _this = this;
        var reader = new FileReader();
        var file = this._element.files[0];
        if (!file)
            return;
        var doc = new JsonDoc();
        doc.name = file.name;
        reader.onload = function (event) {
            var target = event.target;
            doc.contents = target.result;
            _this._cb(doc);
        };
        reader.readAsText(file);
    };
    FileLoader.prototype.openLocal = function (cb) {
        this._cb = cb;
        this._element.click();
    };
    return FileLoader;
})();
var JsonDoc = (function () {
    function JsonDoc() {
    }
    JsonDoc.prototype.asObject = function () {
        if (!this._object)
            this._object = JSON.parse(this.contents);
        return this._object;
    };
    return JsonDoc;
})();
