HashSet = function() {
	this._dict = {}; // should only have values of true

	this.contains = function(key) {
		return this._dict[key];
	};

	this.add = function(key) {
		this._dict[key] = true;
	};

	this.remove = function(key) {
		delete this._dict[key];
	};
};
